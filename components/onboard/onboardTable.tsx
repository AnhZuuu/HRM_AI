"use client";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { OnboardRequestStatus, SalaryTpe, statusColor } from "@/app/utils/enum";
import { fmtDate, fmtVnd } from "@/app/utils/helper";
import OnboardDetailSheet from "./onboardDetailSheet";

export type SortKey = "start" | "salary";
export type SortDir = "asc" | "desc";

export default function OnboardTable({
  data,
  page,
  pageSize,
  loading,
  sortKey,
  sortDir,
  onToggleSort,
  onStatusChanged,
}: {
  data: Onboard[];
  page: number;
  pageSize: number;
  total: number;
  loading: boolean;
  sortKey: SortKey;
  sortDir: SortDir;
  onToggleSort: (key: SortKey) => void;
  onStatusChanged?: () => void;
}) {
  const visible = useMemo(() => data, [data]);

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40px]">#</TableHead>
            <TableHead className="min-w-[200px]">Tên ứng viên</TableHead>
            <TableHead className="min-w-[160px]">Email</TableHead>
            <TableHead className="min-w-[140px]">
              <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onToggleSort("salary")}>
                Lương {sortKey === "salary" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </TableHead>
            <TableHead className="min-w-[120px]">Loại</TableHead>
            <TableHead className="min-w-[140px]">
              <button className="inline-flex items-center gap-1 hover:underline" onClick={() => onToggleSort("start")}>
                Ngày đi làm {sortKey === "start" ? (sortDir === "asc" ? "↑" : "↓") : ""}
              </button>
            </TableHead>
            <TableHead className="min-w-[120px]">Trạng thái</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {loading && visible.length === 0
            ? Array.from({ length: 5 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="animate-pulse bg-slate-100">&nbsp;</TableCell>
                  <TableCell className="text-right">—</TableCell>
                </TableRow>
              ))
            : visible.map((r, idx) => {
                const statusKey = Number(r.status) as keyof typeof OnboardRequestStatus;
                const salaryKey = Number(r.salaryType) as keyof typeof SalaryTpe;

                const statusLabel = OnboardRequestStatus[statusKey] ?? String(r.status);
                const statusBadgeClass =
                  statusColor[Number(r.status)] ??
                  "bg-slate-100 text-slate-700 border-slate-200";

                return (
                  <TableRow key={r.id} className="hover:bg-slate-50">
                    <TableCell>{(page - 1) * pageSize + idx + 1}</TableCell>
                    <TableCell className="font-medium">{r.cvApplicantModel?.fullName ?? "—"}</TableCell>
                    <TableCell className="text-slate-600">{r.cvApplicantModel?.email ?? "—"}</TableCell>
                    <TableCell>{fmtVnd(r.proposedSalary)}</TableCell>
                    <TableCell>{SalaryTpe[salaryKey] ?? (String(r.salaryType))}</TableCell>
                    <TableCell>{fmtDate(r.proposedStartDate)}</TableCell>
                    <TableCell>
                      <Badge className={`border ${statusBadgeClass} font-normal`}>
                        {statusLabel}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <OnboardDetailSheet row={r} onStatusChanged={onStatusChanged} />
                    </TableCell>
                  </TableRow>
                );
              })}
        </TableBody>
      </Table>
    </div>
  );
}
