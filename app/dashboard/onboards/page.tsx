"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, RefreshCw, Search } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import OnboardTable, {
  SortDir,
  SortKey,
} from "@/components/onboard/onboardTable";
import { isAdmin, isDepartmentManager, isHR } from "@/lib/auth";
import { toast } from "react-toastify";
import { fmtDate } from "@/app/utils/helper";

type ApiResponse<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};

function normalizeFilter(v: string): number | undefined {
  if (v === "all" || v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}

function getDepartmentIdFromLS(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("departmentId");
  } catch {
    return null;
  }
}

export default function OnboardListPage() {
  const [raw, setRaw] = useState<Onboard[]>([]);
  const [reloadTick, setReloadTick] = useState(0);

  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [salType, setSalType] = useState("all");
  const [sortKey, setSortKey] = useState<SortKey>("start");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [debouncedQuery, setDebouncedQuery] = useState(query);
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const ctl = new AbortController();
    async function load() {
      setLoading(true);
      setError(null);

      let url: string | null = null;

      if (isDepartmentManager()) {
        const depId = getDepartmentIdFromLS();
        if (!depId) {
          setLoading(false);
          setRaw([]);
          setError("Không tìm thấy departmentId cho tài khoản của bạn.");
          return;
        }
        url = `${API.ONBOARD.BASE}/${depId}/departments`;
      } else if (isHR() || isAdmin()) {
        url = API.ONBOARD.BASE;
      } else {
        setLoading(false);
        setRaw([]);
        setError("Bạn không có quyền truy cập dữ liệu này.");
        return;
      }
      try {
        const res = await authFetch(url, { signal: ctl.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as ApiResponse<Onboard[]>;
        setRaw(Array.isArray(json?.data) ? json.data : []);
      } catch (e: any) {
        if (e?.name !== "AbortError") setError(e?.message || "Failed to load");
      } finally {
        setLoading(false);
      }
    }
    load();
    return () => ctl.abort();
  }, [debouncedQuery, reloadTick]);

  const filtered = useMemo(() => {
    let arr = raw;

    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(
        (r) =>
          (r.cvApplicantModel?.fullName ?? "").toLowerCase().includes(q) ||
          (r.id ?? "").toLowerCase().includes(q)
      );
    }

    const st = normalizeFilter(status);
    if (st !== undefined) arr = arr.filter((r) => Number(r.status) === st);

    const stype = normalizeFilter(salType);
    if (stype !== undefined)
      arr = arr.filter((r) => Number(r.salaryType) === stype);

    return arr;
  }, [raw, query, status, salType]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    if (sortKey === "salary") {
      arr.sort(
        (a, b) =>
          (Number(a.proposedSalary) - Number(b.proposedSalary)) *
          (sortDir === "asc" ? 1 : -1)
      );
    } else {
      // "start"
      arr.sort(
        (a, b) =>
          (new Date(a.proposedStartDate).getTime() -
            new Date(b.proposedStartDate).getTime()) *
          (sortDir === "asc" ? 1 : -1)
      );
    }
    return arr;
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const paged = useMemo(() => {
    const start = (page - 1) * pageSize;
    return sorted.slice(start, start + pageSize);
  }, [sorted, page, pageSize]);

  function resetFilters() {
    setQuery("");
    setStatus("all");
    setSalType("all");
    setPage(1);
  }
  function onToggleSort(key: SortKey) {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  function handleStatusChanged() {
    setReloadTick((t) => t + 1);
  }

  function filenameFromContentDisposition(h?: string | null): string | null {
    if (!h) return null;
    const m = /filename\*=UTF-8''([^;]+)|filename="?([^"]+)"?/i.exec(h);
    return decodeURIComponent((m?.[1] || m?.[2] || "").trim());
  }

  async function handleExportExcel() {
    if (!(isDepartmentManager() || isHR() || isAdmin())) {
      setError("Bạn không có quyền truy cập dữ liệu này.");
      return;
    }

    const base = `${API.ONBOARD.BASE}/export-onboarded`;

    const qs = new URLSearchParams();

    if (isDepartmentManager()) {
      const depId = getDepartmentIdFromLS();
      if (!depId) {
        setError("Không tìm thấy departmentId cho tài khoản của bạn.");
        return;
      }
      qs.set("DepartmentId", depId);
    }
    if (fromDate) qs.set("FromDate", new Date(fromDate).toISOString());
    if (toDate) qs.set("ToDate", new Date(toDate).toISOString());

    if (fromDate && toDate && new Date(fromDate) > new Date(toDate)) {
      toast.error(
        "Khoảng thời gian không hợp lệ: 'Từ ngày' phải nhỏ hơn hoặc bằng 'Đến ngày'."
      );
      return;
    }
    const url = qs.toString() ? `${base}?${qs.toString()}` : base;

    try {
      setError(null);
      setLoading(true);
      const res = await authFetch(url, { method: "GET" });

      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const json = await res.json();
          msg = json?.message || msg;
        } catch {}
        throw new Error(msg);
      }

      const blob = await res.blob();
      const cd = res.headers.get("content-disposition");
      const suggested = filenameFromContentDisposition(cd);
      const filename =
        suggested ||
        `onboard_export_${new Date().toISOString().slice(0, 10)}.xlsx`;

      // Tải file xuống
      const link = document.createElement("a");
      const href = URL.createObjectURL(blob);
      link.href = href;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(href);
    } catch (e: any) {
      toast.error(e?.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">
            Danh sách yêu cầu Onboard
          </h1>
          <p className="text-slate-600">
            Quản lý ngày bắt đầu đề xuất, mức lương và quy trình phê duyệt.
          </p>
        </div>
        <div className="rounded border p-2 bg-gray-00">
          <div className="grid grid-flow-col auto-cols-[140px] items-end gap-2 ">
            <div className="flex flex-col">
              <Label htmlFor="fromDate" className="text-xs text-slate-600">
                Từ ngày
              </Label>
              <Input
                id="fromDate"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 w-[140px]"
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="toDate" className="text-xs text-slate-600">
                Đến ngày
              </Label>
              <Input
                id="toDate"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 w-[140px]"
              />
            </div>

            <div className="flex flex-col">
              <Label className="text-xs opacity-0 select-none">.</Label>
              <Button
                onClick={handleExportExcel}
                disabled={
                  loading || (!isDepartmentManager() && !isHR() && !isAdmin())
                }
                className="h-8 w-[140px]"
              >
                Xuất Excel
              </Button>
            </div>
          </div>
          <div className="mt-1 text-xs text-slate-500 text-end">
            Xuất dữ liệu onboard trong khoảng: {fmtDate(fromDate)} →{" "}
            {fmtDate(toDate)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader></CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full">
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setPage(1);
                  }}
                  placeholder="Tìm kiếm theo ứng viên..."
                  className="pl-9"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                <Select
                  value={status}
                  onValueChange={(v: any) => {
                    setStatus(v);
                    setPage(1);
                  }}
                >
                  <SelectTrigger className="w-[220px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả trạng thái</SelectItem>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Approved</SelectItem>
                    <SelectItem value="2">Rejected</SelectItem>
                    <SelectItem value="3">Cancelled</SelectItem>
                    <SelectItem value="4">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex gap-2">
                  <Select
                    value={salType}
                    onValueChange={(v: any) => {
                      setSalType(v);
                      setPage(1);
                    }}
                  >
                    <SelectTrigger className="w-[220px]">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter theo loại lương" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tất cả loại lương</SelectItem>
                      <SelectItem value="0">Net</SelectItem>
                      <SelectItem value="1">Gross</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={resetFilters}
              className="shrink-0"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <CardTitle className="text-lg font-semibold text-gray-900">
              Tất cả onboard {loading ? "(Đang tải...)" : `(${total})`}
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-rose-600">{error}</div>
          ) : total === 0 ? (
            <div className="text-sm text-slate-600">
              Chưa có dữ liệu onboard
            </div>
          ) : (
            <>
              <OnboardTable
                data={paged}
                page={page}
                pageSize={pageSize}
                total={total}
                loading={loading}
                sortKey={sortKey}
                sortDir={sortDir}
                onToggleSort={onToggleSort}
                onStatusChanged={handleStatusChanged}
              />

              {/* Pagination */}
              <div className="flex items-center justify-between pt-4">
                <div className="text-sm text-slate-600">
                  Trang {page} / {Math.max(1, Math.ceil(total / pageSize))}
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page === 1}
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                  >
                    Trước
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={page * pageSize >= total}
                    onClick={() => setPage((p) => p + 1)}
                  >
                    Sau
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
