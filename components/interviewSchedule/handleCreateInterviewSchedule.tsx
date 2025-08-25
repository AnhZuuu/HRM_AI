"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { MoreHorizontal, Eye, CalendarPlus, Loader2 } from "lucide-react";

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

import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { ScheduleModal } from "./ui/ScheduleModal";
import ScheduleModal2 from "./ui/ScheduleModal2";


// tách modal ra file riêng


// =================== Types ===================
export type Candidate = {
  id: string;
  cvApplicantId: string;
  fullName: string | null;
  email: string | null;
  point: string | null;
  campaignPositionDescription: string | null;
  currentInterviewStageName: string | null;
  fileUrl: string | null;
  departmentId?: string | null;
};

// =================== Helpers ===================
function getDetailValue(details: any[] | undefined, type: string, key: string): string | null {
  if (!Array.isArray(details)) return null;
  const found = details.find((d) => d?.type === type && d?.key === key && d?.value);
  return (found?.value as string) ?? null;
}

function normalizeCandidates(json: any): Candidate[] {
  // shape: { data: { data: [ ... ] } }
  const arr = Array.isArray(json?.data?.data) ? json.data.data : [];
  return arr.map((it: any) => {
    const details = it?.cvApplicantDetailModels as any[] | undefined;
    const fallbackFullName = getDetailValue(details, "personal_info", "full_name");
    const fallbackPosition = getDetailValue(details, "personal_info", "position");

    const id = String(it?.id ?? "");
    return {
      id,
      cvApplicantId: id,
      fullName: it?.fullName ?? fallbackFullName ?? null,
      email: it?.email ?? null,
      point: it?.point ?? null,
      campaignPositionDescription: it?.campaignPositionDescription ?? fallbackPosition ?? null,
      currentInterviewStageName: it?.currentInterviewStageName ?? null,
      fileUrl: it?.fileUrl ?? null,
      // departmentId: it?.departmentId ?? null,
    } as Candidate;
  });
}

async function fetchCandidates(): Promise<Candidate[]> {
  const res = await authFetch(API.CV.APPLICANT, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to load candidates: ${res.status}`);
  const json = await res.json();
  return normalizeCandidates(json);
}

// =================== Page ===================
export default function CandidatesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [query, setQuery] = useState("");

  // modal v1
  const [open, setOpen] = useState(false);
  const [activeCandidate, setActiveCandidate] = useState<Candidate | null>(null);

  // modal v2 (payload khác field name)
  const [openV2, setOpenV2] = useState(false);
  const [activeCandidateV2, setActiveCandidateV2] = useState<Candidate | null>(null);

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

  const filtered: Candidate[] = useMemo(() => {
    const base = Array.isArray(candidates) ? candidates : [];
    const q = query.trim().toLowerCase();
    if (!q) return base;
    return base.filter((c) =>
      [c.fullName, c.email, c.campaignPositionDescription, c.currentInterviewStageName]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q))
    );
  }, [candidates, query]);

  function openSchedule(candidate: Candidate) {
    setActiveCandidate(candidate);
    setOpen(true);
  }

  function openScheduleV2(candidate: Candidate) {
    setActiveCandidateV2(candidate);
    setOpenV2(true);
  }

  return (
    <div className="min-h-[90vh] w-full bg-muted/30 p-4 md:p-8">
      <div className="mx-auto max-w-7xl space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Ứng viên</h1>
            <p className="text-sm text-muted-foreground">Lên lịch phỏng vấn nhanh chóng.</p>
          </div>
          <div className="w-full max-w-xs">
            <Input placeholder="Tìm kiếm ứng viên…" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        </div>

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
                  <th className="px-4 py-3 font-medium">CV</th>
                  <th className="px-4 py-3 font-medium w-[70px]"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">
                      <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-4 w-4 animate-spin" /> Loading…
                      </div>
                    </td>
                  </tr>
                ) : (Array.isArray(filtered) ? filtered : []).length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-muted-foreground">Không tìm thấy ứng viên.</td>
                  </tr>
                ) : (
                  (Array.isArray(filtered) ? filtered : []).map((a) => (
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
                        {a.fileUrl ? (
                          <Link href={a.fileUrl} target="_blank" className="text-primary underline underline-offset-4">Open CV</Link>
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
                            <DropdownMenuItem onClick={() => openScheduleV2(a)}>
                              <CalendarPlus className="mr-2 h-4 w-4" /> Lên lịch phỏng vấn (v2)
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
        </div>
      </div>

      {/* Modal V1 (giữ nguyên behavior với stageId) */}
      <ScheduleModal open={open} onOpenChange={setOpen} candidate={activeCandidate} />

      {/* Modal V2 (payload: interviewStageId) */}
      <ScheduleModal2 open={openV2} onOpenChange={setOpenV2} candidate={activeCandidateV2} />
    </div>
  );
}
