"use client";
import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  campaign: Campaign | null;
  onSave: (updated: Campaign) => void; 
};

export default function UpdateCampaignDialog({ open, onOpenChange, campaign, onSave }: Props) {
  const [form, setForm] = useState<Campaign | null>(null);
  const [errors, setErrors] = useState<{ name?: string; startTime?: string; endTime?: string }>({});

  // Normalize to yyyy-MM-dd for date inputs
  const toDateInput = (v?: string) => {
    if (!v) return "";
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return (v || "").slice(0, 10);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  // Refill when opening / switching target
  useEffect(() => {
    if (!campaign) return;
    setForm({
      ...campaign,
      startTime: toDateInput(campaign.startTime),
      endTime: toDateInput(campaign.endTime),
    });
    setErrors({});
  }, [campaign, open]);

  const isDirty = useMemo(() => {
    if (!campaign || !form) return false;
    return (
      campaign.name !== form.name ||
      toDateInput(campaign.startTime) !== form.startTime ||
      toDateInput(campaign.endTime) !== form.endTime ||
      (campaign.description || "") !== (form.description || "")
    );
  }, [campaign, form]);

  const validate = () => {
    const e: typeof errors = {};
    if (!form?.name?.trim()) e.name = "Tên đợt tuyển dụng không được bỏ trống";
    if (!form?.startTime) e.startTime = "Chưa chọn ngày bắt đầu";
    if (!form?.endTime) e.endTime = "Chưa chọn ngày kết thúc";
    if (form?.startTime && form?.endTime) {
      const s = new Date(form.startTime);
      const ed = new Date(form.endTime);
      if (ed <= s) e.endTime = "Ngày kết thúc phải sau ngày bắt đầu";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  //gọi API trong này
  const handleSave = () => {
    if (!form || !campaign) return;
    if (!validate()) return;
    onSave({
      ...campaign,
      name: form.name.trim(),
      startTime: form.startTime,
      endTime: form.endTime,
      description: form.description || "",
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Sửa đợt tuyển dụng</DialogTitle>
          <DialogDescription>Cập nhật thông tin đợt tuyển dụng</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Tên đợt tuyển dụng <span className="text-red-500">*</span></Label>
            <Input
              id="name"
              value={form?.name ?? ""}
              onChange={(e) => setForm((s) => (s ? { ...s, name: e.target.value } : s))}
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
                value={form?.startTime ?? ""}
                max={form?.endTime || undefined}
                onChange={(e) => setForm((s) => (s ? { ...s, startTime: e.target.value } : s))}
              />
              {errors.startTime && <p className="text-red-500 text-sm">{errors.startTime}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="end">Kết thúc vào: <span className="text-red-500">*</span></Label>
              <Input
                id="end"
                type="date"
                value={form?.endTime ?? ""}
                min={form?.startTime || undefined}
                onChange={(e) => setForm((s) => (s ? { ...s, endTime: e.target.value } : s))}
              />
              {errors.endTime && <p className="text-red-500 text-sm">{errors.endTime}</p>}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Mô tả</Label>
            <Textarea
              id="desc"
              rows={3}
              value={form?.description ?? ""}
              onChange={(e) => setForm((s) => (s ? { ...s, description: e.target.value } : s))}
              placeholder="Thêm mô tả về đợt tuyển dụng này..."
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Hủy</Button>
          <Button onClick={handleSave} disabled={!isDirty}>Lưu thay đổi</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
