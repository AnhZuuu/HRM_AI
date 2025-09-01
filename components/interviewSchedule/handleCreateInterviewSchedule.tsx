"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Eye, CalendarPlus, Loader2, Filter, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { ScheduleModal } from "./ui/ScheduleModal";
import ScheduleModal2 from "./ui/ScheduleModal2";
import HandleUpdateStatusCandidate from "../candidates/HandleUpdateStatusCandidate";

/* ============= Types ============= */


export type Candidate = {
  id: string;
  cvApplicantId: string;
  fullName: string | null;
  email: string | null;
  point: string | null;
  campaignPositionDescription: string | null;
  currentInterviewStageName: string | null;
  fileUrl: string | null;
  status: 0 | 1 | 2 | 3 | 4 | null; // 0 Pending, 1 Rejected, 2 Accepted, 3 Failed, 4 Onboarded

  // ensure these get populated in normalizeCandidates()
  departmentId?: string | null;
  department: Department[] | null;
};

const STATUS_LABEL: Record<NonNullable<Candidate["status"]>, string> = {
  0: "Pending",
  1: "Rejected",
  2: "Accepted",
  3: "Failed",
  4: "Onboarded",
};

function statusBadgeClass(s: Candidate["status"]) {
  switch (s) {
    case 4:
      return "bg-amber-100 text-amber-800";
    case 2:
      return "bg-green-100 text-green-800";
    case 0:
      return "bg-blue-100 text-blue-800";
    case 1:
      return "bg-red-100 text-red-800";
    case 3:
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

/* ============= Small Utils ============= */
function getDetailValue(details: any[] | undefined, type: string, key: string): string | null {
  if (!Array.isArray(details)) return null;
  const found = details.find((d) => d?.type === type && d?.key === key && d?.value);
  return (found?.value as string) ?? null;
}

/* Updated: now maps departmentId + department[] from flexible API shapes */
function normalizeCandidates(payload: any): Candidate[] {
  const arr =
    (Array.isArray(payload?.data) && payload.data) ||
    (Array.isArray(payload?.data?.data) && payload.data.data) ||
    (Array.isArray(payload) && payload) ||
    [];

  return arr.map((it: any) => {
    const details = it?.cvApplicantDetailModels as any[] | undefined;
    const fallbackFullName = getDetailValue(details, "personal_info", "full_name");
    const fallbackPosition = getDetailValue(details, "personal_info", "position");

    const rawStatus = it?.status;
    const statusVal =
      Number.isInteger(rawStatus) && rawStatus >= 0 && rawStatus <= 4 ? (rawStatus as 0 | 1 | 2 | 3 | 4) : null;

    const id = String(it?.id ?? it?.cvApplicantId ?? "");

    // STRICT: use departmentModel only (can be null at first)
    const deptModel = it?.departmentModel ?? null;

    const departmentId = deptModel?.id ?? null;
    const department: Department[] | null = deptModel
      ? [
        {
          id: String(deptModel.id),
          departmentName: deptModel.departmentName ?? "",
          code: deptModel.code ?? null,
          description: deptModel.description ?? null,
          campaignPositionModels: deptModel.campaignPositionModels ?? [],
          employees: deptModel.employees ?? [],
        },
      ]
      : null;

    return {
      id,
      cvApplicantId: id,
      fullName: it?.fullName ?? fallbackFullName ?? null,
      email: it?.email ?? null,
      point: it?.point ?? null,
      campaignPositionDescription: it?.campaignPositionDescription ?? fallbackPosition ?? null,
      currentInterviewStageName: it?.currentInterviewStageName ?? null,
      fileUrl: it?.fileUrl ?? null,
      status: statusVal,

      // now ScheduleModal will resolve deptId correctly
      departmentId,
      department,
    };
  });
}


async function fetchCandidates(): Promise<Candidate[]> {
  const res = await authFetch(API.CV.APPLICANT, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load candidates: ${res.status}`);

  const json = await res.json();
  console.log("[fetchCandidates] raw response:", json);
  console.log(
    "[fetchCandidates] shapes =>",
    "Array.isArray(json.data):", Array.isArray(json?.data),
    "| Array.isArray(json.data?.data):", Array.isArray(json?.data?.data)
  );

  const normalized = normalizeCandidates(json);
  console.log("[fetchCandidates] normalized length:", normalized.length);
  console.table(
    normalized.map(x => ({
      id: x.id,
      name: x.fullName,
      email: x.email,
      point: x.point,
      stage: x.currentInterviewStageName,
      status: x.status,
      departmentId: x.departmentId,
      deptCount: Array.isArray(x.department) ? x.department.length : 0,
    }))
  );
  return normalized;
}

/* Debounce without external deps */
function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

/* ============= Page ============= */
export default function CandidatesPage() {
  const router = useRouter();
  const sp = useSearchParams();

  // Read initial state from URL
  const initialQuery = sp.get("q") ?? "";
  const initialStatus = (sp.get("status") as "all" | "0" | "1" | "2" | "3" | "4" | null) ?? "all";
  const initialPage = Math.max(1, parseInt(sp.get("page") ?? "1", 10) || 1);
  const initialPageSize = (() => {
    const v = parseInt(sp.get("pageSize") ?? "5", 10);
    return [5, 10, 20, 50].includes(v) ? v : 5;
  })();

  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState(initialQuery);
  const debouncedQuery = useDebouncedValue(query, 300);

  const [statusFilter, setStatusFilter] =
    useState<"all" | "0" | "1" | "2" | "3" | "4">(initialStatus);
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState<number>(initialPageSize);

  // Modals 1
  const [open, setOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  //Modals 2
  // const [openV2, setOpenV2] = useState(false);
  const [activeCandidateV2, setActiveCandidateV2] = useState<Candidate | null>(null);

  // Update candidate status modal
  const [openUpdateStatus, setOpenUpdateStatus] = useState(false);
  const [activeStatusCandidate, setActiveStatusCandidate] = useState<Candidate | null>(null);

  function openUpdateStatusModal(c: Candidate) {
    setActiveStatusCandidate(c);
    setOpenUpdateStatus(true);
  }

  // Fetch once
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCandidates();
        setCandidates(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error(e);
        setCandidates([]);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Derived filter
  const filtered: Candidate[] = useMemo(() => {
    const base = Array.isArray(candidates) ? candidates : [];
    const q = debouncedQuery.trim().toLowerCase();

    return base.filter((c) => {
      const pool = [c.fullName, c.email, c.campaignPositionDescription, c.currentInterviewStageName, c.point]
        .filter(Boolean)
        .map((v) => String(v).toLowerCase());

      const matchQuery = !q || pool.some((v) => v.includes(q));
      const matchStatus = statusFilter === "all" || String(c.status) === statusFilter;
      return matchQuery && matchStatus;
    });
  }, [candidates, debouncedQuery, statusFilter]);

  // Pagination calc
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;
  const paged = filtered.slice(start, start + pageSize);

  // Reset page when search/filter/pageSize changes
  useEffect(() => {
    setPage(1);
  }, [debouncedQuery, statusFilter, pageSize]);

  // Sync URL with state (q, status, page, pageSize)
  useEffect(() => {
    const params = new URLSearchParams();
    if (debouncedQuery) params.set("q", debouncedQuery);
    if (statusFilter !== "all") params.set("status", statusFilter);
    if (safePage > 1) params.set("page", String(safePage));
    if (pageSize !== 5) params.set("pageSize", String(pageSize));

    const qs = params.toString();
    const url = qs ? `?${qs}` : "";
    window.history.replaceState(null, "", url);
  }, [debouncedQuery, statusFilter, safePage, pageSize]);

  //Modal 1
  function openSchedule(candidate: Candidate) {
    console.log("[openSchedule] candidate deptId:", candidate.departmentId, "deptCount:", candidate.department?.length ?? 0);
    setActiveCandidate(candidate);
    setOpen(true);
  }
  //Modal 2
  // function openScheduleV2(candidate: Candidate) {
  //   setActiveCandidateV2(candidate);
  //   setOpenV2(true);
  // }

  function clearFilters() {
    setQuery("");
    setStatusFilter("all");
    setPage(1);
    setPageSize(5);
  }

  const refetchCandidates = React.useCallback(async () => {
    try {
      setLoading(true);
      const data = await fetchCandidates();
      setCandidates(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
      setCandidates([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetchCandidates();
  }, [refetchCandidates]);

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        {/* Header + Controls */}
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Ứng viên</h1>
            <p className="text-sm text-muted-foreground">Lên lịch phỏng vấn nhanh chóng.</p>
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
            <div className="w-full max-w-xs">
              <Input
                placeholder="Tìm kiếm ứng viên…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as any)}>
              <SelectTrigger className="w-full sm:w-56">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Lọc theo trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả trạng thái</SelectItem>
                <SelectItem value="0">Đang chờ</SelectItem>
                <SelectItem value="1">Bị từ chối</SelectItem>
                <SelectItem value="2">Đã chấp nhận</SelectItem>
                <SelectItem value="3">Thất bại</SelectItem>
                <SelectItem value="4">Đang onboard</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={String(pageSize)}
              onValueChange={(v) => setPageSize(parseInt(v, 10))}
            >
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="Page size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5 / page</SelectItem>
                <SelectItem value="10">10 / page</SelectItem>
                <SelectItem value="20">20 / page</SelectItem>
                <SelectItem value="50">50 / page</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={clearFilters}>
              Reset
            </Button>
            <Button 
            asChild className="bg-blue-600 hover:bg-blue-700">
              <Link href="/dashboard/schedules/new/suggest">
                <Plus className="w-4 h-4 mr-2" />
                Gợi ý lịch
              </Link>
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-xl border bg-background shadow-sm">
          <div className="relative overflow-x-auto">
            <table className="w-full caption-bottom text-sm">
              <thead className="bg-muted/40">
                <tr className="text-left">
                  <th className="px-4 py-3 font-medium">Tên</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Điểm</th>
                  <th className="px-4 py-3 font-medium">Vị trí</th>
                  <th className="px-4 py-3 font-medium">Giai đoạn hiện tại</th>
                  <th className="px-4 py-3 font-medium">Trạng thái</th>
                  <th className="px-4 py-3 font-medium">CV</th>
                  <th className="w-[70px] px-4 py-3 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                      </div>
                    </td>
                  </tr>
                ) : paged.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-10 text-center text-muted-foreground">
                      Không tìm thấy ứng viên.
                    </td>
                  </tr>
                ) : (
                  paged.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="px-4 py-3">{a.fullName || "—"}</td>
                      <td className="px-4 py-3">{a.email || "—"}</td>
                      <td className="px-4 py-3">{a.point ?? "—"}</td>
                      <td className="px-4 py-3">{a.campaignPositionDescription || "—"}</td>
                      <td className="px-4 py-3">
                        {a.currentInterviewStageName ? (
                          <Badge variant="secondary">{a.currentInterviewStageName}</Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {a.status !== null && a.status !== undefined ? (
                          <button
                            type="button"
                            onClick={() => openUpdateStatusModal(a)}
                            className="focus:outline-none"
                            title="Cập nhật trạng thái"
                          >
                            <Badge className={statusBadgeClass(a.status)}>
                              {STATUS_LABEL[a.status as 0 | 1 | 2 | 3 | 4]}
                            </Badge>
                          </button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        {a.fileUrl ? (
                          <Link
                            href={a.fileUrl}
                            target="_blank"
                            className="text-primary underline underline-offset-4"
                          >
                            Open CV
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="px-2 py-2 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/accounts/${a.id}`)}>
                              <Eye className="mr-2 h-4 w-4" /> Chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => openSchedule(a)}>
                              <CalendarPlus className="mr-2 h-4 w-4" /> Lên lịch phỏng vấn
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination footer */}
          {!loading && filtered.length > 0 && (
            <div className="flex flex-col gap-2 border-t p-3 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
              <span>
                Page {safePage} of {totalPages} • Showing {paged.length} / {filtered.length} filtered • {candidates.length} total
              </span>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={safePage <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={safePage >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal V1 (giữ nguyên behavior với stageId) */}
      <ScheduleModal
        open={open}
        onOpenChange={setOpen}
        candidate={activeCandidate}
        onScheduled={refetchCandidates}
      />

      {/* Modal V2 (payload: interviewStageId) */}
      {/* <ScheduleModal2 open={openV2} onOpenChange={setOpenV2} candidate={activeCandidateV2} /> */}

      <HandleUpdateStatusCandidate
        open={openUpdateStatus}
        onOpenChange={setOpenUpdateStatus}
        candidateId={activeStatusCandidate?.id ?? ""}
        initialStatus={
          (activeStatusCandidate?.status as 0 | 1 | 2 | 3 | 4 | undefined) ?? 0
        }
        onSuccess={(updated) => {
          // update list without refetch
          setCandidates(prev =>
            prev.map(c =>
              c.id === (activeStatusCandidate?.id ?? updated.id ?? "")
                ? { ...c, status: updated.status as Candidate["status"] }
                : c
            )
          );
        }}
      />
    </div>
  );
}
