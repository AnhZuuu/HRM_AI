"use client";

import { CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MapPin, PencilLine, Users } from "lucide-react";
import { formatDate } from "@/app/utils/helper";

export default function RightTimeline({ schedules }: { schedules: any[] }) {
  return (
    <div className="border-t md:border-t-0 md:border-l p-4 md:p-6">
      <CardHeader className="p-0 pb-4">
        <CardTitle className="text-base">Các vòng phỏng vấn</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {schedules.length ? (
          <ol className="relative border-s pl-6">
            {schedules.map((o, idx) => (
              <li key={o.id} className="mb-8 ms-4">
                <span className="absolute -start-2 grid h-4 w-4 place-items-center rounded-full border bg-blue-50 border-blue-200">
                  <span className="h-2 w-2 rounded-[4px] bg-blue-500" />
                </span>

                <div className="flex items-center gap-2">
                  <p className="font-medium">
                    {`Vòng ${idx + 1}`}                    
                  </p>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(o.startTime ?? undefined)}
                  </span>
                </div>

                <div className="mt-2 space-y-2 text-sm text-muted-foreground bg-gray-100 border-b rounded-2xl shadow-sm p-2">
                  {o.interviewerModels.length ? (
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {o.interviewerModels.map((interviewer : any) => interviewer.fullName).join(", ")}
                    </div>
                  ) : null}

                  {o.departmentModel?.departmentName ? (
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Phòng {o.departmentModel.departmentName}
                    </div>
                  ) : null}

                  <div className="flex items-center gap-2">
                    <PencilLine className="h-4 w-4" />
                    <p className="mt-1 whitespace-pre-wrap">{o.interviewOutcomeModel?.feedback || "—"}</p>
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
