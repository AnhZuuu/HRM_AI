import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";

// Helpers
export type OutcomeStatus = 0 | 1 | 2; // 0=Pending, 1=Pass, 2=Fail

export const outcomeStatusLabel = (s: OutcomeStatus | null) =>
  s === 1 ? "Pass" : s === 2 ? "Fail" : "Pending";

export const outcomeStatusClass = (s: OutcomeStatus | null) =>
  s === 1
    ? "bg-emerald-600/30 text-emerald-700 border-emerald-200"
    : s === 2
    ? "bg-rose-600/15 text-rose-700 border-rose-200"
    : "bg-slate-100 text-slate-700 border-slate-200";

// API call
export async function changeOutcomeStatus(outcomeId: string, status: OutcomeStatus) {
  const url = `${API.INTERVIEW.OUTCOME}/${outcomeId}/change-status?interviewOutcomeStatus=${status}`;
  const res = await authFetch(url, { method: "PUT" });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    toast.error(txt);
    throw new Error(txt || `HTTP ${res.status}`);
  }
  return res;
}
