"use client";

import { useState } from "react";
import { Account, AnySchedule, CVApplicant, PendingOne } from "../sampleData/mockData";
import { namesFromIds } from "@/app/utils/name";


export const COMPLETED = new Set(["completed", "done", "interviewed"]);

export function useSchedulePending() {
  const [pending, setPending] = useState<Record<string, PendingOne>>({});
  return { pending, setPending };
}

export function getRoundView(
  app: CVApplicant,
  round: 1 | 2,
  pending: Record<string, PendingOne>,
  employees: Account[]
) {
  const p = pending[app.id];
  if (p && p.round === round) {
    return {
      status: "Scheduled (pending)",
      startTime: p.startTime ?? null,
      endTime: p.endTime ?? null,
      interviewerNames: namesFromIds(p.interviewerIds, employees) || "—",
      notes: p.notes ?? null,
      pending: true,
      exists: true,
    };
  }

  const list = (app.interviewSchedules ?? []) as AnySchedule[];
  const hit = list.find((x) => Number(x.round ?? 0) === round);
  if (!hit) {
    return {
      status: null, startTime: null, endTime: null,
      interviewerNames: "—", notes: null, pending: false, exists: false,
    };
  }

  const iv = Array.isArray(hit.interviewers)
    ? hit.interviewers
        .map((i: any) => `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim())
        .filter(Boolean)
        .join(", ")
    : typeof hit.interviewers === "string"
    ? hit.interviewers
    : "—";

  return {
    status: hit.status ?? null,
    startTime: hit.startTime ?? null,
    endTime: hit.endTime ?? null,
    interviewerNames: iv || "—",
    notes: hit.notes ?? null,
    pending: false,
    exists: true,
  };
}
