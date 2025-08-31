// // components/department/departmentForm.tsx
// "use client";
// import { useState } from "react";
// import { toast } from "react-toastify";

// export interface DepartmentFormValues {
//   departmentName: string;
//   // code: string;
//   description: string;
// }

// export default function DepartmentForm({
//   initial,
//   onSubmit,
//   onCancel,
//   submitText = "Submit",
//   title,
// }: {
//   initial?: Partial<DepartmentFormValues>;
//   onSubmit: (values: DepartmentFormValues) => Promise<void> | void;
//   onCancel?: () => void;
//   submitText?: string;
//   title?: string;
// }) {
//   const [form, setForm] = useState<DepartmentFormValues>({
//     departmentName: initial?.departmentName ?? "",
//     // code: (initial?.code ?? "").toString(),
//     description: initial?.description ?? "",
//   });

//   const [errors, setErrors] = useState<{
//     departmentName?: string;
//     code?: string;
//   }>({});
//   const [busy, setBusy] = useState(false);

//   const validate = () => {
//     const e: typeof errors = {};
//     if (!form.departmentName.trim()) e.departmentName = "Tên phòng ban không được bỏ trống";
//     // if (!form.code.trim()) e.code = "Mã phòng ban không được bỏ trống";
//     setErrors(e);
//     return Object.keys(e).length === 0;
//   };

//   const handleSubmit = async () => {
//     if (!validate()) return;
//     try {
//       setBusy(true);
//       await onSubmit({
//         departmentName: form.departmentName.trim(),
//         // code: form.code.trim(),
//         description: form.description.trim(),
//       });
//     } finally {
//       setBusy(false);
//     }
//   };

//   return (
//     <div className="flex justify-center">
//       <div className="relative w-[560px] max-w-[92vw]">
//         <div className="rounded-2xl bg-[#f7f7f8] p-2 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
//           <div className="rounded-xl bg-white p-6 border border-gray-200">
//             <div className="text-center mb-6">
//               <h3 className="text-[15px] font-semibold tracking-[0.2em] text-gray-800 uppercase">
//                 {title}
//               </h3>
//             </div>

//             <div className="space-y-4">
//               {/* Department Name */}
//               <div>
//                 {/* <button type="button" onClick={() => toast.info("Test toast from modal!")}>
//                   Test Toast
//                 </button> */}
//                 <label className="block text-sm text-gray-700 mb-1">
//                   Tên phòng ban <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   className={`w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 ${errors.departmentName
//                       ? "border-red-400 focus:ring-red-200"
//                       : "border-gray-300 focus:ring-blue-200"
//                     }`}
//                   value={form.departmentName}
//                   onChange={(e) =>
//                     setForm((s) => ({ ...s, departmentName: e.target.value }))
//                   }
//                 />
//                 {errors.departmentName && (
//                   <p className="mt-1 text-xs text-red-500">{errors.departmentName}</p>
//                 )}
//               </div>

//               {/* Code
//               <div>
//                 <label className="block text-sm text-gray-700 mb-1">
//                   Mã phòng ban <span className="text-red-500">*</span>
//                 </label>
//                 <input
//                   className={`w-full rounded-md border px-3 py-2 text-sm uppercase tracking-wider focus:outline-none focus:ring-2 ${
//                     errors.code ? "border-red-400 focus:ring-red-200" : "border-gray-300 focus:ring-blue-200"
//                   }`}
//                   value={form.code}
//                   onChange={(e) =>
//                     setForm((s) => ({ ...s, code: e.target.value.toUpperCase() }))
//                   }
//                 />
//                 {errors.code && <p className="mt-1 text-xs text-red-500">{errors.code}</p>}
//               </div> */}

//               {/* Description */}
//               <div>
//                 <label className="block text-sm text-gray-700 mb-1">Mô tả</label>
//                 <textarea
//                   className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-200"
//                   rows={3}
//                   value={form.description ?? ""}
//                   onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
//                 />
//               </div>
//             </div>

//             {/* Buttons */}
//             <div className="mt-6 flex items-center justify-end gap-3">
//               {onCancel && (
//                 <button
//                   onClick={onCancel}
//                   className="px-6 py-2 rounded-full bg-red-600 text-white hover:bg-red-700 transition-colors"
//                 >
//                   Hủy
//                 </button>
//               )}
//               <button
//                 onClick={handleSubmit}
//                 disabled={busy}
//                 className="px-6 py-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:opacity-60"
//               >
//                 {submitText}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
    
//   );
// }
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Building2 } from "lucide-react";

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
  const [busy, setBusy] = useState(false);

  const validate = () => {
    const e: typeof errors = {};
    if (!form.departmentName.trim()) e.departmentName = "Tên phòng ban không được bỏ trống";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    try {
      setBusy(true);
      await onSubmit({
        departmentName: form.departmentName.trim(),
        description: form.description.trim(),
      });
    } finally {
      setBusy(false);
    }
  };

  const descCount = useMemo(() => (form.description ?? "").length, [form.description]);

  return (
    <div className="flex justify-center">
      <div className="relative w-[640px] max-w-[94vw]">
        <div className="rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100 p-2 shadow-[0_10px_30px_rgba(0,0,0,0.12)]">
          <Card className="rounded-xl border border-slate-200">
            <CardHeader className="p-0">
              {/* Header strip */}
              <div className="flex items-center gap-3 rounded-t-xl bg-slate-900/90 px-6 py-4 text-white">
                <div className="rounded-lg bg-white/10 p-2">
                  <Building2 className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-base tracking-[0.18em] uppercase">{title}</CardTitle>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-6 p-6">
              {/* Department Name */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700" htmlFor="departmentName">
                    Tên phòng ban <span className="text-red-500">*</span>
                  </label>
                  <span className="text-xs text-slate-400">Bắt buộc</span>
                </div>
                <Input
                  id="departmentName"
                  value={form.departmentName}
                  disabled={busy}
                  placeholder="VD: Phòng Kỹ thuật"
                  className={`h-10 ${errors.departmentName ? "border-red-400 focus-visible:ring-red-200" : ""}`}
                  onChange={(e) => setForm((s) => ({ ...s, departmentName: e.target.value }))}
                />
                <div className="mt-1 min-h-[1rem] text-xs text-red-500">
                  {errors.departmentName}
                </div>
              </div>

              <Separator />

              {/* Description */}
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700" htmlFor="description">
                    Mô tả
                  </label>
                  <span className="text-xs text-slate-400">{descCount}/{MAX_DESC}</span>
                </div>
                <Textarea
                  id="description"
                  rows={5}
                  disabled={busy}
                  value={form.description ?? ""}
                  placeholder="Mô tả ngắn về chức năng, nhiệm vụ…"
                  className="resize-none"
                  onChange={(e) =>
                    setForm((s) => ({ ...s, description: e.target.value.slice(0, MAX_DESC) }))
                  }
                />
                <p className="mt-1 text-xs text-slate-500">Không bắt buộc. Tối đa {MAX_DESC} ký tự.</p>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col gap-3 p-6 pt-0">             
              <div className="flex items-center justify-end gap-3">
                {onCancel && (
                  <Button type="button" variant="ghost" onClick={onCancel} disabled={busy}>
                    Hủy
                  </Button>
                )}
                <Button onClick={handleSubmit} disabled={busy} className="px-6">
                  {busy ? "Đang xử lý..." : submitText}
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

