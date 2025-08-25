"use client";

import { useEffect, useMemo, useState } from "react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { toast } from "react-toastify";

/* ===== Types ===== */
export type UUID = string;

export interface ApiInterviewOutcome {
  interviewScheduleId: UUID;
  feedback: string | null;
  id: UUID;
  creationDate: string | null;
}

export interface ApiInterviewSchedule {
  cvApplicantId: UUID;
  startTime: string | null;
  endTime: string | null;
  status: number;
  notes: string | null;

  interviewerModels: { id: UUID; name: string }[];

  departmentModel?: { id: UUID; departmentName: string } | null;
  interviewStageModel?: { id: UUID; stageName: string | null; order: number | null } | null;
  campaignPositionModel?: { id: UUID; description?: string | null } | null;

  cvApplicantModel: {
    id: UUID;
    fullName: string;
    email?: string | null;
    fileUrl: string;
    summary?: string | null;
  };

  outcomes: ApiInterviewOutcome[];

  id: UUID;
  creationDate: string | null;
}

export interface UiInterviewSchedule {
  id: UUID;
  stageOrder?: number | null;
  stageName?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  interviewerNames?: string[] | null;
}

export interface UiInterviewOutcome {
  id: UUID;
  feedback: string | null;
  createdAt: string | null;
  interviewScheduleId?: string;
  interviewSchedule?: UiInterviewSchedule | null;
  interviewOutcomeStatus?: number | null;
}

export function fmt(iso?: string | null, withTime = true) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return withTime ? d.toLocaleString() : d.toLocaleDateString();
}

export function minutesBetween(a?: string | null, b?: string | null) {
  if (!a || !b) return 0;
  const ms = new Date(b).getTime() - new Date(a).getTime();
  return Math.max(0, Math.round(ms / 60000));
}

function toUiSchedule(s: ApiInterviewSchedule): UiInterviewSchedule {
  return {
    id: s.id,
    stageOrder: s.interviewStageModel?.order ?? null,
    stageName: s.interviewStageModel?.stageName ?? null,
    startTime: s.startTime,
    endTime: s.endTime,
    location: s.departmentModel?.departmentName ?? null,
    interviewerNames: s.interviewerModels?.map((i) => i.name) ?? [],
  };
}

/* ===== Hook chính ===== */
export function useInterviewScheduleDetail(scheduleId: string) {
  const [schedule, setSchedule] = useState<ApiInterviewSchedule | null>(null);
  const [outcomes, setOutcomes] = useState<UiInterviewOutcome[]>([]);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadErr, setLoadErr] = useState<string | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const [submitErr, setSubmitErr] = useState<string | null>(null);
  const [composerOpen, setComposerOpen] = useState(true);
  const [lastSubmitted, setLastSubmitted] = useState<UiInterviewOutcome | null>(null);

  useEffect(() => {
    if (!scheduleId) return;
    let alive = true;

    (async () => {
      setLoading(true);
      setLoadErr(null);
      try {
        const res = await authFetch(`${API.INTERVIEW.SCHEDULE}/${scheduleId}`, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();
        const s: ApiInterviewSchedule = json?.data;
        if (!alive) return;

        setSchedule(s);

        const uiSched = toUiSchedule(s);
        const uiOut = (s.outcomes ?? []).map(
          (x): UiInterviewOutcome => ({
            id: x.id,
            feedback: x.feedback ?? "",
            createdAt: x.creationDate ?? "",
            interviewSchedule: uiSched,
            interviewOutcomeStatus: (x as any)?.status ?? 0,
          }),
        );
        setOutcomes(uiOut);
      } catch (e: any) {
        if (!alive) return;
        setLoadErr(e?.message || "Failed to load schedule");
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [scheduleId]);

  const durationMin = useMemo(
    () => minutesBetween(schedule?.startTime, schedule?.endTime),
    [schedule?.startTime, schedule?.endTime],
  );

  async function submitFeedback() {
    setSubmitErr(null);
    if (!schedule) {
      setSubmitErr("Không thể gửi đánh giá: chưa tải lịch phỏng vấn.");
      return;
    }
    const text = feedback.trim();
    if (!text) return;

    const tempId = crypto.randomUUID() as UUID;
    const uiSched = toUiSchedule(schedule);
    const optimistic: UiInterviewOutcome = {
      id: tempId,
      feedback: text,
      createdAt: new Date().toISOString(),
      interviewSchedule: uiSched,
      interviewOutcomeStatus: 0,
    };
    setOutcomes((arr) => [optimistic, ...arr]);
    setFeedback("");
    setSubmitting(true);

    try {
      const res = await authFetch(`${API.INTERVIEW.OUTCOME}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewScheduleId: schedule.id, feedback: text }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      const created: ApiInterviewOutcome = json?.data ?? json;

      const createdUi: UiInterviewOutcome = {
        id: created.id,
        feedback: created.feedback ?? "",
        createdAt: created.creationDate ?? new Date().toISOString(),
        interviewSchedule: uiSched,
        interviewOutcomeStatus: 1,
      };

      setOutcomes((arr) => {
        const withoutTemp = arr.filter((x) => x.id !== tempId);
        return [createdUi, ...withoutTemp];
      });

      setLastSubmitted(createdUi);
      setComposerOpen(false);
    } catch (e: any) {
      setOutcomes((arr) => arr.filter((x) => x.id !== tempId));
      setSubmitErr(e?.message || "Gửi đánh giá thất bại.");
      setFeedback(text);
    } finally {
      setSubmitting(false);
    }
  }

  function patchOutcome(id: UUID, patch: Partial<UiInterviewOutcome>) {
  setOutcomes(prev => prev.map(o => (o.id === id ? { ...o, ...patch } : o)));
  setLastSubmitted(prev => (prev?.id === id ? { ...prev, ...patch } : prev));
}


  return {
    // data
    schedule,
    outcomes,
    durationMin,
    feedback,
    lastSubmitted,

    // ui state
    loading,
    loadErr,
    submitting,
    submitErr,
    composerOpen,

    // actions
    setFeedback,
    setComposerOpen,
    submitFeedback,
    
    patchOutcome,
  };
}
