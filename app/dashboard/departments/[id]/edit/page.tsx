"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import DepartmentForm, { DepartmentFormValues } from "@/components/department/departmentForm";

async function getDepartment(id: string) {
  return { id, departmentName: "Kinh Doanh", code: "SALES", description: "Phụ trách bán hàng…" };
}

export default function EditDepartmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [dept, setDept] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const d = await getDepartment(id);
      setDept(d);
      setLoading(false);
    })();
  }, [id]);

  const handleUpdate = async (values: DepartmentFormValues) => {
    // await fetch(`/api/Department/${id}`, { method: "PUT", body: JSON.stringify(values) });
    alert("Chỉnh sửa thành công!");
    router.push("/dashboard/departments");
  };

  if (loading) return <div className="p-6">Đang tải…</div>;
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
        onSubmit={handleUpdate}
        submitText="Lưu thay đổi"
        onCancel={() => router.back()}
      />
    </div>
  );
}
