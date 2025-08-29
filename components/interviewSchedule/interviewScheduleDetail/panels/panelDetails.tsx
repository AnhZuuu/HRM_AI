"use client";

import { Users } from "lucide-react";
import { Props } from "../type";
import SectionCard from "../../ui/sectionCard";
import InfoRow from "../../ui/infoRow";
import { fmt } from "../../hooks/useInterviewScheduleDetail";


export default function PanelDetails({ schedule }: Pick<Props, "schedule">) {
  return (
    <div className="mt-6 space-y-4">
      <SectionCard title="Department & Position">
        <InfoRow label="Department" value={schedule?.departmentModel?.departmentName || "—"} />
        <InfoRow label="Position" value={schedule?.campaignPositionModel?.description ?? "—"} />
      </SectionCard>

      <SectionCard title="Interview Panel">
        {schedule?.interviewerModels?.length ? (
          schedule.interviewerModels.map((i) => (
            <InfoRow
              key={i.id}
              label={
                <span className="inline-flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" /> Interv.
                </span>
              }
              value={i.name}
            />
          ))
        ) : (
          <InfoRow label="Interv." value="No interviewers assigned." />
        )}
      </SectionCard>

      <SectionCard title="Notes">
        <div className="text-sm text-muted-foreground whitespace-pre-wrap">
          {schedule?.notes || "No notes provided."}
        </div>
        <div className="mt-3 text-xs text-muted-foreground">Tạo vào: {fmt(schedule?.creationDate)}</div>
      </SectionCard>
    </div>
  );
}
