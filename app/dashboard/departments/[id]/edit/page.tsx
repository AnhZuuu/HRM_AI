// app/dashboard/departments/[id]/edit/page.tsx (example path)
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DepartmentForm, { DepartmentFormValues } from "@/components/department/departmentForm";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";

type DeptApi = {
  id: string;
  departmentName: string;
  code: string;
  description: string | null;
};

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

export default function EditDepartmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [dept, setDept] = useState<DeptApi | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const res = await authFetch(`${API.DEPARTMENT.BASE}/${id}`, { method: "GET" });
        const txt = await res.text();
        const json = txt ? JSON.parse(txt) : null;
        const data: DeptApi = (json?.data ?? json) as DeptApi;

        if (!res.ok || !data) {
          throw new Error(json?.message || "Không tải được dữ liệu phòng ban.");
        }
        setDept({
          id: data.id,
          departmentName: data.departmentName,
          code: data.code,
          description: data.description ?? "",
        });
      } catch (e: any) {
        setErr(e?.message || "Lỗi không xác định");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleUpdate = async (values: DepartmentFormValues) => {
    // match API contract exactly
    const payload = {
      departmentName: values.departmentName.trim(),
      code: values.code.trim(),
      description: values.description?.trim() ?? "",
    };

    const res = await authFetch(`${API.DEPARTMENT.BASE}/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const txt = await res.text();
    const json = txt ? JSON.parse(txt) : null;
    if (!res.ok) {
      throw new Error(json?.message || "Cập nhật thất bại.");
    }
  };

  if (loading) return <div className="p-6">Đang tải…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!dept) return <div className="p-6 text-red-600">Không tìm thấy phòng ban.</div>;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DepartmentForm
        title="Cập nhật phòng ban"
        initial={{
          departmentName: dept.departmentName,
          code: dept.code,
          description: dept.description ?? "",
        }}
        onSubmit={async (vals) => {
          try {
            await handleUpdate(vals);
            alert("Chỉnh sửa thành công!");
            router.push("/dashboard/departments");
          } catch (e: any) {
            alert(e?.message || "Cập nhật thất bại.");
          }
        }}
        submitText="Lưu thay đổi"
        onCancel={() => router.back()}
      />
    </div>
  );
}
