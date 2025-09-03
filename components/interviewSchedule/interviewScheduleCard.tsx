"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Clock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { isHR } from "@/lib/auth";

// ---------- Types (shared with the page) ----------
export type CampaignPosition = {
  id: string;
  departmentId?: string;
  departmentName?: string | null;
};

export type CVApplicant = {
  id: string;
  fullName: string;
  email: string | null;
};

export type Interviewer = {
  id?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  departmentId?: string;
};

export type InterviewSchedule = {
  id: string;
  cvApplicantId: string;
  cvApplicantModel: CVApplicant | null;
  startTime: string;            // ISO
  endTime: string | null;       // ISO | null
  createdBy: string | null;
  status: string | null;        // "Pending" | "Pass" | "Fail" | "Canceled"
  stageName: string | null;
  interviewTypeId: string;
  interviewType?: string | null;
  interviewTypeName?: string | null;
  notes: string | null;
  departmentId?: string | null;
  interviewers?: Interviewer[] | string;
  campaignPositionModel? : CampaignPosition | null;
};

// ---------- Helpers ----------
type RangeKey = "today" | "week" | "month";

function parseLocal(iso?: string | null) {
  if (!iso) return null;
  const m = iso?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5], 0, 0);
  const d = new Date(iso!);
  return isNaN(d.getTime()) ? null : d;
}
function startOfTodayLocal() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}
function endOfTodayLocal() {
  const d = new Date();
  d.setHours(23, 59, 59, 999);
  return d;
}
function startOfWeekMonLocal(ref = new Date()) {
  const d = new Date(ref);
  d.setHours(0, 0, 0, 0);
  const diff = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - diff);
  return d;
}
function endOfWeekSunLocal(ref = new Date()) {
  const s = startOfWeekMonLocal(ref);
  const e = new Date(s);
  e.setDate(s.getDate() + 6);
  e.setHours(23, 59, 59, 999);
  return e;
}
function startOfMonthLocal(ref = new Date()) {
  return new Date(ref.getFullYear(), ref.getMonth(), 1, 0, 0, 0, 0);
}
function endOfMonthLocal(ref = new Date()) {
  return new Date(ref.getFullYear(), ref.getMonth() + 1, 0, 23, 59, 59, 999);
}
function getRange(key: RangeKey) {
  const now = new Date();
  if (key === "today")
    return { start: startOfTodayLocal(), end: endOfTodayLocal() };
  if (key === "week")
    return { start: startOfWeekMonLocal(now), end: endOfWeekSunLocal(now) };
  return { start: startOfMonthLocal(now), end: endOfMonthLocal(now) };
}

function fmtDT(iso?: string | null, locale = "vi-VN") {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso!;
  return `${d.toLocaleDateString(locale)} ${d.toLocaleTimeString(locale, {
    hour: "2-digit",
    minute: "2-digit",
  })}`;
}
function durationMin(start?: string, end?: string | null) {
  if (!start || !end) return null;
  const a = new Date(start).getTime();
  const b = new Date(end).getTime();
  if (isNaN(a) || isNaN(b)) return null;
  return Math.max(0, Math.round((b - a) / 60000));
}
function fullName(i: {
  firstName?: string;
  lastName?: string;
  username?: string;
}) {
  return (
    `${i.firstName ?? ""} ${i.lastName ?? ""}`.trim() ||
    (i as any).username ||
    ""
  );
}

// Normalize interviewers to array of displayable names
function normalizeInterviewers(iv?: Interviewer[] | string): string {
  if (!iv) return "—";
  if (Array.isArray(iv))
    return (
      iv
        .map((x) => fullName(x))
        .filter(Boolean)
        .join(", ") || "—"
    );
  if (typeof iv === "string") return iv || "—";
  return "—";
}

