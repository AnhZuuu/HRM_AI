"use client";
import DepartmentForm, { DepartmentFormValues } from "@/components/department/departmentForm";
import { useRouter } from "next/navigation";

export default function NewDepartmentPage() {
  const router = useRouter();

  const handleCreate = async (values: DepartmentFormValues) => {
    // TODO: replace with real API call
    // await fetch("/api/Department", { method: "POST", body: JSON.stringify(values) });
    alert("Tạo thành công"); 
    router.push("/dashboard/departments");
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <DepartmentForm title="Tạo phòng ban" onSubmit={handleCreate} submitText="Tạo mới" onCancel={() => router.back()} />
    </div>
  );
}
