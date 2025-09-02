"use client";

import { useState } from "react";
import { Card, CardContent, } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { Save, X } from "lucide-react";

export interface DepartmentFormValues {
  departmentName: string;
  description: string;
}

export default function DepartmentForm({
  initial,
  onSubmit,
  onCancel,
  submitText = "Submit",
  title = "Phòng ban",
}: {
  initial?: Partial<DepartmentFormValues>;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitText?: string;
  title?: string;
}) {
  const MAX_DESC = 500;

  const [form, setForm] = useState<DepartmentFormValues>({
    departmentName: initial?.departmentName ?? "",
    description: initial?.description ?? "",
  });

  const [errors, setErrors] = useState<{ departmentName?: string }>({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  // const [busy, setBusy] = useState(false);
  const router = useRouter();

  const validate = () => {
    const e: typeof errors = {};
    if (!form.departmentName.trim()) e.departmentName = "Tên phòng ban không được bỏ trống";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
     setErr(null);
    if (!validate()) return;
    setSaving(true);
    try {
      // setBusy(true);
      await onSubmit({
        departmentName: form.departmentName.trim(),
        description: form.description.trim(),
      });    
    } catch (e: any) {
      setErr(e?.message || "Không thể lưu. Vui lòng thử lại.");
    } finally {
      setSaving(false);
    }
  };

  const descCount = form.description?.length ?? 0;

   const handleCancel = () => {
    if (onCancel) return onCancel();
    router.back();
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-semibold">{title}</h1>

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Tên phòng ban */}
            <div className="space-y-2">
              <label htmlFor="departmentName" className="text-sm font-medium">
                Tên phòng ban <span className="text-red-500">*</span>
              </label>
              <Input
                id="departmentName"
                value={form.departmentName}
                onChange={(e) =>
                  setForm((s) => ({ ...s, departmentName: e.target.value }))
                }
                placeholder="VD: Phòng Kỹ thuật"
                disabled={saving}
                className={errors.departmentName ? "border-red-400" : ""}
                aria-invalid={!!errors.departmentName}
                aria-describedby="departmentName-error"
              />
              <p id="departmentName-error" className="text-xs text-red-600 min-h-[1rem]">
                {errors.departmentName}
              </p>
            </div>

            {/* Mô tả */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-center justify-between">
                <label htmlFor="description" className="text-sm font-medium">
                  Mô tả
                </label>
                <span className="text-xs text-slate-500">
                  {descCount}/{MAX_DESC}
                </span>
              </div>
              <Textarea
                id="description"
                rows={4}
                value={form.description}
                onChange={(e) =>
                  setForm((s) => ({
                    ...s,
                    description: e.target.value.slice(0, MAX_DESC),
                  }))
                }
                placeholder="Mô tả ngắn về chức năng, nhiệm vụ…"
                disabled={saving}
                className="resize-none"
              />
              <p className="text-xs text-slate-500">
                Không bắt buộc. Tối đa {MAX_DESC} ký tự.
              </p>
            </div>
          </div>

          {/* Lỗi tổng quát */}
          {err && <p className="text-sm text-red-600">{err}</p>}

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={handleCancel} disabled={saving}>
              <X className="h-4 w-4 mr-2" />
              Hủy
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-blue-600 hover:bg-blue-700"
              disabled={saving}
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? "Đang lưu..." : submitText}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

