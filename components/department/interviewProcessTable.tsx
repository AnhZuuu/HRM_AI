"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableCaption,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateInterviewStageModal } from "./create-interview-stage-modal";
import { toast } from "react-toastify";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

/* =================== Backend Types (align to your API) =================== */
export type BackendInterviewStage = {
  id?: string | number;
  name?: string | null;
  description?: string | null;
  order?: number | null;
  duration?: number | null; // minutes
  type?: string | null; // e.g., "interview" | "technical" | ...
};

export type BackendInterviewProcess = {
  id?: string | number; // some APIs omit id in list; treat as optional
  departmentId: string;
  processName: string;
  description: string | null;
  countOfStage?: number;
  interviewStageModels?: BackendInterviewStage[];
  // ... other audit fields can exist
};

/* =================== UI-NORMALIZED TYPES =================== */
type UiStage = {
  id: string;
  stageName: string;
  description: string | null;
  order: number;
  totalTime: number; // minutes
  typeName: string | null; // display name derived from `type`
};

type UiProcess = {
  id: string;
  departmentId: string;
  processName: string;
  description: string | null;
  stages: UiStage[];
};

type CreatedStage = {
  name: string;
  description: string;
  order: number;
  duration: number;
  typeId: string;
  typeCode: string;
  typeName: string;
};

/* =================== Helpers =================== */
const typeToName = (t?: string | null) => {
  switch (t) {
    case "interview":
      return "Trực tiếp";
    case "technical":
      return "Kỹ thuật";
    case "hr":
      return "HR";
    case "presentation":
      return "Thuyết trình";
    case "test":
      return "Bài kiểm tra";
    case "group":
      return "Nhóm";
    default:
      return t ?? null;
  }
};

/** Normalize one backend process → UI process (with stable id fallback) */
const normalizeProcess = (p: BackendInterviewProcess, idx: number): UiProcess => {
  const fallbackId = `${p.departmentId}:${p.processName}:${idx}`;
  const id = String(p.id ?? fallbackId);

  const stagesSrc = Array.isArray(p.interviewStageModels) ? p.interviewStageModels : [];
  const stages: UiStage[] = stagesSrc.map((s, si) => {
    const stFallbackId = `${id}-st-${si}`;
    return {
      id: String(s.id ?? stFallbackId),
      stageName: s.name ?? "—",
      description: s.description ?? null,
      order: Number(s.order ?? 0),
      totalTime: Number(s.duration ?? 0),
      typeName: typeToName(s.type),
    };
  });

  return {
    id,
    departmentId: p.departmentId,
    processName: p.processName,
    description: p.description ?? null,
    stages,
  };
};

