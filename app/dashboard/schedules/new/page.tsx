import HandleCreateInterviewSchedule from "@/components/interviewSchedule/handleCreateInterviewSchedule";
import { Suspense } from "react";
export const metadata = { title: "Tạo lịch phỏng vấn | HRM-AI" };
export default function CreateInterviewPage() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      <HandleCreateInterviewSchedule />
    </Suspense>
  );
}
