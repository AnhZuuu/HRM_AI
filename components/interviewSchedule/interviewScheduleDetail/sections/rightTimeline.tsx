"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, PencilLine, Users } from "lucide-react";
import { UiInterviewOutcome, fmt } from "../../hooks/useInterviewScheduleDetail";

export default function RightTimeline({ outcomes }: { outcomes: UiInterviewOutcome[] }) {
  return (
    <div className="border-t md:border-t-0 md:border-l p-4 md:p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base">Các vòng phỏng vấn</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {outcomes.length ? (
          <ol className="relative border-s pl-6">
            {outcomes.map((o, idx) => (
              <li key={o.id} className="mb-8 ms-4">
                <span className="absolute -start-2 grid h-4 w-4 place-items-center rounded-full border bg-blue-50 border-blue-200">
                  <span className="h-2 w-2 rounded-[4px] bg-blue-500" />
                </span>

                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {`Stage ${o.interviewSchedule?.stageOrder ?? idx + 1}`}
                    {o.interviewSchedule?.stageName ? ` · ${o.interviewSchedule.stageName}` : ""}
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {fmt(o.interviewSchedule?.startTime ?? undefined)}
                  </span>
                </div>

                <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-gray-100 border-b rounded-2xl shadow-sm p-2">
                  {o.interviewSchedule?.interviewerNames?.length ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {o.interviewSchedule?.interviewerNames?.join(", ")}
                    </div>
                  ) : null}

                  {o.interviewSchedule?.location ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      {o.interviewSchedule.location}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <PencilLine className="h-4 w-4" />
                    <p className="mt-1 whitespace-pre-wrap">{o.feedback || "—"}</p>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        ) : (
          <div className="text-sm text-muted-foreground">Chưa phỏng vấn.</div>
        )}
      </CardContent>
    </div>
  );
}
