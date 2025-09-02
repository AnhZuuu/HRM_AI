"use client";

import { Users } from "lucide-react";
import SectionCard from "../../ui/sectionCard";
import InfoRow from "../../ui/infoRow";

export default function PanelDetails({ schedule }: Pick<any, "schedule">) {
  return (
    <div className="mt-6 space-y-4">
      <SectionCard title="Phòng ban & Vị trí ứng tuyển">
        <InfoRow label="Phòng ban" value={schedule?.departmentModel?.departmentName || "—"} />
        <InfoRow label="Vị trí ứng tuyển" value={schedule?.campaignPositionModel?.description ?? "—"} />
      </SectionCard>

      <SectionCard title="Người phỏng vấn">
        {schedule?.interviewerModel?.length ? (
          schedule.interviewerModel.map((i : any) => (
            <InfoRow
              key={i.id}
              label={
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Người phỏng vấn.
                </span>
              }
              value={i.fullName}
            />
          ))
        ) : (
          <InfoRow label="Người phỏng vấn." value="Chưa có người phỏng vấn." />
        )}
      </SectionCard>

      <SectionCard title="">      
        <InfoRow label="Ghi chú" value={schedule?.notes ?? "Không có ghi chú."} />
      </SectionCard>
    </div>
  );
}
