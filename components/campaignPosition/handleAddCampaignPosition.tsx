"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter,
    DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Plus } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";


type DepartmentOption = { id: string; name: string };

const unwrap = async (res: Response) => {
    const txt = await res.text();
    const json = txt ? JSON.parse(txt) : null;
    return json?.data?.data ?? json?.data ?? json;
};

export default function AddPositionDialog({
    campaignId,
    departmentOptions = [],
}: {
    campaignId: string;
    departmentOptions?: DepartmentOption[];
}) {
    const router = useRouter();
    const [open, setOpen] = useState(false);

    const [departments, setDepartments] = useState<DepartmentOption[]>(departmentOptions);
    const [depsLoading, setDepsLoading] = useState(false);
    const [depsError, setDepsError] = useState<string | null>(null);

    const [form, setForm] = useState({ departmentId: "", totalSlot: 1, description: "" });
    const [errors, setErrors] = useState<{ departmentId?: string; totalSlot?: string }>({});
    const [submitting, setSubmitting] = useState(false);

    // Fetch departments when dialog opens (if not provided)
    useEffect(() => {
        if (!open || departmentOptions.length) return;
        let mounted = true;
        (async () => {
            setDepsLoading(true);
            setDepsError(null);
            try {
                const res = await authFetch(API.DEPARTMENT);
                if (!res.ok) throw new Error(await res.text());
                const list = (await unwrap(res)) as any[];
                const mapped: DepartmentOption[] = (Array.isArray(list) ? list : []).map((d: any) => ({
                    id: d.id,
                    // accept either "name" or "departmentName" from backend
                    name: d.name ?? d.departmentName ?? "(không tên)",
                }));
                if (mounted) setDepartments(mapped);
            } catch (e: any) {
                if (mounted) setDepsError(e?.message ?? "Không thể tải phòng ban");
            } finally {
                if (mounted) setDepsLoading(false);
            }
        })();
        return () => {
            mounted = false;
        };
    }, [open, departmentOptions.length]);

    const validate = () => {
        const e: typeof errors = {};
        if (!form.departmentId) e.departmentId = "Hãy chọn phòng ban";
        if (!form.totalSlot || form.totalSlot < 1) e.totalSlot = "Số lượng tối thiểu là 1";
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const reset = () => {
        setForm({ departmentId: "", totalSlot: 1, description: "" });
        setErrors({});
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            const payload = {
                campaignId,
                departmentId: form.departmentId,   // value is the ID
                totalSlot: Number(form.totalSlot),
                description: form.description.trim(),
                campaignPositionDetailAddModels: [
                    {
                        "type": "string",
                        "key": "string",
                        "value": "string",
                        "groupIndex": 0
                    }
                ]
            };

            const res = await authFetch(API.CAMPAIGN.POSITION, {
                method: "POST",
                body: JSON.stringify(payload),
            });
            if (!res.ok) throw new Error((await res.text()) || "Create failed");

            setOpen(false);
            reset();
            router.refresh(); // reload data on page
        } catch (e) {
            console.error(e);
            // optionally show a toast here
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); setOpen(v); }}>
            <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="w-4 h-4 mr-2" />
                    Thêm vị trí tuyển dụng
                </Button>
            </DialogTrigger>

            <DialogContent className="sm:max-w-[560px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Thêm vị trí tuyển dụng</DialogTitle>
                    <DialogDescription>Điền thông tin vị trí cho đợt tuyển dụng này.</DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Department */}
                    <div className="space-y-2">
                        <Label>Phòng ban <span className="text-red-500">*</span></Label>
                        <Select
                            value={form.departmentId}
                            onValueChange={(v) => {
                                setForm({ ...form, departmentId: v });
                                setErrors((x) => ({ ...x, departmentId: "" }));
                            }}
                            disabled={depsLoading}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder={depsLoading ? "Đang tải..." : "Chọn phòng ban"} />
                            </SelectTrigger>
                            <SelectContent>
                                {depsError && <SelectItem value="__err" disabled>{depsError}</SelectItem>}
                                {!depsError && departments.length === 0 && !depsLoading && (
                                    <SelectItem value="__none" disabled>Không có dữ liệu phòng ban</SelectItem>
                                )}
                                {departments.map((d) => (
                                    <SelectItem key={d.id} value={d.id}>
                                        {d.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {errors.departmentId && <p className="text-sm text-red-500">{errors.departmentId}</p>}
                    </div>

                    {/* Total Slot */}
                    <div className="space-y-2">
                        <Label>Số lượng cần tuyển <span className="text-red-500">*</span></Label>
                        <Input
                            type="number"
                            min={1}
                            step={1}
                            value={form.totalSlot}
                            onChange={(e) => {
                                const v = Number(e.target.value);
                                setForm({ ...form, totalSlot: v });
                                setErrors((x) => ({ ...x, totalSlot: "" }));
                            }}
                        />
                        {errors.totalSlot && <p className="text-sm text-red-500">{errors.totalSlot}</p>}
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea
                            rows={5}
                            placeholder="Mô tả chi tiết vị trí..."
                            value={form.description}
                            onChange={(e) => setForm({ ...form, description: e.target.value })}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button onClick={handleSubmit} disabled={submitting}>
                        Thêm
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
