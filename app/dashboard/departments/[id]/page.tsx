import DepartmentDetailClient from "@/components/department/detailDepartmentPage";
import { notFound } from "next/navigation";

// // Types
export interface Account {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  username?: string;
  phoneNumber?: string;
  imageUrl?: string;
  isActive?: boolean;
  role?: string;
}
export interface CampaignPosition {
  id: string;
  title?: string;
  description?: string | null;
}
export interface Department {
  id: string; 
  departmentName: string;
  code: string;
  description: string | null;
  campaignPositions: CampaignPosition[] | null;
  employees: Account[] | null;
}

// Replace with your real fetch
async function getDepartment(id: string): Promise<Department | null> {
  // Example (server fetch):
  // const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/Department/${id}`, { cache: "no-store" });
  // if (!res.ok) return null;
  // return res.json();

  // Mock:
  return {
    id,
    departmentName: "Kinh Doanh",
    code: "SALES",
    description: "Phụ trách bán hàng & quan hệ khách hàng.",
    campaignPositions: [
      { id: "pos-1", title: "Sales Executive", description: "Chịu trách nhiệm doanh số khu vực." },
      { id: "pos-2", title: "Account Manager", description: "Quản lý khách hàng chiến lược." },
    ],
    employees: [
      { id: "emp-1", username: "anh.le", firstName: "Anh", lastName: "Lê", role: "Trưởng phòng", phoneNumber: "0909 000 001", email: "anh.le@example.com", isActive: true },
      { id: "emp-2", username: "bao.tran", firstName: "Bảo", lastName: "Trần", role: "Sales", phoneNumber: "0909 000 002", email: "bao.tran@example.com", isActive: true },
    ],
  };
}

export default async function DepartmentDetailPage(
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dept = await getDepartment(id);
  if (!dept) return notFound();

  return <DepartmentDetailClient dept={dept as any} />;
}
