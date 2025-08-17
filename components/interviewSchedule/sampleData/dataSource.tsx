// DataSource.ts
const USE_MOCKS = true; // flip to false when backend is ready

import { authFetch } from "@/app/utils/authFetch";
import {
  Campaign, CampaignPosition, Department, CVApplicant, Account, InterviewType
} from "./mockData";
import {
  mockCampaigns, mockPositions, mockDepartments,
  mockApplicants, mockEmployees, mockInterviewTypes
} from "./mockData";

const unwrap = async (res: Response) => {
  const txt = await res.text();
  const json = txt ? JSON.parse(txt) : null;
  return json?.data?.data ?? json?.data ?? json;
};

export async function getCampaigns(): Promise<Campaign[]> {
  if (USE_MOCKS) return mockCampaigns;
  return await authFetch("/api/campaigns").then(unwrap);
}

export async function getInterviewTypes(): Promise<InterviewType[]> {
  if (USE_MOCKS) return mockInterviewTypes;
  return await authFetch("/api/interview-types").then(unwrap);
}

export async function getPositionsByCampaign(campaignId: string): Promise<CampaignPosition[]> {
  if (USE_MOCKS) return mockPositions.filter(p => p.campaignId === campaignId);
  return await authFetch(`/api/campaign-positions?campaignId=${campaignId}`).then(unwrap);
}

export async function getDepartmentsByCampaign(campaignId: string): Promise<Department[]> {
  if (USE_MOCKS) return mockDepartments; // or filter if you have mapping per campaign
  return await authFetch(`/api/departments?campaignId=${campaignId}`).then(unwrap);
}

export async function getApplicantsByCampaign(campaignId: string): Promise<CVApplicant[]> {
  if (USE_MOCKS)
    return mockApplicants.filter(a => a.status === "Chưa phỏng vấn")
                         .filter(a => mockPositions.find(p => p.id === a.campaignPositionId)?.campaignId === campaignId);
  return await authFetch(
    `/api/cv-applicants?campaignId=${campaignId}&status=${encodeURIComponent("Chưa phỏng vấn")}`
  ).then(unwrap);
}

export async function getEmployeesByDepartment(departmentId: string): Promise<Account[]> {
  if (USE_MOCKS) return mockEmployees[departmentId] ?? [];
  return await authFetch(`/api/departments/${departmentId}/employees`).then(unwrap);
}
