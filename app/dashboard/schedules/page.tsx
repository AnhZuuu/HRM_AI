"use client";
import { useEffect, useMemo, useState } from "react";
import { mockInterviewSchedule } from "@/components/interviewSchedule/mockData";
import InterviewSchedulesTable from "@/components/interviewSchedule/interviewScheduleCard";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";

export default function InterviewSchedulesPage() {
  const [items, setItems] = useState<any[]>([]);
  useEffect(() => {
    setItems(mockInterviewSchedule); // or fetch(...)
  }, []);

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

  return (
    <div className="container mx-auto p-6 space-y-6">
      
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch phỏng vấn</h1>
          <p className="text-gray-600 mt-1">
            Danh sách lịch phỏng vấn của ứng viên
          </p>
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
            {todayCount > 0
              ? `Có ${todayCount} lịch vào ${new Date().toLocaleDateString(
                  "vi-VN"
                )}`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã phỏng vấn (hôm nay)</p>
          <p className="text-2xl font-semibold">{scheduledTodayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {scheduledTodayCount > 0
              ? `Có ${scheduledTodayCount} lịch đã phỏng vấn`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã hoàn thành (hôm nay)</p>
          <p className="text-2xl font-semibold">{completedTodayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {completedTodayCount > 0
              ? `Có ${completedTodayCount} lịch đã hoàn thành`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Trong tuần này</p>
          <p className="text-2xl font-semibold">{weekCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {weekRange.s.toLocaleDateString("vi-VN")} –{" "}
            {weekRange.e.toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

  {/* 1) Range-based view: Today / This week / This month + search + status */}
  <h2 className="text-lg font-semibold text-gray-900">Danh sách lịch phỏng vấn hôm nay</h2>
      <InterviewSchedulesTable
        title="Lịch phỏng vấn"
        variant="range"
        data={items}
      />

      {/* 2) All data with day picker + search + status */}
  <h2 className="text-lg font-semibold text-gray-900">Danh sách tất cả lịch phỏng vấn</h2>

      <InterviewSchedulesTable
        title="Tất cả"
        variant="all"
        data={items}
      />
    </div>
  );
}
