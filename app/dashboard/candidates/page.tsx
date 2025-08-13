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
import API from "@/api/api";

// ---------- Types ----------
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
  fullName: string;
  email: string;
  point: string; // "36/100" format
  status: 0 | 1 | 2 | 3; // 0 Pending, 1 Reviewed, 2 Rejected, 3 Accepted
  campaignPositionId?: string | null;
  fileUrl?: string | null;
  fileAlt?: string | null;
  cvApplicantDetailModels?: CvApplicantDetail[];
  creationDate?: string;
};

type Paged<T> = {
  data: T[];
  currentPage: number;
  pageSize: number;
  totalPages: number;
};

// ---------- Helpers ----------
const STATUS_LABEL: Record<CvApplicant["status"], string> = {
  0: "Pending",
  1: "Reviewed",
  2: "Rejected",
  3: "Accepted",
};

const statusBadgeClass = (s: CvApplicant["status"]) => {
  switch (s) {
    case 3:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-purple-100 text-purple-800";
    case 0:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : "—");

const formatISODate = (iso?: string) => {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  } catch {
    return "—";
  }
};

// ---------- Component ----------
export default function CandidatesPage() {
  const router = useRouter();
  const { toast } = useToast();

  // UI state
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "0" | "1" | "2" | "3">("all");

  // Data state
  const [items, setItems] = useState<CvApplicant[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);

  // Loading / error
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data
  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await authFetch(`${API.CV.APPLICANT}?page=${page}&pageSize=${pageSize}`, {
          method: "GET",
        });
        const text = await res.text();
        const json: ApiEnvelope<Paged<CvApplicant>> = text ? JSON.parse(text) : ({} as any);

        if (!res.ok || !json?.status) {
          throw new Error(json?.message || "Failed to load applicants");
        }

        if (!cancelled) {
          setItems(json.data?.data ?? []);
          setTotalPages(json.data?.totalPages ?? 1);
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
  }, [page, pageSize, toast]);

  // Client-side filter/search
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return items.filter((c) => {
      const matchesSearch =
        !term ||
        c.fullName?.toLowerCase().includes(term) ||
        c.email?.toLowerCase().includes(term) ||
        c.point?.toLowerCase().includes(term);
      const matchesStatus = statusFilter === "all" || String(c.status) === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, searchTerm, statusFilter]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-600 mt-1">Manage your candidate pipeline</p>
        </div>

        {/* (Optional) Actions on header — kept minimal for read-only list */}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by name, email, or point…"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                <SelectTrigger className="w-[200px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="0">Pending</SelectItem>
                  <SelectItem value="1">Reviewed</SelectItem>
                  <SelectItem value="2">Rejected</SelectItem>
                  <SelectItem value="3">Accepted</SelectItem>
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
            All Candidates{" "}
            {!loading && !error ? (
              <span className="text-gray-500">({filtered.length} of {items.length})</span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Loading / Error states */}
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading candidates…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Error: {error}</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Full Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Point</TableHead>
                    <TableHead>Campaign Position</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id}>
                      <TableCell className="font-medium">{c.fullName || "—"}</TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-700 flex items-center gap-2">
                          <Mail className="h-3 w-3" />
                          {c.email || "—"}
                        </div>
                        {/* If phone is parsed in future from details, show it here */}
                        {false && (
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <Phone className="h-3 w-3" /> +84 …
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass(c.status)}>{STATUS_LABEL[c.status]}</Badge>
                      </TableCell>
                      <TableCell>{c.point || "—"}</TableCell>
                      <TableCell>
                        {/* You don't have the joined entity yet; show a friendly placeholder */}
                        <span className="inline-flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                            {shortId(c.campaignPositionId)}
                          </span>
                          <span className="text-gray-400 text-xs">(position)</span>
                        </span>
                      </TableCell>
                      <TableCell>{formatISODate(c.creationDate)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/candidates/${c.id}`)}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              View Details
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
                  {filtered.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                        No candidates found.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
