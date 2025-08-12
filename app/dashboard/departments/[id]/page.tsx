import DepartmentDetailClient from "@/components/department/detailDepartmentPage";
import { notFound } from "next/navigation";

// Match the API shape you showed
export interface DepartmentDetail {
  id: string;
  departmentName: string;
  code: string;
  description: string | null;
  numOfCampaignPosition: number;
  numOfEmployee: number;
  // Optional fields the API may include
  campaignPositionModels?: any[]; // keep if you want to render positions later
  creationDate?: string | null;
  createdById?: string | null;
  modificationDate?: string | null;
  modifiedById?: string | null;
  deletionDate?: string | null;
  deletedById?: string | null;
  isDeleted?: boolean;
}

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

const API_BASE = "http://localhost:7064/api/v1";

const unwrap = async (res: Response) => {
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : null;
  // detail endpoint should return { data: <object> } (not paginated)
  return json?.data ?? json;
};

export default async function DepartmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const res = await fetch(`${API_BASE}/departments/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return notFound();
  if (!res.ok) return notFound();

  const payload = (await unwrap(res)) as DepartmentDetail | ApiEnvelope<DepartmentDetail>;
  // Support either raw object or envelope
  const entity: DepartmentDetail =
    (payload as any)?.departmentName
      ? (payload as DepartmentDetail)
      : ((payload as ApiEnvelope<DepartmentDetail>)?.data as DepartmentDetail);

  if (!entity) return notFound();

  // Make sure counts are always numbers (employees backend not ready => default 0)
  const dept: DepartmentDetail = {
    id: entity.id,
    departmentName: entity.departmentName,
    code: entity.code,
    description: entity.description ?? null,
    numOfCampaignPosition: Number(entity.numOfCampaignPosition ?? 0),
    numOfEmployee: Number(entity.numOfEmployee ?? 0),
    campaignPositionModels: entity.campaignPositionModels ?? [],
    creationDate: entity.creationDate ?? null,
    createdById: entity.createdById ?? null,
    modificationDate: entity.modificationDate ?? null,
    modifiedById: entity.modifiedById ?? null,
    deletionDate: entity.deletionDate ?? null,
    deletedById: entity.deletedById ?? null,
    isDeleted: Boolean(entity.isDeleted ?? false),
  };

  return <DepartmentDetailClient dept={dept as any} />;
}
