"use client";

import { useEffect, useState } from "react";

import {
  getApplicantsByCampaign,
  getCampaigns,
  getDepartmentsByCampaign,
  getEmployeesByDepartment,
  getInterviewTypes,
  getPositionsByCampaign,
} from "@/components/interviewSchedule/sampleData/dataSource";
import { Account, Campaign, CampaignPosition, CVApplicant, Department, InterviewType } from "../sampleData/mockData";

export function useInterviewMasterData(
  campaignId?: string,
  departmentId?: string
) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [interviewTypes, setInterviewTypes] = useState<InterviewType[]>([]);
  const [positions, setPositions] = useState<CampaignPosition[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<CVApplicant[]>([]);
  const [employees, setEmployees] = useState<Account[]>([]);

  const [loading, setLoading] = useState({
    campaigns: false, positions: false, departments: false, applicants: false, employees: false,
  });

  // campaigns + interview types (1 lần)
  useEffect(() => {
    (async () => {
      setLoading((s) => ({ ...s, campaigns: true }));
      try {
        const [cps, itypes] = await Promise.all([getCampaigns(), getInterviewTypes()]);
        setCampaigns(cps);
        setInterviewTypes(itypes);
      } finally {
        setLoading((s) => ({ ...s, campaigns: false }));
      }
    })();
  }, []);

  // khi campaignId đổi => positions/departments/applicants
  useEffect(() => {
    if (!campaignId) {
      setPositions([]); setDepartments([]); setApplicants([]);
      return;
    }
    (async () => {
      setLoading((s) => ({ ...s, positions: true, departments: true, applicants: true }));
      try {
        const [pos, deps, apps] = await Promise.all([
          getPositionsByCampaign(campaignId),
          getDepartmentsByCampaign(campaignId),
          getApplicantsByCampaign(campaignId),
        ]);
        setPositions(pos);
        setDepartments(deps);
        setApplicants(apps);
      } finally {
        setLoading((s) => ({ ...s, positions: false, departments: false, applicants: false }));
      }
    })();
  }, [campaignId]);

  // khi departmentId đổi => employees
  useEffect(() => {
    if (!departmentId) { setEmployees([]); return; }
    (async () => {
      setLoading((s) => ({ ...s, employees: true }));
      try {
        const emps = await getEmployeesByDepartment(departmentId);
        setEmployees(emps);
      } finally {
        setLoading((s) => ({ ...s, employees: false }));
      }
    })();
  }, [departmentId]);

  return {
    campaigns, interviewTypes, positions, departments, applicants, employees, loading,
  };
}
