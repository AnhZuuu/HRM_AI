"use client";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onCreate: (newCampaign: Campaign) => void | Promise<void>;
  nextId: number;
  defaultCreatedBy?: string | null;
};

export default function AddCampaignDialog({
  open,
  onOpenChange,
  onCreate,
  nextId,
  defaultCreatedBy = null,
}: Props) {
  const [form, setForm] = useState({ name: "", startTime: "", endTime: "", description: "" });
  const [errors, setErrors] = useState<{ name?: string; startTime?: string; endTime?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.name.trim()) e.name = "Tên đợt tuyển dụng không được bỏ trống";
    if (!form.startTime) e.startTime = "Chưa chọn ngày bắt đầu";
    if (!form.endTime) e.endTime = "Chưa chọn ngày kết thúc";
    if (form.startTime && form.endTime) {
      const s = new Date(form.startTime);
      const ed = new Date(form.endTime);
      if (ed <= s) e.endTime = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const reset = () => {
    setForm({ name: "", startTime: "", endTime: "", description: "" });
    setErrors({});
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const payload: Campaign = {
        id: nextId.toString(),
        name: form.name.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description?.trim() || "",
        createdBy: defaultCreatedBy,
        createdByName: defaultCreatedBy ? defaultCreatedBy.split(" ")[0] : "Người dùng không xác định",
      };


      await onCreate(payload);

      reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };
  const today = new Date().toISOString().split("T")[0];
  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Thêm mới đợt tuyển dụng</DialogTitle>
          <DialogDescription>Nhập thông tin về đợt tuyển dụng</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên đợt tuyển dụng <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={form.name}
              onChange={(e) => { setForm({ ...form, name: e.target.value }); setErrors((x) => ({ ...x, name: "" })); }}
              placeholder="Tên đợt tuyển dụng"
            />
            {errors.name && <p className="text-red-500 text-sm">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start">Bắt đầu từ: <span className="text-red-500">*</span></Label>
              <Input
                id="start"
                type="date"
                value={form.startTime}
                min={today}
                max={form.endTime || undefined}
                onChange={(e) => { setForm({ ...form, startTime: e.target.value }); setErrors((x) => ({ ...x, startTime: "" })); }}
              />
              {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Kết thúc vào: <span className="text-red-500">*</span></Label>
              <Input
                id="end"
                type="date"
                value={form.endTime}
                min={form.startTime || undefined}
                onChange={(e) => { setForm({ ...form, endTime: e.target.value }); setErrors((x) => ({ ...x, endTime: "" })); }}
              />
              {errors.endTime && <p className="text-red-500 text-sm">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              rows={3}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Thêm mô tả về đợt tuyển dụng này..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>Hủy</Button>
          <Button onClick={handleSubmit} disabled={submitting}>Thêm đợt tuyển dụng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
