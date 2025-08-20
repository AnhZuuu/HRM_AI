"use client";

import { useEffect, useState } from "react";
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

// ===== Types for local/sample data =====
export type InterviewTypeModel = {
    name: string;
    description: string | null;
};

export type InterviewStageModel = {
    id: string;
    stageName: string;
    description: string | null;
    order: number;
    totalTime: number; // minutes
    interviewTypeModel: InterviewTypeModel;
};

export type InterviewProcessModel = {
    id: string;
    processName: string;
    description: string | null;
    stages: InterviewStageModel[];
};

// ===== Sample data (mock) =====
const SAMPLE_PROCESSES: InterviewProcessModel[] = [
    {
        id: "proc-001",
        processName: "Quy trình tuyển dụng Nhân sự",
        description: "Quy trình 2 vòng tiêu chuẩn cho phòng Nhân sự.",
        stages: [
            {
                id: "st-001",
                stageName: "Vòng 1",
                description: "Sàng lọc hồ sơ và trao đổi tổng quan.",
                order: 1,
                totalTime: 30,
                interviewTypeModel: { name: "Trực tiếp", description: "pv trực tiếp" },
            },
            {
                id: "st-002",
                stageName: "Vòng 2",
                description: "Phỏng vấn chuyên môn + tình huống.",
                order: 2,
                totalTime: 45,
                interviewTypeModel: { name: "Trực tiếp", description: "pv trực tiếp" },
            },
        ],
    },
    {
        id: "proc-002",
        processName: "Quy trình tuyển dụng Kinh doanh",
        description: "Quy trình 3 vòng chú trọng kỹ năng bán hàng.",
        stages: [
            {
                id: "st-101",
                stageName: "Vòng 1",
                description: "Sàng lọc + test nhanh.",
                order: 1,
                totalTime: 25,
                interviewTypeModel: { name: "Online", description: "pv qua video" },
            },
            {
                id: "st-102",
                stageName: "Vòng 2",
                description: "Phỏng vấn tình huống bán hàng.",
                order: 2,
                totalTime: 40,
                interviewTypeModel: { name: "Trực tiếp", description: "pv trực tiếp" },
            },
            {
                id: "st-103",
                stageName: "Vòng 3",
                description: "Demo chốt deal.",
                order: 3,
                totalTime: 35,
                interviewTypeModel: { name: "Trực tiếp", description: "pv trực tiếp" },
            },
        ],
    },
];
// helper to map modal's type -> display name
const typeToName = (t: string) => {
    switch (t) {
        case "interview": return "Trực tiếp"
        case "technical": return "Kỹ thuật"
        case "hr": return "HR"
        case "presentation": return "Thuyết trình"
        case "test": return "Bài kiểm tra"
        case "group": return "Nhóm"
        default: return t
    }
}
export default function InterviewProcessTable({
    items = SAMPLE_PROCESSES,
}: {
    items?: InterviewProcessModel[];
}) {
    const router = useRouter();
    const [addStageOpen, setAddStageOpen] = useState(false)
    const [addStageFor, setAddStageFor] = useState<InterviewProcessModel | null>(null)

    // Data shown (copy from props so we can add/edit/delete locally)
    const [data, setData] = useState<InterviewProcessModel[]>(items);
    useEffect(() => setData(items), [items]);

    // Popup: view stages
    const [open, setOpen] = useState(false);
    const [selected, setSelected] = useState<InterviewProcessModel | null>(null);

    // Popup: add process
    const [openAdd, setOpenAdd] = useState(false);
    const [newName, setNewName] = useState("");
    const [newDesc, setNewDesc] = useState("");

    // Popup: edit process
    const [openEdit, setOpenEdit] = useState(false);
    const [editing, setEditing] = useState<InterviewProcessModel | null>(null);
    const [editName, setEditName] = useState("");
    const [editDesc, setEditDesc] = useState("");

    // Confirm delete
    const [openDelete, setOpenDelete] = useState(false);
    const [deleting, setDeleting] = useState<InterviewProcessModel | null>(null);

    const openStages = (proc: InterviewProcessModel) => {
        setSelected(proc);
        setOpen(true);
    };

    const resetAddForm = () => {
        setNewName("");
        setNewDesc("");
    };

    const handleAddProcess = () => {
        if (!newName.trim()) return;
        const id = `proc-${Date.now()}`;
        const next: InterviewProcessModel = {
            id,
            processName: newName.trim(),
            description: newDesc.trim() || null,
            stages: [],
        };
        setData((prev) => [next, ...prev]);
        setOpenAdd(false);
        resetAddForm();
    };

    const openEditDialog = (proc: InterviewProcessModel) => {
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
                    ? { ...p, processName: editName.trim() || p.processName, description: editDesc.trim() || null }
                    : p
            )
        );
        setOpenEdit(false);
        setEditing(null);
    };

    const confirmDelete = (proc: InterviewProcessModel) => {
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
                    {/* Toolbar: Add button on the right (top) */}
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
                                <TableHead className="w-[420px]">Các vòng (nhấn để xem chi tiết)</TableHead>
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
                                        <TableCell className="align-top">
                                            {proc.stages?.length ? (
                                                <div className="flex flex-wrap gap-2">
                                                    {proc.stages.map((st) => (
                                                        <Button
                                                            key={st.id}
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => openStages(proc)}
                                                            title="Xem tất cả các vòng trong quy trình này"
                                                        >
                                                            {st.stageName}
                                                        </Button>
                                                    ))}
                                                </div>
                                            ) : (
                                                <span className="text-muted-foreground">Không có vòng phỏng vấn</span>
                                            )}
                                        </TableCell>

                                        {/* Actions column with DropdownMenu */}
                                        <TableCell className="text-right align-top">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button variant="ghost" className="h-8 w-8 p-0">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                    </Button>
                                                </DropdownMenuTrigger>

                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem onClick={() => router.push(`/dashboard/interview-processes/${proc.id}`)}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Chi tiết
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        onClick={() => {
                                                            setAddStageFor(proc)
                                                            setAddStageOpen(true)
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

            {/* Popup: view all stages of the selected process */}
            <Dialog open={open} onOpenChange={setOpen}>
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
                                        <TableHead className="w-[220px]">Mô tả hình thức</TableHead>
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
                                                <TableCell className="align-top">
                                                    {st.interviewTypeModel?.name ?? "—"}
                                                </TableCell>
                                                <TableCell className="align-top">{st.description ?? "—"}</TableCell>
                                                <TableCell className="align-top">
                                                    {st.interviewTypeModel?.description ?? "—"}
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
                        <Button onClick={() => setOpen(false)}>Đóng</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Popup: add new process */}
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

            {/* Popup: edit process */}
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
            <CreateInterviewStageModal
                interviewProcessId={addStageFor?.id || ""}
                open={addStageOpen}
                onOpenChange={(v) => {
                    setAddStageOpen(v)
                    if (!v) setAddStageFor(null)
                }}
                hideTrigger
                existingStagesCount={addStageFor?.stages.length ?? 0}
                onStageCreated={(stage) => {
                    // map to your table's stage shape and append to selected process
                    const mapped = {
                        id: `st-${Date.now()}`,
                        stageName: stage.name,
                        description: stage.description || null,
                        order: stage.order,
                        totalTime: stage.duration,
                        interviewTypeModel: { name: typeToName(stage.type), description: null },
                    }

                    if (!addStageFor) return
                    setData((prev) =>
                        prev.map((p) =>
                            p.id === addStageFor.id ? { ...p, stages: [...(p.stages ?? []), mapped] } : p
                        )
                    )
                    setAddStageOpen(false)
                    setAddStageFor(null)
                }}
            />
        </>
    );
}
