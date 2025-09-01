"use client";

import InterviewScheduleDetail from "@/components/interviewSchedule/interviewScheduleDetailCard";
import { useParams } from "next/navigation";

export default function InterviewSchedulePage() {
  const params = useParams<{ id: string }>();
  return <InterviewScheduleDetail interviewScheduleId={params.id} />;
}