import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
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

// New types for interview process
export type InterviewStageModel = {
  id: string;
  name?: string | null;
  description?: string | null;
  order?: number | null;
  duration?: number | null;
  type?: string | null;
};

export type InterviewProcessModel = {
  id: string;
  departmentId: string;
  processName: string;
  description: string | null;
  departmentName: string | null;
  countOfStage: number;
  interviewStageModels: InterviewStageModel[];
  creationDate?: string | null;
  createdById?: string | null;
  modificationDate?: string | null;
  modifiedById?: string | null;
  deletionDate?: string | null;
  deletedById?: string | null;
  isDeleted?: boolean;
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
  interviewProcessModels: InterviewProcessModel[]; // <-- added
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
  return (json?.data ?? json) as T;
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await authFetch(`${API.DEPARTMENT.BASE}/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return notFound();
  if (!res.ok) return notFound();

  const data = await unwrap<DepartmentDetail | ApiEnvelope<DepartmentDetail>>(res);

  const entity: DepartmentDetail =
    (data as any)?.departmentName
      ? (data as DepartmentDetail)
      : ((data as ApiEnvelope<DepartmentDetail>)?.data as DepartmentDetail);

  if (!entity) return notFound();

  // Normalize defensive fields
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
    interviewProcessModels: Array.isArray(entity.interviewProcessModels)
      ? entity.interviewProcessModels
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
