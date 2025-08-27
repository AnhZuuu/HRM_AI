"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Props } from "./type";
import { useExistingOutcome } from "../hooks/useExistingOutcome";
import ApplicantSidebar from "./sections/applicantSidebar";
import CenterTabs from "./sections/centerTabs";
import RightTimeline from "./sections/rightTimeline";

export default function InterviewScheduleDetailView({
  schedule,
  outcomes,
  durationMin,
  feedback,
  lastSubmitted,
  loading,
  loadErr,
  submitting,
  submitErr,
  setFeedback,
  setComposerOpen,
  submitFeedback,
  patchOutcome,
}: Props) {
  const router = useRouter();

  const { existingOutcome, loadingExisting, existingErr } = useExistingOutcome(
    schedule?.id,
    lastSubmitted,
    schedule,
    setComposerOpen
  );

  const outcomeToShow = lastSubmitted ?? existingOutcome;

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      <div className="flex items-end mb-2">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      <Card className="mx-auto max-w-6xl rounded-2xl shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-[280px_1fr_320px]">
          <ApplicantSidebar schedule={schedule} />

          <CenterTabs
            schedule={schedule}
            durationMin={durationMin}
            loading={loading || loadingExisting}
            loadErr={loadErr || existingErr || null}
            feedback={feedback}
            submitErr={submitErr}
            submitting={submitting}
            submitFeedback={submitFeedback}
            setFeedback={setFeedback}
            patchOutcome={patchOutcome}
            outcomeToShow={outcomeToShow || null}
          />

          <RightTimeline outcomes={outcomes} />
        </div>
      </Card>
    </div>
  );
}
