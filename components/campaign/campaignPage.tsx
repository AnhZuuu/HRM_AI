"use client";

import { useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Plus, MoreHorizontal, Eye, Edit, Trash2, ChevronsLeft, ChevronLeft, ChevronRight, ChevronsRight } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UpdateCampaignDialog from "./handleUpdateCampaign";
import AddCampaignDialog from "./handleAddCampaign";
import DeleteCampaignDialog from "./handleDeleteCampaign";

import { authFetch } from "@/app/utils/authFetch";
import { formatDMYHM, formatISODate, toIsoFromDateInput, toMidnight } from "@/app/utils/helper";
import { useRouter } from "next/navigation";
import API from "@/api/api";

/* ---------- Types ---------- */
export type Campaign = {
  id: string;
  name: string;
  startTime: string | null;
  endTime: string | null;
  description: string;
  createdBy?: string | null;
  createdByName?: string | null;
};

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);

  // Pagination state
  const [page, setPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(5);

  const { toast } = useToast();
  const router = useRouter();

  // ---- API helpers ---------------------------------------------------------
  const mapFromApi = (c: any): Campaign => ({
    id: c.id,
    name: c.name,
    startTime: c.startTime,
    endTime: c.endTime,
    description: c.description,
    createdBy: c.createdById ?? null,
    createdByName: c.createdByName ?? null,
  });

  const mapToApi = (c: Partial<Omit<Campaign, "id">>) => {
    const out: any = {
      name: c.name,
      description: c.description,
      // fix key: startTime (not "starTime")
      startTime: toIsoFromDateInput(c.startTime ?? null),
      endTime: toIsoFromDateInput(c.endTime ?? null),
      createdById: c.createdBy ?? null,
    };
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
  };

  const unwrap = async (res: Response) => {
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    return json?.data?.data ?? json?.data ?? json;
  };

  // GET
  const fetchCampaigns = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API.CAMPAIGN.BASE}`, { signal, cache: "no-store" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to load campaigns");

      const json = await res.json();

      const list: any[] =
      Array.isArray(json?.data) ? json.data :
      Array.isArray(json?.data?.data) ? json.data.data :
      (Array.isArray(json) ? json : []);
      
      setCampaigns(list.map(mapFromApi));
    } catch (err: any) {
      toast({
        title: err?.message === "Unauthorized" ? "Phiên đăng nhập hết hạn" : "Lỗi tải dữ liệu",
        description: err?.message === "Unauthorized" ? "Vui lòng đăng nhập lại." : (err?.message ?? "Không thể tải danh sách"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // DELETE
  const deleteCampaign = async (id: string) => {
    const res = await authFetch(`${API.CAMPAIGN.BASE}/${id}`, { method: "DELETE" });
    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) throw new Error((await res.text()) || "Delete failed");
    return (await res.text()).length ? await res.json() : null;
  };
  // -------------------------------------------------------------------------

  useEffect(() => {
    const ctrl = new AbortController();
    fetchCampaigns(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  // Dates / status
  const [today, setToday] = useState(new Date());
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = nextMidnight.getTime() - now.getTime();
    const t1 = setTimeout(() => {
      setToday(new Date());
      const t2 = setInterval(() => setToday(new Date()), 24 * 60 * 60 * 1000);
      return () => clearInterval(t2);
    }, ms);
    return () => clearTimeout(t1);
  }, []);

  const getCampaignStatus = (start: string | null, end: string | null, t = new Date()) => {
    const dToday = toMidnight(t);
    const dStart = toMidnight(start || new Date());
    const dEnd = toMidnight(end || new Date());

    if (dToday < dStart) return "sắp bắt đầu";
    if (dToday > dEnd) return "kết thúc";

    const msPerDay = 24 * 60 * 60 * 1000;
    const daysLeft = Math.round((dEnd.getTime() - dToday.getTime()) / msPerDay);
    if (daysLeft === 0) return "kết thúc hôm nay";
    return `Còn ${daysLeft} ngày`;
  };

  const getStatusColor = (status: string) => {
    if (status === "kết thúc" || status === "kết thúc hôm nay") return "bg-red-100 text-red-800";
    if (status === "sắp bắt đầu") return "bg-yellow-100 text-yellow-800";
    const num = Number(status.match(/\d+/)?.[0] ?? "999");
    if (num <= 2) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  const getCampaignPhase = (start: string | null, end: string | null, t = new Date()) => {
    const dToday = toMidnight(t);
    const dStart = toMidnight(start || new Date());
    const dEnd = toMidnight(end || new Date());
    if (dToday < dStart) return "sap_bat_dau";
    if (dToday > dEnd) return "ket_thuc";
    return "dang_dien_ra";
  };

  // Filtered list (search + status)
  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) => {
      const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
      const phase = getCampaignPhase(campaign.startTime ?? null, campaign.endTime ?? null, today);
      const matchesStatus = statusFilter === "all" || phase === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [campaigns, searchTerm, statusFilter, today]);

  // Reset to page 1 whenever search or filters change
  useEffect(() => {
    setPage(1);
  }, [searchTerm, statusFilter]);

  // Pagination derived data
  const total = filteredCampaigns.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  // clamp page when data changes
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const startIndex = (page - 1) * pageSize;
  const endIndexExclusive = Math.min(startIndex + pageSize, total);
  const pageRows = filteredCampaigns.slice(startIndex, endIndexExclusive);

  // Dialog helpers
  const openDelete = (c: Campaign) => {
    setDeleting(c);
    setDeleteOpen(true);
  };

  // Handlers (update from dialog & delete)
  const handleUpdateCampaign = (saved: Campaign) => {
    setCampaigns((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)));
    // keep current page as-is
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Đã xóa", description: "Xóa đợt tuyển dụng thành công." });
      setDeleteOpen(false);
      setDeleting(null);
      // adjust page if we removed the last item on the last page
      const remaining = total - 1;
      const newTotalPages = Math.max(1, Math.ceil(remaining / pageSize));
      if (page > newTotalPages) setPage(newTotalPages);
    } catch (err: any) {
      toast({ title: "Xóa thất bại", description: err?.message ?? "Không thể xóa", variant: "destructive" });
    }
  };

  // Pagination controls
  const goFirst = () => setPage(1);
  const goPrev = () => setPage((p) => Math.max(1, p - 1));
  const goNext = () => setPage((p) => Math.min(totalPages, p + 1));
  const goLast = () => setPage(totalPages);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Các đợt tuyển dụng</h1>
          <p className="text-gray-600 mt-1">Quản lý đợt tuyển dụng</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm đợt tuyển dụng
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm đợt tuyển dụng theo tên..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v)}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Lọc theo trạng thái" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  <SelectItem value="sap_bat_dau">Sắp bắt đầu</SelectItem>
                  <SelectItem value="dang_dien_ra">Đang diễn ra</SelectItem>
                  <SelectItem value="ket_thuc">Kết thúc</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? "Đang tải..." : `Tất cả đợt (${total})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tên</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Tạo bởi</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {!loading && pageRows.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = getCampaignStatus(campaign.startTime ?? null, campaign.endTime ?? null, today);
                        return <Badge className={getStatusColor(status)}>{status}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>{formatISODate(campaign.startTime)}</TableCell>
                    <TableCell>{formatISODate(campaign.endTime)}</TableCell>
                    <TableCell>{campaign.description}</TableCell>
                    <TableCell>{campaign.createdByName ?? "—"}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" /> Chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(campaign);
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" /> Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          {/* <DropdownMenuItem className="text-red-600" onClick={() => openDelete(campaign)}>
                            <Trash2 className="mr-2 h-4 w-4" /> Xóa
                          </DropdownMenuItem> */}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && pageRows.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Không có dữ liệu.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination footer */}
          <div className="mt-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-sm text-gray-600">
              {total > 0
                ? `${startIndex + 1}–${endIndexExclusive} trong ${total}`
                : `0 trong 0`}
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">Hiển thị</span>
                <Select
                  value={String(pageSize)}
                  onValueChange={(v) => {
                    const newSize = Number(v);
                    const firstItemIndex = startIndex; // keep the top row stable when possible
                    const newPage = Math.floor(firstItemIndex / newSize) + 1;
                    setPageSize(newSize);
                    setPage(newPage);
                  }}
                >
                  <SelectTrigger className="w-[90px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
                <span className="text-sm text-gray-600">mục</span>
              </div>

              <div className="flex items-center gap-1">
                <Button variant="outline" size="icon" onClick={goFirst} disabled={page <= 1}>
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goPrev} disabled={page <= 1}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>

                {/* Simple numbered buttons (up to 5 around current) */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }).slice(
                    Math.max(0, page - 3),
                    Math.max(0, page - 3) + Math.min(5, totalPages)
                  ).map((_, i, arr) => {
                    const start = Math.max(1, page - 2);
                    const p = start + i;
                    if (p > totalPages) return null;
                    const isActive = p === page;
                    return (
                      <Button
                        key={p}
                        variant={isActive ? "default" : "outline"}
                        size="sm"
                        className="px-3"
                        onClick={() => setPage(p)}
                      >
                        {p}
                      </Button>
                    );
                  })}
                </div>

                <Button variant="outline" size="icon" onClick={goNext} disabled={page >= totalPages}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="icon" onClick={goLast} disabled={page >= totalPages}>
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Add dialog performs POST and bubbles the created item back */}
      <AddCampaignDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        nextId={campaigns.length + 1}
        defaultCreatedBy={null}
        onCreated={(saved) => {
          setCampaigns((prev) => [...prev, saved]); // update immediately
          // Optional: jump to the page that contains the new item (here we keep current page)
        }}
      />

      <UpdateCampaignDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        campaign={editing}
        onSave={handleUpdateCampaign}
      />

      {/* <DeleteCampaignDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        campaign={deleting}
        onConfirm={(id) => handleDeleteCampaign(id)}
      /> */}
    </div>
  );
}
