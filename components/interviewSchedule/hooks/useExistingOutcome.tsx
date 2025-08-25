"use client";

import { useEffect, useState } from "react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { UiInterviewOutcome } from "./useInterviewScheduleDetail";
import { ApiOutcomeItem, Props } from "../interviewScheduleDetail/type";

export function useExistingOutcome(
  scheduleId: string | undefined,
  lastSubmitted: UiInterviewOutcome | null,
  schedule: Props["schedule"],
  setComposerOpen: Props["setComposerOpen"]
) {
  const [existingOutcome, setExistingOutcome] = useState<UiInterviewOutcome | null>(null);
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [existingErr, setExistingErr] = useState<string | null>(null);

  useEffect(() => {
    if (!scheduleId) return;
    if (lastSubmitted) return;

    let alive = true;
    (async () => {
      setLoadingExisting(true);
      setExistingErr(null);
      try {
        const res = await authFetch(`${API.INTERVIEW.OUTCOME}`, { method: "GET" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        const list: ApiOutcomeItem[] = Array.isArray(json?.data?.data)
          ? json.data.data
          : Array.isArray(json?.data)
          ? json.data
          : [];

        const m = list.find((o) => o.interviewScheduleId === scheduleId);
        if (alive && m && schedule) {
          setExistingOutcome({
            id: m.id,
            feedback: m.feedback ?? "",
            createdAt: m.creationDate ?? "",
            interviewSchedule: {
              id: schedule.id!,
              stageOrder: schedule.interviewStageModel?.order ?? null,
              stageName: schedule.interviewStageModel?.stageName ?? null,
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              location: schedule.departmentModel?.departmentName ?? null,
              interviewerNames: schedule.interviewerModels?.map((i) => i.name) ?? [],
            },
            interviewOutcomeStatus: 1,
          });
          setComposerOpen(false);
        }
      } catch (e: any) {
        if (alive) setExistingErr(e?.message || "Không tải được đánh giá hiện có.");
      } finally {
        if (alive) setLoadingExisting(false);
      }
    })();

    return () => {
      alive = false;
    };
  }, [scheduleId, lastSubmitted, schedule, setComposerOpen]);

  return { existingOutcome, loadingExisting, existingErr, setExistingOutcome };
}
