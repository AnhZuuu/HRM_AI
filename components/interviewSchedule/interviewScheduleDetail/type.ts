"use client";

import { Dispatch, SetStateAction } from "react";
import { ApiInterviewSchedule, UiInterviewOutcome } from "../hooks/useInterviewScheduleDetail";

export type Props = {
  schedule: ApiInterviewSchedule | null;
  outcomes: UiInterviewOutcome[];
  durationMin: number;
  feedback: string;
  lastSubmitted: UiInterviewOutcome | null;

  loading: boolean;
  loadErr: string | null;
  submitting: boolean;
  submitErr: string | null;
  composerOpen: boolean;

  setFeedback: Dispatch<SetStateAction<string>>;
  setComposerOpen: (b: boolean) => void;
  submitFeedback: () => Promise<void> | void;
  patchOutcome: (id: string, patch: Partial<UiInterviewOutcome>) => void;
};

export type ApiOutcomeItem = {
  interviewScheduleId: string;
  feedback: string | null;
  id: string;
  creationDate: string | null;
};
