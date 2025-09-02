"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MoreHorizontal, Mail, Phone, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { authFetch } from "@/app/utils/authFetch";
import { formatISODate } from "@/app/utils/helper";
import API from "@/api/api";

/* ---------- Types ---------- */
type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

type CvApplicantDetail = {
  cvApplicantId: string;
  type: string;
  key: string;
  value: string;
  groupIndex: number;
};

type CvApplicant = {
  id: string;
  fullName: string | null;
  email: string | null;
  point: string | null; // e.g. "36/100"
  // New status mapping:
  // 0: Pending, 1: Rejected, 2: Accepted, 3: Failed, 4: Onboarded
  status: 0 | 1 | 2 | 3 | 4;
  campaignPositionId?: string | null;
  campaignPositionDescription?: string | null;
  fileUrl?: string | null;
  fileAlt?: string | null;
  cvApplicantDetailModels?: CvApplicantDetail[];
  creationDate?: string | null;
};

type FlatList<T> = {
  data: T[];
  // server might add paging fields, but we ignore them now
};

/* ---------- Helpers ---------- */
const STATUS_LABEL: Record<CvApplicant["status"], string> = {
  0: "Pending",
  1: "Rejected",
  2: "Accepted",
  3: "Failed",
  4: "Onboarded",
};

const statusBadgeClass = (s: CvApplicant["status"]) => {
  switch (s) {
    case 4:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-red-100 text-red-800";
    case 0:
      return "bg-yellow-100 text-blue-800";
    case 3:
      return "bg-red-300 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function CandidatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1" | "2" | "3" | "4">("all");

  // Data state
  const [items, setItems] = useState<CvApplicant[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(5);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /* ---------- Fetch all (no server pagination) ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        // Removed ?page=&pageSize= — we pull everything and paginate client-side
        const res = await authFetch(`${API.CV.APPLICANT}`, { method: "GET" });
        const text = await res.text();
        const json: ApiEnvelope<FlatList<CvApplicant> | any> = text ? JSON.parse(text) : ({} as any);

        if (!res.ok || !json?.status) {
          throw new Error(json?.message || "Failed to load applicants");
        }

        // The API you showed has data: { data: [...] }
        // Normalize to items[]
        const raw = json.data;
        const array = Array.isArray(raw?.data) ? raw.data : Array.isArray(raw) ? raw : [];

        if (!cancelled) {
          setItems(array as CvApplicant[]);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message || "Unexpected error");
          toast({
            title: "Failed to load candidates",
            description: e?.message || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [toast]);

  /* ---------- Client-side search + filter ---------- */
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((c) => {
      const matchesSearch =
        !term ||
        (c.fullName ?? "").toLowerCase().includes(term) ||
        (c.email ?? "").toLowerCase().includes(term) ||
        (c.point ?? "").toLowerCase().includes(term) ||
        (c.campaignPositionDescription ?? "").toLowerCase().includes(term);

      const matchesStatus = statusFilter === "all" || String(c.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  /* ---------- Client-side pagination ---------- */
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paged = filtered.slice(startIndex, endIndex);

  // Reset to page 1 if filters change and current page would be out of range
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trang ứng viên</h1>
          <p className="text-gray-600 mt-1">Quản lý ứng viên của bạn</p>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, point, or position…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[220px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả trạng thái</SelectItem>
                  <SelectItem value="0">Đang chờ</SelectItem>
                  <SelectItem value="1">Đã từ chối</SelectItem>
                  <SelectItem value="2">Đã chấp nhận</SelectItem>
                  <SelectItem value="3">Thất bại</SelectItem>
                  <SelectItem value="4">Onboard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Tất cả ứng viên{" "}
            {!loading && !error ? (
              <span className="text-gray-500">
               Đang hiển thị ({paged.length} trên {filtered.length})
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Đang tải ứng viên…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Lỗi: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Họ tên</TableHead>
                    <TableHead>Email</TableHead>
                    {/* Updated header to reflect the new status mapping */}
                    <TableHead>Trạng thái</TableHead>
                    <TableHead>Điểm</TableHead>
                    <TableHead>Vị trí ứng tuyển</TableHead>
                    <TableHead>Ngày đăng tải</TableHead>
                    <TableHead className="text-right">Hành động</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {paged.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.fullName || "—"}</TableCell>

                      <TableCell>
                        <div className="text-sm text-gray-700 flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {c.email || "—"}
                        </div>
                        {false && (
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Phone className="h-3 w-3" /> +84 …
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <Badge className={statusBadgeClass(c.status)}>
                          {STATUS_LABEL[c.status]}
                        </Badge>
                      </TableCell>

                      <TableCell>{c.point || "—"}</TableCell>

                      <TableCell>
                        <span className="inline-flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {c.campaignPositionDescription || "—"}
                          </span>
                        </span>
                      </TableCell>

                      <TableCell>{formatISODate(c.creationDate || undefined)}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => router.push(`/dashboard/candidates/${c.id}`)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Xem chi tiết
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() =>
                                navigator.clipboard
                                  .writeText(c.id)
                                  .then(() => toast({ title: "Copied ID" }))
                              }
                            >
                              Copy ID
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {paged.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                        Không tìm thấy ứng viên nào.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Client-side Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Trang {page} trên {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Sau
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
