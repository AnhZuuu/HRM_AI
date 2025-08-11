"use client";

import InterviewScheduleCard from "@/components/interviewSchedule/interviewScheduleCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Select } from "@radix-ui/react-select";
import { Filter, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";

const mockData: InterviewSchedule[] = [
  {
    id: "is-001",
    cvApplicantId: "cv-01",
    cvApplicant: {
      id: "cv-01",
      fullName: "Nguyễn Văn A",
      email: "a@example.com",
    },
    startTime: "2025-05-11T07:30:00+07:00",
    endTime: "2025-05-11T08:00:00+07:00",
    createdBy: "admin-1",
    status: "Scheduled",
    round: 2,
    interviewTypeId: "type-2",
    interviewType: "Technical",
    notes: "Presentation",
    interviewers: "Mai L., Tùng P.",
  },
  {
    id: "is-002",
    cvApplicantId: "cv-02",
    cvApplicant: { id: "cv-02", fullName: "Trần B", email: "b@example.com" },
    startTime: "2025-05-12T09:00:00+07:00",
    endTime: "2025-05-12T10:00:00+07:00",
    createdBy: "admin-1",
    status: "Completed",
    round: 1,
    interviewTypeId: "type-1",
    interviewType: "HR Screening",
    notes: null,
    interviewers: "Lan N.",
  },
];

export default function InterviewSchedulesPage() {
  const [items, setItems] = useState<InterviewSchedule[]>([]);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");

  useEffect(() => {
    setItems(mockData); // replace with fetch
  }, []);

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

      const dateOnly = it.startTime.split("T")[0]; // "YYYY-MM-DD"
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
          <p className="text-gray-600 mt-1">
            Danh sách lịch phỏng vấn của ứng viên
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Tìm theo tên đợt tuyển dụng…"
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

              <Select
                value={statusFilter}
                onValueChange={(v) => setStatusFilter(v)}
              >
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

      {/* List */}
      {filtered.length === 0 ? (
        <p className="text-gray-500">Không có lịch phỏng vấn.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filtered.map((item) => (
            <InterviewScheduleCard key={item.id} item={item as any} />
          ))}
        </div>
      )}
    </div>
  );
}
