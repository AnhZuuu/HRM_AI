"use client";

import { useEffect, useMemo, useState } from "react";
import InterviewSchedulesTable, {
  type InterviewSchedule as RowType,
  type CVApplicant as UICVApplicant,
} from "@/components/interviewSchedule/interviewScheduleCard";
import { mockInterviewSchedule } from "@/components/interviewSchedule/sampleData/mockData";

import { Button } from "@/components/ui/button";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";
import Link from "next/link";
import { Plus } from "lucide-react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { useDecodedToken } from "@/components/auth/useDecodedToken";

import {isHR, isDepartmentManager, isHRorAdmin, isHRorDMorAdmin } from "@/lib/auth";


// ---- API shapes ----
type ApiItem = {
  id: string;
  cvApplicantId: string;
  startTime: string;
  endTime?: string | null;
  status: number;                    // 0 Pending, 1 Canceled, 2 Pass, 3 Fail
  stageName: string | null;
  interviewTypeId: string;
  interviewTypeName?: string | null;
  notes?: string | null;
  createdById?: string | null;
};

type ApiPage = {
  data: ApiItem[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

// Preserve paging metadata from your payload shape:
// { code, status, message, data: { data: [...], currentPage, pageSize, totalPages } }
const readApiPage = async (res: Response): Promise<ApiPage> => {
  const text = await res.text();
  const json = text ? JSON.parse(text) : null;

  // Preferred shape
  const d = json?.data;
  if (d && Array.isArray(d.data)) {
    return {
      data: d.data,
      currentPage: typeof d.currentPage === "number" ? d.currentPage : 1,
      pageSize: typeof d.pageSize === "number" ? d.pageSize : d.data.length,
      totalPages: typeof d.totalPages === "number" ? d.totalPages : 1,
    };
  }

  // Fallbacks (just in case)
  const arr = json?.data?.data ?? json?.data ?? json;
  if (Array.isArray(arr)) {
    return { data: arr, currentPage: 1, pageSize: arr.length, totalPages: 1 };
  }
  return {
    data: arr?.items ?? [],
    currentPage: arr?.currentPage ?? 1,
    pageSize: arr?.pageSize ?? (arr?.items?.length ?? 0),
    totalPages: arr?.totalPages ?? 1,
  };
};

const statusToString = (n: number | null | undefined): string | null => {
  switch (n) {
    case 0: return "Pending";
    case 1: return "Canceled";
    case 2: return "Pass";
    case 3: return "Fail";
    default: return null;
  }
};

const mapItem = (x: ApiItem): RowType => ({
  id: x.id,
  cvApplicantId: x.cvApplicantId,
  cvApplicantModel: (x as any).cvApplicantModel
    ? {
        id: (x as any).cvApplicantModel.id,
        fullName: (x as any).cvApplicantModel.fullName ?? "",
        email: (x as any).cvApplicantModel.email ?? null,
      }
    : null,
  startTime: x.startTime,
  endTime: x.endTime ?? null,
  createdBy: x.createdById ?? null,
  status: statusToString(x.status),
  stageName: x.stageName ?? null,
  interviewTypeId: x.interviewTypeId,
  interviewType: null,
  interviewTypeName: x.interviewTypeName ?? null,
  notes: x.notes ?? null,
  departmentId: null,
  interviewers: [],
  campaignPositionModel: (x as any).campaignPositionModel
    ? {
        id: (x as any).campaignPositionModel.id,
        departmentId: (x as any).campaignPositionModel.departmentId,
        departmentName: (x as any).campaignPositionModel.departmentName ?? null,
      }
    : null,

});


export default function InterviewSchedulesPage() {
  // Full dataset (for stats + Today table)
  const [items, setItems] = useState<RowType[]>([]);
  const [loadingStats, setLoadingStats] = useState(true);
  const [err, setErr] = useState("");

  // Paginated dataset for All table
  const [pageItems, setPageItems] = useState<RowType[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const {claims, expired} = useDecodedToken();
  const accountId =  claims?.accountId ?? "";
  const isAccountIdReady = useMemo(() => isHRorAdmin(), [claims]); 
  const isDM = useMemo(() => isDepartmentManager(), [claims]);

const getSchedulesUrl = () => {
  if (isAccountIdReady) return `${API.INTERVIEW.SCHEDULE}`;
  if(isDM) return `${API.INTERVIEW.SCHEDULE}/${localStorage.getItem("departmentId")}/departments`;
  // else if isDM thi chay API schedule/deparmentId/departments
  //departmentId từ localStorage
  if (!accountId) return null; 
 
  return `${API.INTERVIEW.SCHEDULE}/${accountId}/accounts`;
};
  // -------- fetch: full list for stats/today (iterate with real totalPages) --------
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const url = getSchedulesUrl();
      if (expired) return;              
      if (!url) return;     

      setLoadingStats(true);
      setErr("");
      try {
        const all: RowType[] = [];
        let p = 1;
        let tp = 1;

        do {
          // const url = `${API.INTERVIEW.SCHEDULE}`;
        console.log("url 1 " + url );

          const res = await authFetch(url, { method: "GET", signal: controller.signal });
          if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

          const apiPage = await readApiPage(res);
          all.push(...(apiPage.data ?? []).map(mapItem));
          tp = apiPage.totalPages ?? p;
          p += 1;
        } while (p <= tp);

        if (alive) setItems(all);
      } catch (e: any) {
        if (alive) setErr(e?.message || "Không thể tải dữ liệu lịch phỏng vấn.");
      } finally {
        if (alive) setLoadingStats(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
    // If you want stats to be independent from the UI pageSize,
    // replace &pageSize=${pageSize} with a larger fixed number, e.g. 50 or 100.
  }, [pageSize, accountId, isAccountIdReady, expired, isDM]);

  // -------- fetch: single page for All table --------
  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    (async () => {
      const urlBase = getSchedulesUrl();
      if (expired) return;
      if (!urlBase) return;
      setListLoading(true);
        
      try {
        const url = urlBase;
        console.log("url " + url );
        const res = await authFetch(url, { method: "GET", signal: controller.signal });
        if (!res.ok) throw new Error((await res.text()) || `HTTP ${res.status}`);

        const apiPage = await readApiPage(res);

        if (alive) {
          setPageItems((apiPage.data ?? []).map(mapItem));
          setTotalPages(apiPage.totalPages ?? 1);
        }
      } catch (e: any) {
        if (alive) setErr(e?.message || "Không thể tải dữ liệu lịch phỏng vấn.");
      } finally {
        if (alive) setListLoading(false);
      }
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, [page, pageSize, accountId, isAccountIdReady, expired, isDM]);

  // -------- stats & splits (from full items) --------
  const toLocalYMD = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  };
  const localYMDFromISO = (iso: string) => toLocalYMD(new Date(iso));
  const startOfWeekMon = (d = new Date()) => {
    const day = d.getDay();
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

  const todayYMD = toLocalYMD(new Date());

  const todayItems = useMemo(
    () => items.filter((it) => localYMDFromISO(it.startTime) === todayYMD),
    [items, todayYMD]
  );

  const weekRange = useMemo(() => ({ s: startOfWeekMon(), e: endOfWeekSun() }), []);
  const weekItems = useMemo(
    () =>
      items.filter((it) => {
        const d = new Date(it.startTime);
        return d >= weekRange.s && d <= weekRange.e;
      }),
    [items, weekRange]
  );

  const todayCount = todayItems.length;
  const weekCount = weekItems.length;

  const scheduledTodayCount = useMemo(
    () =>
      items.filter(
        (it) =>
          (it.status ?? "").toLowerCase() === "pending" &&
          localYMDFromISO(it.startTime) === todayYMD
      ).length,
    [items, todayYMD]
  );

  const completedTodayCount = useMemo(
    () =>
      items.filter((it) => {
        const s = (it.status ?? "").toLowerCase();
        const isDone = s === "pass" || s === "fail";
        if (!isDone) return false;
        const when = it.endTime ? it.endTime : it.startTime;
        return localYMDFromISO(when) === todayYMD;
      }).length,
    [items, todayYMD]
  );

  // -------- UI --------
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Lịch phỏng vấn</h1>
          <p className="text-gray-600 mt-1">Danh sách lịch phỏng vấn của ứng viên</p>
          {/* <p className="text-gray-600 mt-1">AccountId: {accountId}</p> */}

        </div>
        {isHR() && (
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/dashboard/schedules/new">
              <Plus className="w-4 h-4 mr-2" />
              Tạo phỏng vấn
            </Link>
          </Button>
        )}
        
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Hôm nay</p>
          <p className="text-2xl font-semibold">{loadingStats ? "…" : todayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {loadingStats
              ? "Đang tải…"
              : todayCount > 0
              ? `Có ${todayCount} lịch vào ${new Date().toLocaleDateString("vi-VN")}`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã phỏng vấn (hôm nay)</p>
          <p className="text-2xl font-semibold">{loadingStats ? "…" : scheduledTodayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {loadingStats
              ? "Đang tải…"
              : scheduledTodayCount > 0
              ? `Có ${scheduledTodayCount} lịch đang Pending`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Đã hoàn thành (hôm nay)</p>
          <p className="text-2xl font-semibold">{loadingStats ? "…" : completedTodayCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {loadingStats
              ? "Đang tải…"
              : completedTodayCount > 0
              ? `Có ${completedTodayCount} lịch đã Pass/Fail`
              : "Không có lịch hôm nay"}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
          <p className="text-sm text-gray-500">Trong tuần này</p>
          <p className="text-2xl font-semibold">{loadingStats ? "…" : weekCount}</p>
          <p className="text-xs text-gray-500 mt-1">
            {new Date(weekRange.s).toLocaleDateString("vi-VN")} – {new Date(weekRange.e).toLocaleDateString("vi-VN")}
          </p>
        </div>
      </div>

      {/* Today-only table (always full dataset) */}
      <h2 className="text-lg font-semibold text-gray-900">Danh sách lịch phỏng vấn hôm nay</h2>
      {/* {err && <div className="text-sm text-red-600 mb-2">Lỗi tải dữ liệu: {err}</div>}   */}
      {loadingStats ? (
        <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm text-gray-500">Đang tải…</div>
      ) : (
        <InterviewSchedulesTable title="" variant="range" data={todayItems} />
      )}

      {/* All table (paginated) */}
      <h2 className="text-lg font-semibold text-gray-900">Danh sách tất cả lịch phỏng vấn</h2>
      {listLoading ? (
        <div className="rounded-xl border border-gray-200 p-6 bg-white shadow-sm text-gray-500">Đang tải…</div>
      ) : (
        <>
          <InterviewSchedulesTable title="Tất cả" variant="all" data={pageItems} />
        </>
      )}
    </div>
  );
}
