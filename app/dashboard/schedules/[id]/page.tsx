"use client";

import InterviewScheduleDetailView from "@/components/interviewSchedule/ui/detailInterviewCard";
import { useInterviewScheduleDetail } from "@/components/interviewSchedule/useInterviewScheduleDetail";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const hook = useInterviewScheduleDetail(id);

  return <InterviewScheduleDetailView {...hook} />;
}
