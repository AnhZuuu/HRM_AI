"use client";

import { Badge } from "@/components/ui/badge";
import { INTERVIEW_STATUS_MAP } from "@/app/utils/enum";
import SectionCard from "../../ui/sectionCard";
import InfoRow from "../../ui/infoRow";
import { formatDate } from "@/app/utils/helper";


export default function OverviewPanel({
  schedule,
  durationMin,
}: Pick<any, "schedule" | "durationMin">) {
  return (
    <div className="mt-6 space-y-6">
      <SectionCard title="Thông tin cơ bản">
        <InfoRow label="Vòng" value={schedule?.interviewStageModel?.stageName} />
        <InfoRow
          label="Trạng thái"
          value={
            <Badge className={INTERVIEW_STATUS_MAP[schedule?.status ?? 0].className}>
              {INTERVIEW_STATUS_MAP[schedule?.status ?? 0].label}
            </Badge>
          }
        />
        <InfoRow label="Thời gian" value={`${durationMin} phút`} />
      </SectionCard>

      <SectionCard title="Ngày giờ phỏng vấn">
        <InfoRow
          label="Bắt đầu"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(schedule?.startTime)}
            </span>
          }
        />
        <InfoRow
          label="Kết thúc"
          value={
            <span className="inline-flex items-center gap-2">
              {formatDate(schedule?.endTime)}
            </span>
          }
        />
      </SectionCard>
    </div>
  );
}