// Map various status values to a label + tone
function normalizeStatus(s?: string | null) {
  if (!s) return { label: "—", tone: "outline" as const };
  const v = s.toLowerCase();
  if (["pending", "scheduled", "processing"].includes(v))
    return { label: "Pending", tone: "default" as const };
  if (["pass", "completed", "done", "interviewed"].includes(v))
    return { label: "Pass", tone: "success" as const };
  if (["fail"].includes(v))
    return { label: "Fail", tone: "destructive" as const };
  if (["canceled", "cancelled"].includes(v))
    return { label: "Hủy", tone: "destructive" as const };
  return { label: s, tone: "secondary" as const };
}

function StatusBadge({ status }: { status: string | null }) {
  const { label, tone } = normalizeStatus(status);
  if (tone === "success")
    return <Badge className="bg-green-600 hover:bg-green-700">{label}</Badge>;
  if (tone === "destructive")
    return <Badge variant="destructive">{label}</Badge>;
  if (tone === "outline") return <Badge variant="outline">{label}</Badge>;
  if (tone === "secondary") return <Badge variant="secondary">{label}</Badge>;
  return <Badge>{label}</Badge>;
}

// Newest first (desc by startTime)
function sortByStartDesc(a: InterviewSchedule, b: InterviewSchedule) {
  return new Date(b.startTime).getTime() - new Date(a.startTime).getTime();
}

