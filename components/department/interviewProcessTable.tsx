"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableCaption, TableHeader, TableRow, TableHead, TableBody, TableCell,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { CreateInterviewStageModal } from "./create-interview-stage-modal";

/**
 * BACKEND TYPES (from your API)
 */
export type BackendInterviewStage = {
  id: string;
  name?: string | null;
  description?: string | null;
  order?: number | null;
  duration?: number | null; // minutes
  type?: string | null;     // e.g., "interview" | "technical" | ...
};

export type BackendInterviewProcess = {
  id: string;
  processName: string;
  description: string | null;
  countOfStage: number;
  interviewStageModels: BackendInterviewStage[];
  // ... other audit fields exist, omitted for brevity
};

/**
 * UI-NORMALIZED TYPES (used by this table)
 */
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
  processName: string;
  description: string | null;
  stages: UiStage[];
};

type CreatedStage = {
  name: string
  description: string
  order: number
  duration: number
  typeId: string
  typeCode: string
  typeName: string
}


const typeToName = (t?: string | null) => {
  switch (t) {
    case "interview": return "Trực tiếp";
    case "technical": return "Kỹ thuật";
    case "hr": return "HR";
    case "presentation": return "Thuyết trình";
    case "test": return "Bài kiểm tra";
    case "group": return "Nhóm";
    default: return t ?? null;
  }
};

/**
 * Normalize one backend process → UI process
 */
const normalizeProcess = (p: BackendInterviewProcess): UiProcess => ({
  id: p.id,
  processName: p.processName,
  description: p.description ?? null,
  stages: Array.isArray(p.interviewStageModels)
    ? p.interviewStageModels.map((s) => ({
      id: s.id,
      stageName: s.name ?? "—",
      description: s.description ?? null,
      order: Number(s.order ?? 0),
      totalTime: Number(s.duration ?? 0),
      typeName: typeToName(s.type),
    }))
    : [],
});

export default function InterviewProcessTable({
  items = [],
}: {
  items?: BackendInterviewProcess[];
}) {
  const router = useRouter();

  // Keep a local, editable copy (normalized for UI)
  const normalized = useMemo(() => (items ?? []).map(normalizeProcess), [items]);
  const [data, setData] = useState<UiProcess[]>(normalized);
  useEffect(() => setData(normalized), [normalized]);

  // Dialog states
  const [openView, setOpenView] = useState(false);
  const [selected, setSelected] = useState<UiProcess | null>(null);

  const [openAdd, setOpenAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  const [openEdit, setOpenEdit] = useState(false);
  const [editing, setEditing] = useState<UiProcess | null>(null);
  const [editName, setEditName] = useState("");
  const [editDesc, setEditDesc] = useState("");

  const [openDelete, setOpenDelete] = useState(false);
  const [deleting, setDeleting] = useState<UiProcess | null>(null);

  // Add Stage modal
  const [addStageOpen, setAddStageOpen] = useState(false);
  const [addStageFor, setAddStageFor] = useState<UiProcess | null>(null);

  type CreatedStage = {
  name: string
  description: string
  order: number
  duration: number
  typeId: string
  typeCode: string
  typeName: string
}

const handleStageCreated = (stage: CreatedStage) => {
  const mapped: UiStage = {
    id: `st-${Date.now()}`,
    stageName: stage.name,
    description: stage.description || null,
    order: Number(stage.order ?? 0),
    totalTime: Number(stage.duration ?? 0),
    // use the API-provided display name; fallback to code if needed
    typeName: stage.typeName || stage.typeCode || null,
  }

  if (!addStageFor) return
  setData((prev) =>
    prev.map((p) =>
      p.id === addStageFor.id ? { ...p, stages: [...(p.stages ?? []), mapped] } : p
    )
  )
  setAddStageOpen(false)
  setAddStageFor(null)
}


  const openStages = (proc: UiProcess) => {
    setSelected(proc);
    setOpenView(true);
  };

  const resetAddForm = () => {
    setNewName("");
    setNewDesc("");
  };

  const handleAddProcess = () => {
    if (!newName.trim()) return;
    const id = `proc-${Date.now()}`;
    const next: UiProcess = {
      id,
      processName: newName.trim(),
      description: newDesc.trim() || null,
      stages: [],
    };
    setData((prev) => [next, ...prev]);
    setOpenAdd(false);
    resetAddForm();
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
  };

  const confirmDelete = (proc: UiProcess) => {
    setDeleting(proc);
    setOpenDelete(true);
  };

  const doDelete = () => {
    if (!deleting) return;
    setData((prev) => prev.filter((p) => p.id !== deleting.id));
    setOpenDelete(false);
    setDeleting(null);
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
                {/* <TableHead className="w-[420px]">Các vòng (nhấn để xem chi tiết)</TableHead> */}
                <TableHead className="w-[80px] text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-sm text-muted-foreground">
                    Chưa có quy trình phỏng vấn.
                  </TableCell>
                </TableRow>
              ) : (
                data.map((proc) => (
                  <TableRow key={proc.id}>
                    <TableCell className="align-top font-medium">{proc.processName}</TableCell>
                    <TableCell className="align-top">{proc.description ?? "—"}</TableCell>

                    <TableCell className="text-right align-top">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/interviewProcess/${proc.id}`)}>
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

                          <DropdownMenuItem className="text-red-600" onClick={() => confirmDelete(proc)}>
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
                        <TableCell className="align-top">{st.totalTime} phút</TableCell>
                        <TableCell className="align-top">{st.typeName ?? "—"}</TableCell>
                        <TableCell className="align-top">{st.description ?? "—"}</TableCell>
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
      <Dialog open={openAdd} onOpenChange={setOpenAdd}>
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
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="processDesc">Mô tả</Label>
              <Textarea
                id="processDesc"
                placeholder="Ghi chú thêm về quy trình…"
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter className="mt-4">
            <Button variant="secondary" onClick={() => { setOpenAdd(false); setNewName(""); setNewDesc(""); }}>
              Hủy
            </Button>
            <Button onClick={handleAddProcess}>Lưu</Button>
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
            <Button variant="secondary" onClick={() => setOpenEdit(false)}>Hủy</Button>
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
              Hành động này không thể hoàn tác. Quy trình: <b>{deleting?.processName}</b> sẽ bị xóa khỏi danh sách hiện tại.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction className="bg-red-600 hover:bg-red-700" onClick={doDelete}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Stage (mapped to our UI shape on create) */}
      <CreateInterviewStageModal
        interviewProcessId={addStageFor?.id || ""}
        processName={addStageFor?.processName || ""}
        open={addStageOpen}
        onOpenChange={(v) => {
          setAddStageOpen(v)
          if (!v) setAddStageFor(null)
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
