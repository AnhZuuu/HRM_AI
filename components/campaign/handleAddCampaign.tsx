"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast, ToastContainer } from "react-toastify";
import { toIsoFromDateInput } from "@/app/utils/helper";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

// Keep a local Campaign type (structurally compatible with parent)
type Campaign = {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  description: string;
  createdBy?: string | null;
  createdByName?: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  nextId: number;
  defaultCreatedBy?: string | null;
  onCreated?: (saved: Campaign) => void; // <-- new prop to bubble result
};

// Map server -> UI
const mapFromApi = (c: any): Campaign => ({
  id: c.id,
  name: c.name,
  startTime: c.startTime,
  endTime: c.endTime,
  description: c.description,
  createdBy: c.createdById ?? null,
  createdByName: c.createdByName ?? null,
});

// Map UI -> server
const mapToApi = (c: Partial<Omit<Campaign, "id">>) => {
  const out: any = {
    name: c.name,
    description: c.description,
    startTime: (c.startTime ?? null),
    endTime: (c.endTime ?? null),
    createdById: c.createdBy ?? null,
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
};

// Safe unwrap for your API wrapper (handles both wrapped and raw)
const unwrap = async (res: Response) => {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return json?.data?.data ?? json?.data ?? json;
};

export default function AddCampaignDialog({
  open,
  onOpenChange,
  nextId,
  defaultCreatedBy = null,
  onCreated,
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
      const payload: Omit<Campaign, "id"> = {
        name: form.name.trim(),
        startTime: form.startTime,
        endTime: form.endTime,
        description: form.description?.trim() || "",
        createdBy: defaultCreatedBy,
        createdByName: defaultCreatedBy
          ? defaultCreatedBy.split(" ")[0]
          : undefined,
      };

      const res = await authFetch(`${API.CAMPAIGN.BASE}`, {
        method: "POST",
        body: JSON.stringify(mapToApi(payload)),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error((await res.text()) || "Create failed");

      const body = await unwrap(res);
      const saved = mapFromApi(body);

      // Notify UI
      toast.success("Chiến dịch đã được tạo thành công!");

      // Bubble up to parent so it can update the list immediately
      onCreated?.(saved);

      reset();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể tạo chiến dịch.");
    } finally {
      setSubmitting(false);
    }
  };


  const today = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(v) => {
          if (!v) reset();
          onOpenChange(v);
        }}
      >
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
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
