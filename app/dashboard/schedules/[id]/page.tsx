"use client";

import { useInterviewScheduleDetail } from "@/components/interviewSchedule/hooks/useInterviewScheduleDetail";
import InterviewScheduleDetailView from "@/components/interviewSchedule/interviewScheduleDetail/detailInterviewCard";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ id: string }>();
  const id = String(params?.id || "");

  const hook = useInterviewScheduleDetail(id);

  return <InterviewScheduleDetailView {...hook} />;
}
