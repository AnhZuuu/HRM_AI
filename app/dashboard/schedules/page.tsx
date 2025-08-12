"use client";

import InterviewScheduleCard from "@/components/interviewSchedule/interviewScheduleCard";
import { mockInterviewSchedule } from "@/components/interviewSchedule/mockData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Filter, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export default function InterviewSchedulesPage() {
  const [items, setItems] = useState<InterviewSchedule[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  // ---- helpers for local date handling ----
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const localYMDFromISO = (iso: string) => toLocalYMD(new Date(iso));

  const startOfWeekMon = (d = new Date()) => {
    const day = d.getDay(); // 0 Sun .. 6 Sat
    const monday = new Date(d);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(d.getDate() - ((day + 6) % 7));
    return monday;
  };
  const endOfWeekSun = (d = new Date()) => {
    const end = new Date(startOfWeekMon(d));
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return end;
  };

  useEffect(() => {
    setItems(mockInterviewSchedule); // TODO: replace with fetch/mocks repo if needed
  }, []);

  // ---- Stats: today + this week (based on ALL items) ----
  const todayYMD = toLocalYMD(new Date());
  const todayItems = useMemo(
    () => items.filter((it) => localYMDFromISO(it.startTime) === todayYMD),
    [items, todayYMD]
  );
  const weekRange = useMemo(() => {
    const s = startOfWeekMon();
    const e = endOfWeekSun();
    return { s, e };
  }, []);
  const weekItems = useMemo(() => {
    return items.filter((it) => {
      const d = new Date(it.startTime);
      return d >= weekRange.s && d <= weekRange.e;
    });
  }, [items, weekRange]);

  const todayCount = todayItems.length;
  const weekCount = weekItems.length;

  // Scheduled today = status "Scheduled" whose startTime is today (local)
const scheduledTodayCount = useMemo(
  () =>
    items.filter(
      (it) =>
        (it.status ?? "").toLowerCase() === "scheduled" &&
        localYMDFromISO(it.startTime) === todayYMD
    ).length,
  [items, todayYMD]
);

// Completed today = status "Completed"
// Use endTime if present (more accurate), otherwise fall back to startTime.
const completedTodayCount = useMemo(
  () =>
    items.filter((it) => {
      const statusOk = (it.status ?? "").toLowerCase() === "completed";
      if (!statusOk) return false;
      const when = it.endTime ? it.endTime : it.startTime;
      return localYMDFromISO(when) === todayYMD;
    }).length,
  [items, todayYMD]
);

  // ---- Existing filters (apply to the "All interviews" right pane) ----
  const filtered = useMemo(() => {
    return items.filter((it) => {
      const name = it.cvApplicant?.fullName?.toLowerCase() ?? "";
      const type = it.interviewType?.toLowerCase() ?? "";
      const status = it.status?.toLowerCase() ?? "";
      const queryMatch =
        !q ||
        name.includes(q.toLowerCase()) ||
        type.includes(q.toLowerCase()) ||
        status.includes(q.toLowerCase());

      const statusMatch =
        statusFilter === "all" || status === statusFilter.toLowerCase();

      const dateOnly = it.startTime.split("T")[0]; // "YYYY-MM-DD" (ISO part)
      const dateMatch = !dateFilter || dateOnly === dateFilter;

      return queryMatch && statusMatch && dateMatch;
    });
  }, [items, q, statusFilter, dateFilter]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch phỏng vấn</h1>
          <p className="text-gray-600 mt-1">Danh sách lịch phỏng vấn của ứng viên</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/schedules/new">
            <Plus className="w-4 h-4 mr-2" />
            Tạo phỏng vấn
          </Link>
        </Button>
      </div>

      {/* Stats strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Hôm nay</p>
          <p className="text-2xl font-semibold">{todayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {todayCount > 0 ? `Có ${todayCount} lịch vào ${new Date().toLocaleDateString("vi-VN")}` : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã phỏng vấn (hôm nay)</p>
          <p className="text-2xl font-semibold">{scheduledTodayCount }</p>
          <p className="text-xs text-gray-500 mt-1">
            {scheduledTodayCount  > 0 ? `Có ${scheduledTodayCount } lịch đã phỏng vấn` : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã hoàn thành (hôm nay)</p>
          <p className="text-2xl font-semibold">{completedTodayCount }</p>
          <p className="text-xs text-gray-500 mt-1">
            {completedTodayCount  > 0 ? `Có ${completedTodayCount } lịch đã hoàn thành` : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Trong tuần này</p>
          <p className="text-2xl font-semibold">{weekCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {weekRange.s.toLocaleDateString("vi-VN")} – {weekRange.e.toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Filters (apply to right pane) */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên ứng viên / loại / trạng thái…"
                  className="pl-9 pr-9 h-10 rounded-full border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm"
                />
                {!!q && (
                  <button
                    onClick={() => setQ("")}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2"
                    aria-label="Xóa tìm kiếm"
                  >
                    ✕
                  </button>
                )}
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="h-10 w-full sm:w-[200px] rounded-full border-gray-200 shadow-sm">
                  <Filter className="h-4 w-4 mr-2 text-gray-500" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="Scheduled">Scheduled</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <input
                type="date"
                className="w-full sm:w-48 rounded border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              />

              <Button
                variant="outline"
                className="h-10 hover:bg-blue-200"
                onClick={() => {
                  setQ("");
                  setStatusFilter("all");
                  setDateFilter("");
                }}
              >
                Đặt lại
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Split layout: left 1/3 = today's list, right 2/3 = all interviews */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Left: Today */}
        <div className="xl:col-span-1 space-y-3 rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Hôm nay ({todayCount})</h2>
          {todayItems.length === 0 ? (
            <p className="text-gray-500">Không có lịch phỏng vấn hôm nay.</p>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {todayItems.map((item : any) => (
                <InterviewScheduleCard key={item.id} item={item as any} />
              ))}
            </div>
          )}
        </div>

        {/* Right: All */}
        <div className="xl:col-span-2 space-y-3 rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <h2 className="text-lg font-semibold">Tất cả lịch ({filtered.length})</h2>
          {filtered.length === 0 ? (
            <p className="text-gray-500">Không có lịch phỏng vấn.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-6">
              {filtered.map((item : any) => (
                <InterviewScheduleCard key={item.id} item={item as any} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
