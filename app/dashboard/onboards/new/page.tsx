"use client";

import * as React from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { authFetch } from "@/app/utils/authFetch";
import CreateOnboardForm, { CreateOnboardFormValues, Option, SalaryTypeUI } from "@/components/onboard/createOnboardDialog";
import API from "@/api/api";
import { useToast } from "@/hooks/use-toast";

// map UI → số cho API
const SALARY_TYPE_MAP: Record<SalaryTypeUI, number> = {
  Net: 0,
  Gross: 1,
};

export default function OnboardCreatePage() {
  const sp = useSearchParams();
  const router = useRouter();
  const {toast} = useToast();

  const presetOutcomeId = sp.get("outcomeId") ?? "";
  const presetApplicantId = sp.get("applicantId") ?? "";

  const [submitting, setSubmitting] = React.useState(false);

  const defaultValues: Partial<CreateOnboardFormValues> = {
    applicantId: presetApplicantId,
    interviewOutcomeId: presetOutcomeId,
    proposedSalary: 0,
    salaryType: "Net",
    proposedStartDate: "",
    notes: "",
  };

  const lockApplicantOutcome = Boolean(presetOutcomeId && presetApplicantId);

  // Tối thiểu để hiển thị option khi đã có preset
  const applicantOptions: Option[] = presetApplicantId
    ? [{ id: presetApplicantId, label: presetApplicantId }]
    : [];
  const outcomeOptions: Option[] = presetOutcomeId
    ? [{ id: presetOutcomeId, label: presetOutcomeId }]
    : [];

  async function handleSubmit(values: CreateOnboardFormValues) {
    setSubmitting(true);
    try {
      const payload = {
        interviewOutcomeId: values.interviewOutcomeId,
        proposedSalary: values.proposedSalary ?? 0,
        salaryType: SALARY_TYPE_MAP[values.salaryType],
        proposedStartDate: new Date(values.proposedStartDate).toISOString(),
        status: 0, // Pending
      };

      const res = await authFetch(`${API.ONBOARD.BASE}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const raw = await res.text();
        let json: any = null;
        try { json = raw ? JSON.parse(raw) : null; } catch {  }

        if (!res.ok) {
        const msg =
            json?.message ||
            json?.error?.message ||
            (typeof json === "string" ? json : "") ||
            res.statusText ||
            `HTTP ${res.status}`;
        throw new Error(msg);
        }
      toast({
        title: "Success",
        description: "Tạo onboard thành công!",
        })
      router.push("/dashboard/onboards");
    } catch (e: any) {
      alert(e?.message || "Create onboard failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <CreateOnboardForm
      defaultValues={defaultValues}
      applicantOptions={applicantOptions}
      outcomeOptions={outcomeOptions}
      lockApplicantOutcome={lockApplicantOutcome}
      submitting={submitting}
      onSubmit={handleSubmit}
    />
  );
}
