import API from "@/api/api";
import DepartmentDetailClient from "@/components/department/detailDepartmentPage";
import { notFound } from "next/navigation";

// ===== Types aligned with your API response =====
export type Employee = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phoneNumber: string | null;
  status: number | null;
  creationDate?: string | null;
};

export type CampaignPositionDetailModel = {
  id: string;
  campaignPositionId: string;
  type: string | null;
  key: string | null;
  value: string | null;
  groupIndex: number | null;
  creationDate?: string | null;
};

export type CampaignPositionModel = {
  id: string;
  totalSlot: number;
  description: string | null;
  campaignPositionDetailModels: CampaignPositionDetailModel[];
  creationDate?: string | null;
};

export type DepartmentDetail = {
  id: string;
  departmentName: string;
  code: string;
  description: string | null;
  numOfCampaignPosition: number;
  numOfEmployee: number;
  employees: Employee[];
  campaignPositionModels: CampaignPositionModel[];
  creationDate?: string | null;
  createdById?: string | null;
  modificationDate?: string | null;
  modifiedById?: string | null;
  deletionDate?: string | null;
  deletedById?: string | null;
  isDeleted?: boolean;
};

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

const unwrap = async <T,>(res: Response): Promise<T> => {
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : null;
  // Your API returns { code, status, message, data: {...} }
  return (json?.data ?? json) as T;
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;

  const res = await fetch(`${API.DEPARTMENT.BASE}/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return notFound();
  if (!res.ok) return notFound();

  const data = await unwrap<DepartmentDetail | ApiEnvelope<DepartmentDetail>>(res);

  // Accept either envelope or raw object defensively
  const entity: DepartmentDetail =
    (data as any)?.departmentName
      ? (data as DepartmentDetail)
      : ((data as ApiEnvelope<DepartmentDetail>)?.data as DepartmentDetail);

  if (!entity) return notFound();

  // Normalize/defend against missing arrays or nullables
  const dept: DepartmentDetail = {
    id: entity.id,
    departmentName: entity.departmentName,
    code: entity.code,
    description: entity.description ?? null,
    numOfCampaignPosition: Number(entity.numOfCampaignPosition ?? 0),
    numOfEmployee: Number(entity.numOfEmployee ?? 0),
    employees: Array.isArray(entity.employees) ? entity.employees : [],
    campaignPositionModels: Array.isArray(entity.campaignPositionModels)
      ? entity.campaignPositionModels
      : [],
    creationDate: entity.creationDate ?? null,
    createdById: entity.createdById ?? null,
    modificationDate: entity.modificationDate ?? null,
    modifiedById: entity.modifiedById ?? null,
    deletionDate: entity.deletionDate ?? null,
    deletedById: entity.deletedById ?? null,
    isDeleted: Boolean(entity.isDeleted ?? false),
  };

  return <DepartmentDetailClient dept={dept} />;
}
