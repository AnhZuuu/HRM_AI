"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus } from "lucide-react";
import { COMPLETED, getRoundView } from "../hooks/useSchedulePending";
import { fmtRange } from "@/app/utils/time";
import { Account, CVApplicant } from "../sampleData/mockData";

export default function ApplicantsTable({
  applicants, campaignPositionId, employees, pending,
  onCreateR1, onCreateR2, departmentChosen,
}: {
  applicants: CVApplicant[];
  campaignPositionId?: string;
  employees: Account[];
  pending: Record<string, any>;
  onCreateR1: (applicantId: string) => void;
  onCreateR2: (applicantId: string) => void;
  departmentChosen: boolean;
}) {
  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Ứng viên</TableHead>
            <TableHead>Vòng 1</TableHead>
            <TableHead>PV V1</TableHead>
            <TableHead>Vòng 2</TableHead>
            <TableHead>PV V2</TableHead>
            <TableHead>Ghi chú</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applicants
            .filter((a) => a.campaignPositionId === campaignPositionId)
            .map((a) => {
              const r1 = getRoundView(a, 1, pending, employees);
              const r2 = getRoundView(a, 2, pending, employees);

              const r1Status = (r1.status ?? "—").toString();
              const r2Status = (r2.status ?? "—").toString();
              const r1Done = r1.exists && COMPLETED.has((r1.status ?? "").toLowerCase());

              const canCreateR1 = !r1.exists;
              const canCreateR2 = r1Done && !r2.exists;

              return (
                <TableRow key={a.id} className="align-top">
                  <TableCell>
                    <div className="font-medium">{a.fullName}</div>
                    <div className="text-xs text-gray-600">{a.email ?? "—"}</div>
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r1.pending ? (
                        <Badge variant="secondary">{r1Status}</Badge>
                      ) : r1.exists ? (
                        <Badge>{r1Status}</Badge>
                      ) : (
                        <>
                          {canCreateR1 && (
                            <Button
                              size="icon" variant="outline" className="h-7 w-7"
                              onClick={() => onCreateR1(a.id)}
                              disabled={!departmentChosen}
                              title="Tạo lịch V1"
                            >
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {fmtRange(r1.startTime, r1.endTime)}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">{r1.interviewerNames}</TableCell>

                  <TableCell>
                    <div className="flex items-center gap-2">
                      {r2.pending ? (
                        <Badge variant="secondary">{r2Status}</Badge>
                      ) : r2.exists ? (
                        <Badge>{r2Status}</Badge>
                      ) : (
                        <Badge variant="outline"></Badge>
                      )}
                      {canCreateR2 && (
                        <Button
                          size="icon" variant="outline" className="h-7 w-7"
                          onClick={() => onCreateR2(a.id)}
                          disabled={!departmentChosen}
                          title="Lên lịch V2"
                        >
                          <Plus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {fmtRange(r2.startTime, r2.endTime)}
                    </div>
                  </TableCell>

                  <TableCell className="text-sm">{r2.interviewerNames}</TableCell>
                  <TableCell className="text-sm">{r2.notes ?? r1.notes ?? "—"}</TableCell>
                </TableRow>
              );
            })}
        </TableBody>
      </Table>
    </div>
  );
}
