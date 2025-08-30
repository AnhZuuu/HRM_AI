"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { FileText } from "lucide-react";
import { initials } from "@/app/utils/helper";
import { Props } from "../type";

export default function ApplicantSidebar({ schedule }: Pick<Props, "schedule">) {
  return (
    <div className="border-b md:border-b-0 md:border-r p-6">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 text-lg font-semibold">Thông tin ứng viên</div>
        <div className="relative h-24 w-24 rounded-full bg-gradient-to-b from-blue-100 to-blue-200 overflow-hidden">
          <Avatar className="h-24 w-24 rounded-2xl ring-1 ring-border">
            <AvatarFallback className="text-2xl font-semibold">
              {initials(schedule?.cvApplicantModel.fullName)}
            </AvatarFallback>
          </Avatar>
        </div>

        <h3 className="mt-4 text-lg font-semibold leading-tight">
          {schedule?.cvApplicantModel.fullName ?? "—"}
        </h3>

        <p className="mt-1 max-w-[220px] text-sm leading-relaxed text-muted-foreground">
          Ứng tuyển vào vị trí {schedule?.campaignPositionModel?.description}
        </p>
      </div>

      <div className="my-6 h-px bg-border" />

      <div className="space-y-2 text-sm mb-2">
        <div className="text-muted-foreground">Email</div>
        <div className="font-medium">{schedule?.cvApplicantModel.email || "—"}</div>
      </div>

      <a
        className="flex w-full items-center gap-2 text-left text-sm text-primary underline-offset-4 hover:underline"
        href={schedule?.cvApplicantModel.fileUrl}
      >
        <FileText className="h-4 w-4" /> CV đính kèm
      </a>

      <div className="my-6 h-px bg-border" />
    </div>
  );
}