/* =================== Component =================== */
export default function InterviewProcessTable({
  items = [],
  departmentId,
}: {
  items?: BackendInterviewProcess[];
  departmentId: string;
}) {
  const router = useRouter();

  // Keep a local, editable copy (normalized for UI)
  const normalized = useMemo(
    () => (items ?? []).map((p, i) => normalizeProcess(p, i)),
    [items]
  );
  const [data, setData] = useState<UiProcess[]>(normalized);
  useEffect(() => setData(normalized), [normalized]);

  // Dialog states
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<UiProcess | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [adding, setAdding] = useState(false);

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<UiProcess | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<UiProcess | null>(null);

  // Add Stage modal
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addStageFor, setAddStageFor] = useState<UiProcess | null>(null);

  const handleStageCreated = (stage: CreatedStage) => {
    console.log("[InterviewProcessTable] Stage created (client-only map):", stage);
    const mapped: UiStage = {
      id: `st-${Date.now()}`,
      stageName: stage.name,
      description: stage.description || null,
      order: Number(stage.order ?? 0),
      totalTime: Number(stage.duration ?? 0),
      typeName: stage.typeName || stage.typeCode || null,
    };

    if (!addStageFor) return;
    setData((prev) =>
      prev.map((p) =>
        p.id === addStageFor.id ? { ...p, stages: [...(p.stages ?? []), mapped] } : p
      )
    );
    setAddStageOpen(false);
    setAddStageFor(null);
    toast.success("Đã thêm vòng phỏng vấn (local)");
  };

  const openStages = (proc: UiProcess) => {
    setSelected(proc);
    setOpenView(true);
  };

  const resetAddForm = () => {
    setNewName("");
    setNewDesc("");
  };

  /** CREATE PROCESS (POST with exact payload) */
  const handleAddProcess = async () => {
    try {
      if (!newName.trim()) {
        toast.warn("Vui lòng nhập tên quy trình");
        return;
      }
      if (!departmentId) {
        toast.error("Thiếu departmentId");
        return;
      }

      setAdding(true);

      const payload = {
        departmentId, // exact field
        processName: newName.trim(), // exact field
        description: (newDesc ?? "").trim(), // backend expects string; empty allowed
      };

      console.log("[InterviewProcessTable] Creating process with payload:", payload);

      // Adjust endpoint path if your API constants differ
      const res = await authFetch(`${API.INTERVIEW.PROCESS}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      console.log("[InterviewProcessTable] Create response status/text:", res.status, text);
      const json = text ? JSON.parse(text) : null;

      if (!res.ok) {
        const msg =
          json?.message ||
          json?.error ||
          "Không thể tạo quy trình. Vui lòng thử lại.";
        throw new Error(msg);
      }

      // Expect backend returns created process in json.data (or at root)
      const created: BackendInterviewProcess = json?.data ?? json;
      console.log("[InterviewProcessTable] Created process (raw):", created);

      // Optimistic UI update so user sees it instantly
      setData((prev) => {
        const ui = normalizeProcess(created, prev.length); // stable fallback id
        console.log("[InterviewProcessTable] Normalized created process:", ui);
        return [ui, ...prev];
      });

      setOpenAdd(false);
      resetAddForm();

      toast.success(`Đã tạo quy trình`);
      // toast.info("Đang tải lại dữ liệu từ máy chủ…");
      router.refresh(); // re-fetch server components so table matches backend
      console.log("[InterviewProcessTable] router.refresh() called");
    } catch (err: any) {
      console.error("[InterviewProcessTable] Create error:", err);
      toast.error(`Thêm quy trình thất bại: ${err?.message || "Lỗi không xác định"}`);
    } finally {
      setAdding(false);
    }
  };

  const openEditDialog = (proc: UiProcess) => {
    setEditing(proc);
    setEditName(proc.processName);
    setEditDesc(proc.description ?? "");
    setOpenEdit(true);
  };

  const handleSaveEdit = () => {
    if (!editing) return;
    const id = editing.id;
    console.log("[InterviewProcessTable] Saving edit for id:", id, {
      newName: editName,
      newDesc: editDesc,
    });
    // Client-side only edit (keep UI behavior)
    setData((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              processName: editName.trim() || p.processName,
              description: editDesc.trim() || null,
            }
          : p
      )
    );
    setOpenEdit(false);
    setEditing(null);
    toast.success("Đã cập nhật (local)");
  };

  const confirmDelete = (proc: UiProcess) => {
    setDeleting(proc);
    setOpenDelete(true);
  };

  const doDelete = () => {
    if (!deleting) return;
    console.log("[InterviewProcessTable] Deleting (local) id:", deleting.id);
    // Client-side only delete (keep UI behavior)
    setData((prev) => prev.filter((p) => p.id !== deleting.id));
    setOpenDelete(false);
    setDeleting(null);
    toast.success("Đã xóa (local)");
  };

  return (
    <>
      <Card>
        <CardContent className="pt-6">
          {/* Toolbar */}
          <div className="mb-3 flex items-center justify-end">
            <Button onClick={() => setOpenAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Quy trình
            </Button>
          </div>

          <Table>
            <TableCaption>Danh sách quy trình phỏng vấn</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[260px]">Quy trình</TableHead>
                <TableHead>Mô tả</TableHead>
                <TableHead className="w-[80px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={4}
                    className="text-center text-sm text-muted-foreground"
                  >
                    Chưa có quy trình phỏng vấn.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((proc, idx) => (
                  <TableRow key={proc.id || `${proc.processName}-${idx}`}>
                    <TableCell className="align-top font-medium">
                      {proc.processName}
                    </TableCell>
                    <TableCell className="align-top">
                      {proc.description ?? "—"}
                    </TableCell>

                    <TableCell className="text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() =>
                              router.push(`/dashboard/interviewProcess/${proc.id}`)
                            }
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              setAddStageFor(proc);
                              setAddStageOpen(true);
                            }}
                          >
                            <Plus className="mr-2 h-4 w-4" />
                            Thêm vòng phỏng vấn
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => openEditDialog(proc)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => confirmDelete(proc)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* View stages */}
      <Dialog open={openView} onOpenChange={setOpenView}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>
              {selected ? `Quy trình: ${selected.processName}` : "Quy trình phỏng vấn"}
            </DialogTitle>
            <DialogDescription>
              {selected?.description ?? "Chi tiết các vòng phỏng vấn."}
            </DialogDescription>
          </DialogHeader>

          <Separator className="my-2" />

          {selected?.stages?.length ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Thứ tự</TableHead>
                    <TableHead className="w-[160px]">Tên vòng</TableHead>
                    <TableHead className="w-[140px]">Thời lượng</TableHead>
                    <TableHead className="w-[160px]">Hình thức</TableHead>
                    <TableHead>Mô tả</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {selected.stages
                    .slice()
                    .sort((a, b) => a.order - b.order)
                    .map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="align-top">{st.order}</TableCell>
                        <TableCell className="align-top">{st.stageName}</TableCell>
                        <TableCell className="align-top">
                          {st.totalTime} phút
                        </TableCell>
                        <TableCell className="align-top">
                          {st.typeName ?? "—"}
                        </TableCell>
                        <TableCell className="align-top">
                          {st.description ?? "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">Không có vòng phỏng vấn.</div>
          )}

          <DialogFooter className="mt-4">
            <Button onClick={() => setOpenView(false)}>Đóng</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add process */}
      <Dialog
        open={openAdd}
        onOpenChange={(v) => {
          if (!adding) setOpenAdd(v);
        }}
      >
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Thêm quy trình phỏng vấn</DialogTitle>
            <DialogDescription>Nhập tên và mô tả (nếu có).</DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="processName">Tên quy trình *</Label>
              <Input
                id="processName"
                placeholder="VD: Quy trình tuyển dụng Backend"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={adding}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="processDesc">Mô tả</Label>
              <Textarea
                id="processDesc"
                placeholder="Ghi chú thêm về quy trình…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                disabled={adding}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button
              variant="secondary"
              onClick={() => {
                if (!adding) {
                  setOpenAdd(false);
                  setNewName("");
                  setNewDesc("");
                }
              }}
              disabled={adding}
            >
              Hủy
            </Button>
            <Button onClick={handleAddProcess} disabled={adding}>
              {adding ? "Đang lưu..." : "Lưu"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit process */}
      <Dialog open={openEdit} onOpenChange={setOpenEdit}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Sửa quy trình</DialogTitle>
            <DialogDescription>Chỉnh sửa tên và mô tả quy trình.</DialogDescription>
          </DialogHeader>

        <div className="space-y-3">
            <div className="space-y-1">
              <Label htmlFor="editProcessName">Tên quy trình *</Label>
              <Input
                id="editProcessName"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="editProcessDesc">Mô tả</Label>
              <Textarea
                id="editProcessDesc"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => setOpenEdit(false)}>
              Hủy
            </Button>
            <Button onClick={handleSaveEdit}>Lưu</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={openDelete} onOpenChange={setOpenDelete}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xóa quy trình?</AlertDialogTitle>
            <AlertDialogDescription>
              Hành động này không thể hoàn tác. Quy trình:{" "}
              <b>{deleting?.processName}</b> sẽ bị xóa khỏi danh sách hiện tại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-600 hover:bg-red-700"
              onClick={doDelete}
            >
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Stage */}
      <CreateInterviewStageModal
        interviewProcessId={addStageFor?.id || ""}
        processName={addStageFor?.processName || ""}
        open={addStageOpen}
        onOpenChange={(v) => {
          setAddStageOpen(v);
          if (!v) setAddStageFor(null);
        }}
        hideTrigger
        takenOrders={(addStageFor?.stages ?? [])
          .map((s) => Number(s.order))
          .filter((n) => Number.isFinite(n))}
        existingStagesCount={addStageFor?.stages.length ?? 0}
        onStageCreated={handleStageCreated}
      />
    </>
  );
}