// ---------- Component ----------
export default function InterviewSchedulesTable({
  data,
  title,
  variant, // "range" | "all"
}: {
  data: InterviewSchedule[];
  title: string;
  variant: "range" | "all";
}) {
  const router = useRouter();

  // Shared filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [q, setQ] = useState<string>("");

  // Variant-specific filters
  const [range, setRange] = useState<RangeKey>("today"); // for "range"
  const [selectedDate, setSelectedDate] = useState<string>(""); // for "all" (YYYY-MM-DD)
  // const [roundFilter, setRoundFilter] = useState<string>("all");

  // Pagination
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const filtered = useMemo(() => {
    const byText = (it: InterviewSchedule) => {
      if (!q) return true;
      const name = it.cvApplicantModel?.fullName?.toLowerCase() ?? "";
      const t = (it.interviewType ?? it.interviewTypeName ?? "").toLowerCase();
      const st = it.status?.toLowerCase() ?? "";
      return (
        name.includes(q.toLowerCase()) ||
        t.includes(q.toLowerCase()) ||
        st.includes(q.toLowerCase())
      );
    };

    const byStatus = (it: InterviewSchedule) => {
      if (statusFilter === "all") return true;
      return (it.status ?? "").toLowerCase() === statusFilter.toLowerCase();
    };

    // const byRound = (it: InterviewSchedule) => {
    //   if (roundFilter === "all") return true;
    //   return String(it.stageName ?? "") === roundFilter;
    // };
    // console.log("Filtered by round:", roundFilter);
    // range vs date
    const { start, end } =
      variant === "range"
        ? getRange(range)
        : { start: null as Date | null, end: null as Date | null };

    const byTime = (it: InterviewSchedule) => {
      const d = parseLocal(it.startTime);
      if (!d) return false;
      if (variant === "range") {
        return d >= (start as Date) && d <= (end as Date);
      } else {
        if (!selectedDate) return true;
        const isoDay = it.startTime.split("T")[0];
        return isoDay === selectedDate;
      }
    };

    return (data ?? [])
      .filter((it) => byText(it) && byStatus(it) && byTime(it))
      .sort(sortByStartDesc);
  }, [data, q, statusFilter, range, selectedDate, variant]);

  // Calculate paging values
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Clamp/reset page when dependencies change
  useEffect(() => {
    setPage(1);
  }, [q, statusFilter, range, selectedDate, pageSize, variant]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <Card>
      <CardContent className="p-6 space-y-4">
        {/* Header + controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gray-700" />
            <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
            <Badge variant="secondary">{total} lịch phỏng vấn</Badge>
          </div>

          <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
            {/* search */}
            <Input
              placeholder="Tìm kiếm theo tên/loại/trạng thái…"
              className="h-9 w-full sm:w-[260px]"
              value={q}
              onChange={(e) => setQ(e.target.value)}
            />

            {/* status */}
            <Select
              value={statusFilter}
              onValueChange={(v) => setStatusFilter(v)}
            >
              <SelectTrigger className="h-9 w-full sm:w-[160px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Pass">Pass</SelectItem>
                <SelectItem value="Fail">Fail</SelectItem>
                <SelectItem value="Canceled">Hủy</SelectItem>
              </SelectContent>
            </Select>

            

            {/* variant-specific control */}
            {variant === "range" ? (
              <Select
                value={range}
                onValueChange={(v) => setRange(v as RangeKey)}
              >
                <SelectTrigger className="h-9 w-full sm:w-[160px]">
                  <SelectValue placeholder="Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="today">Hôm nay</SelectItem>
                  <SelectItem value="week">Tuần này</SelectItem>
                  <SelectItem value="month">Tháng này</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <input
                type="date"
                className="h-9 w-full sm:w-[180px] rounded border border-gray-300 px-3"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            )}

            <Button
              variant="outline"
              className="h-9"
              onClick={() => {
                setQ("");
                setStatusFilter("all");
                setSelectedDate("");
                setRange("today");
                // setRoundFilter("all");
                setPage(1);
              }}
            >
              Đặt lại
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ứng viên</TableHead>
                <TableHead>Phòng ban</TableHead>
                <TableHead>Vòng / Loại</TableHead>
                <TableHead>Bắt đầu</TableHead>
                <TableHead>Thời gian</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead>Người phỏng vấn</TableHead>
                <TableHead className="text-right">Thao tác</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-10 text-muted-foreground">
                    không có lịch phỏng vấn
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((it) => {
                  const dur = durationMin(it.startTime, it.endTime);
                  const dept =
                    it.campaignPositionModel?.departmentName ?? "—";
                  const typeName =
                    it.interviewType ??
                    it.interviewTypeName ??
                    it.interviewTypeId;
                  const ivNames = normalizeInterviewers(it.interviewers);

                  return (
                    <TableRow key={it.id} className="align-top">
                      <TableCell>
                        <div className="font-medium">
                          {it.cvApplicantModel?.fullName}
                        </div>
                        <div className="text-xs text-gray-600">
                          {it.cvApplicantModel?.email ?? "—"}
                        </div>
                      </TableCell>

                      <TableCell>{dept}</TableCell>

                      <TableCell>
                        <div className="text-sm">Vòng {it.stageName ?? "—"}</div>
                        <div className="text-xs text-gray-600">{typeName}</div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-sm">{fmtDT(it.startTime)}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-sm">
                        {dur != null ? `${dur} min` : "—"}
                      </TableCell>

                      <TableCell>
                        <StatusBadge status={it.status} />
                      </TableCell>

                      <TableCell className="text-sm">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="truncate">{ivNames}</span>
                        </div>
                      </TableCell>

                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">

                                                 
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              router.push(`/dashboard/schedules/${it.id}`)
                            }
                          >
                            Chi tiết
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination controls */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-muted-foreground">
            Hiển thị{" "}
            <span className="font-medium">
              {total === 0 ? 0 : (page - 1) * pageSize + 1}
            </span>{" "}
            đến{" "}
            <span className="font-medium">
              {Math.min(page * pageSize, total)}
            </span>{" "}
            trong tổng số <span className="font-medium">{total}</span> lịch
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mỗi trang</span>
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[90px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Trước
              </Button>

              {/* simple numeric pager (up to 7 buttons window) */}
              {Array.from({ length: totalPages }).slice(
                Math.max(0, page - 4),
                Math.max(0, page - 4) + Math.min(7, totalPages)
              ).map((_, i) => {
                const btnPage = Math.max(1, page - 4) + i;
                return (
                  <Button
                    key={btnPage}
                    variant={btnPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPage(btnPage)}
                  >
                    {btnPage}
                  </Button>
                );
              })}

              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
