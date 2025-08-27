"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import OnboardTable, { SortDir, SortKey } from "@/components/onboard/onboardTable";

type ApiResponse<T> = { code: number; status: boolean; message?: string; data: T };

function normalizeFilter(v: string): number | undefined {
  if (v === "all" || v === "" || v == null) return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
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
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 300);
    return () => clearTimeout(t);
  }, [query]);

  useEffect(() => {
  const ctl = new AbortController();
  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(API.ONBOARD.BASE, { signal: ctl.signal });
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
      arr = arr.filter((r) =>
        (r.cvApplicantModel?.fullName ?? "").toLowerCase().includes(q) ||
        (r.id ?? "").toLowerCase().includes(q)
      );
    }

    const st = normalizeFilter(status);
    if (st !== undefined) arr = arr.filter((r) => Number(r.status) === st);

    const stype = normalizeFilter(salType);
    if (stype !== undefined) arr = arr.filter((r) => Number(r.salaryType) === stype);

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
          (new Date(a.proposedStartDate).getTime() - new Date(b.proposedStartDate).getTime()) *
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

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Danh sách yêu cầu Onboard</h1>
          <p className="text-slate-600">Quản lý ngày bắt đầu đề xuất, mức lương và quy trình phê duyệt.</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-2 w-full md:w-auto">
              <div className="relative w-full md:w-80">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  value={query}
                  onChange={(e) => { setQuery(e.target.value); setPage(1); }}
                  placeholder="Search by applicant id or onboard id..."
                  className="pl-9"
                />
              </div>              
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2">
                <Label className="text-slate-600">Trạng thái</Label>
                <Select value={status} onValueChange={(v) => { setStatus(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="0">Pending</SelectItem>
                    <SelectItem value="1">Approved</SelectItem>
                    <SelectItem value="2">Rejected</SelectItem>
                    <SelectItem value="3">Cancelled</SelectItem>
                    <SelectItem value="4">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center gap-2">
                <Label className="text-slate-600">Loại lương</Label>
                <Select value={salType} onValueChange={(v) => { setSalType(v); setPage(1); }}>
                  <SelectTrigger className="w-[160px]"><SelectValue placeholder="All" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tất cả</SelectItem>
                    <SelectItem value="0">Net</SelectItem>
                    <SelectItem value="1">Gross</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button variant="outline" onClick={resetFilters} className="shrink-0">
              <RefreshCw className="h-4 w-4 mr-2" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Tất cả onboard {loading ? "(Đang tải...)" : `(${total})`}</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-sm text-rose-600">{error}</div>
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
                <div className="text-sm text-slate-600">Trang {page} / {Math.max(1, Math.ceil(total / pageSize))}</div>
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
