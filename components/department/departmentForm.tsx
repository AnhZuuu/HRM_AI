"use client";
import { useState } from "react";

export interface DepartmentFormValues {
  departmentName: string;
  code: string;
  description: string;
}

export default function DepartmentForm({
  initial,
  onSubmit,
  onCancel,
  submitText = "Submit",
  title
}: {
  initial?: Partial<DepartmentFormValues>;
  onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
  onCancel?: () => void;
  submitText?: string;
  title?: string;
}) {
  const [form, setForm] = useState<DepartmentFormValues>({
    departmentName: initial?.departmentName ?? "",
    code: (initial?.code ?? "").toString(),
    description: initial?.description ?? "",
  });
  const [errors, setErrors] = useState<{
    departmentName?: string;
    code?: string;
  }>({});
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.departmentName.trim())
      e.departmentName = "Tên phòng ban không được bỏ trống";
    if (!form.code.trim()) e.code = "Mã phòng ban không được bỏ trống";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setBusy(true);
      await onSubmit({ ...form, code: form.code.trim().toUpperCase() });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex justify-center">
      <div className="relative w-[560px] max-w-[92vw]">
        <div className="rounded-2xl bg-[#f7f7f8] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
          <div className="rounded-xl bg-white p-6 border border-gray-200">
            <div className="text-center mb-6">
              <h3 className="text-[15px] font-semibold tracking-[0.2em] text-gray-800 uppercase">
                {title}
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Tên phòng ban <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${
                    errors.departmentName
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={form.departmentName}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, departmentName: e.target.value }))
                  }
                />
                {errors.departmentName && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.departmentName}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Code <span className="text-red-500">*</span>
                </label>
                <input
                  className={`w-full rounded-md border px-3 py-2 text-sm uppercase tracking-wide focus:outline-none focus:ring-2 ${
                    errors.code
                      ? "border-red-400 focus:ring-red-200"
                      : "border-gray-300 focus:ring-blue-200"
                  }`}
                  value={form.code}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, code: e.target.value }))
                  }
                />
                {errors.code && (
                  <p className="mt-1 text-xs text-red-500">{errors.code}</p>
                )}
              </div>

              <div>
                <label className="block text-sm text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
                  rows={3}
                  value={form.description ?? ""}
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value }))
                  }
                />
              </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3">
              {onCancel && (
                <button
                  onClick={onCancel}
                  className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
                >
                  Hủy
                </button>
              )}
              <button
                onClick={handleSubmit}
                disabled={busy}
                className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
              >
                {submitText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
