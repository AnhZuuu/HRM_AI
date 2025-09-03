"use client";

import * as React from "react";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { RefreshCw, Search, AlertCircle } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

/* ================= Types ================= */
type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

export type InterviewProcess = {
  interviewStageModels: any[];
  departmentId: string;
  processName: string;
  description: string | null;
  departmentName: string;
  countOfStage: number;
  id: string;
  creationDate: string;
  createdById: string | null;
  modificationDate: string | null;
  modifiedById: string | null;
  deletionDate: string | null;
  deletedById: string | null;
  isDeleted: boolean;
};

/* ================= Helpers ================= */
function fmtDate(v?: string | null): string {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d.getTime())) return v!;
  return d.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/* ================= Page ================= */
export default function InterviewProcessesPage() {
  const [items, setItems] = useState<InterviewProcess[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState<string>("");
  const router = useRouter();

  async function fetchData() {
    try {
      setLoading(true);
      setError(null);
      const res = await authFetch(API.INTERVIEW.PROCESS, { method: "GET" });
      const json = (await res.json()) as ApiEnvelope<InterviewProcess[]>;
      if (!json.status) throw new Error(json?.message || "Failed to fetch interview processes");
      setItems(json.data ?? []);
    } catch (e: any) {
      setError(e?.message || "Unexpected error");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((x) => {
      return (
        x.processName.toLowerCase().includes(q) ||
        (x.departmentName || "").toLowerCase().includes(q) ||
        (x.description || "").toLowerCase().includes(q)
      );
    });
  }, [items, query]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg">
            Quy trình phỏng vấn
            {!loading && !error ? (
              <span className="ml-2 text-sm text-muted-foreground">
                Hiện đang hiển thị {filtered.length} / {items.length}
              </span>
            ) : null}
          </CardTitle>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                className="pl-8 w-[260px]"
                placeholder="Search…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                disabled={loading}
              />
            </div>
            <Button variant="outline" onClick={fetchData} disabled={loading}>
              <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Đang tải quy trình...
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không tìm thấy quy trình nào
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Tên</TableHead>
                    <TableHead>Phòng ban</TableHead>
                    <TableHead className="text-right">Số vòng</TableHead>
                    <TableHead>Mô tả</TableHead>
                    {/* <TableHead>Ngày tạo</TableHead> */}
                    <TableHead>Hành động</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((row, idx) => (
                    <TableRow key={row.id}>
                      <TableCell>{idx + 1}</TableCell>
                      <TableCell className="font-medium">{row.processName}</TableCell>
                      <TableCell>{row.departmentName}</TableCell>
                      <TableCell className="text-right">{row.countOfStage}</TableCell>
                      <TableCell className="max-w-[300px] truncate">
                        {row.description ?? "—"}
                      </TableCell>
                      {/* <TableCell>{fmtDate(row.creationDate)}</TableCell> */}
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => router.push(`/dashboard/interviewProcess/${row.id}`)}
                        >
                          Xem chi tiết
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
