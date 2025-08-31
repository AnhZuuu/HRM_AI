"use client";

import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";
import { INTERVIEW_STATUS_MAP } from "@/app/utils/enum";
import { Props } from "../type";
import SectionCard from "../../ui/sectionCard";
import InfoRow from "../../ui/infoRow";
import { fmt } from "../../hooks/useInterviewScheduleDetail";


export default function OverviewPanel({
  schedule,
  durationMin,
}: Pick<Props, "schedule" | "durationMin">) {
  return (
    <div className="mt-6 space-y-6">
      <SectionCard title="Basic Information">
        <InfoRow label="Interview Type" value={"—"} />
        <InfoRow label="Round" value={schedule?.interviewStageModel?.order} />
        <InfoRow
          label="Status"
          value={
            <Badge className={INTERVIEW_STATUS_MAP[schedule?.status ?? 0].className}>
              {INTERVIEW_STATUS_MAP[schedule?.status ?? 0].label}
            </Badge>
          }
        />
        <InfoRow label="Duration" value={`${durationMin} minutes`} />
      </SectionCard>

      <SectionCard title="Schedule Timing">
        <InfoRow
          label="Start"
          value={
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {fmt(schedule?.startTime)}
            </span>
          }
        />
        <InfoRow
          label="End"
          value={
            <span className="inline-flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              {fmt(schedule?.endTime)}
            </span>
          }
        />
      </SectionCard>
    </div>
  );
}
