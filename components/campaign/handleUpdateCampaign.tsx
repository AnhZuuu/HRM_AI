"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast, ToastContainer } from "react-toastify";
import { authFetch } from "@/app/utils/authFetch";
import { toIsoFromDateInput } from "@/app/utils/helper";
import API from "@/api/api";

// Keep a local Campaign type matching your parent
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
  campaign: Campaign | null;
  // Parent receives the saved (server) object
  onSave: (updated: Campaign) => void;
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
    startTime: toIsoFromDateInput(c.startTime ?? null),
    endTime: toIsoFromDateInput(c.endTime ?? null),
    createdById: c.createdBy ?? null,
  };
  Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
  return out;
};

// Unwrap your API envelope safely
const unwrap = async (res: Response) => {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;
  return json?.data?.data ?? json?.data ?? json;
};

// Normalize to yyyy-MM-dd for date inputs
const toDateInput = (v?: string | null) => {
  if (!v) return "";
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return String(v).slice(0, 10);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
};

const today = new Date().toISOString().split("T")[0];

export default function UpdateCampaignDialog({
  open,
  onOpenChange,
  campaign,
  onSave,
}: Props) {
  const [form, setForm] = useState<Campaign | null>(null);
  const [errors, setErrors] = useState<{ name?: string; startTime?: string; endTime?: string }>({});
  const [submitting, setSubmitting] = useState(false);

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

  // PUT inside the dialog
  const handleSave = async () => {
    if (!form || !campaign) return;
    if (!validate()) return;

    setSubmitting(true);
    try {
      const res = await authFetch(`${API.CAMPAIGN.BASE}/${campaign.id}`, {
        method: "PUT",
        body: JSON.stringify(
          mapToApi({
            name: form.name.trim(),
            startTime: form.startTime,
            endTime: form.endTime,
            description: form.description || "",
            createdBy: campaign.createdBy ?? null,
          })
        ),
      });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error((await res.text()) || "Update failed");

      const body = await unwrap(res);
      const saved = mapFromApi(body);

      toast.success("Sửa thành công!");
      onSave(saved); // bubble up the saved object
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Không thể lưu chiến dịch.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
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
                  min={today}
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
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Hủy
            </Button>
            <Button onClick={handleSave} disabled={!isDirty || submitting}>
              {submitting ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
