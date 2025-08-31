"use client";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import DepartmentForm, { DepartmentFormValues } from "@/components/department/departmentForm";
import { useRouter } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";

export default function NewDepartmentPage() {
  const router = useRouter();

  const handleCreate = async (values: DepartmentFormValues) => {
    // TODO: replace with real API call
    await authFetch(`${API.DEPARTMENT.BASE}`, { method: "POST", body: JSON.stringify(values) });
    toast.success("Tạo thành công");
    // router.push("/dashboard/departments");
    setTimeout(() => router.push("/dashboard/departments"), 500);
  };

  return (
    <>
    <div className="container mx-auto p-6 space-y-6">
      {/* <button type="button" onClick={() => toast.info("Test toast from modal!")}>
  Test Toast
</button> */}
      <DepartmentForm title="Tạo phòng ban" onSubmit={handleCreate} submitText="Tạo mới" onCancel={() => router.back()} />
    </div>
    <ToastContainer position="top-right" autoClose={3000} />
    </>
  );
}
