import { useEffect, useState } from "react";
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
import { Search, Filter, Plus, MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UpdateCampaignDialog from "./handleUpdateCampaign";
import AddCampaignDialog from "./handleAddCampaign";
import DeleteCampaignDialog from "./handleDeleteCampaign";

import { authFetch } from "@/app/utils/authFetch";
import { formatDMYHM, toIsoFromDateInput } from "@/app/utils/helper";

import { useRouter } from "next/navigation";


const API_BASE = "http://localhost:7064/api";
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



  // ---- API helpers ---------------------------------------------------------
  // Map server -> UI
  const mapFromApi = (c: any): Campaign => ({
    id: c.id,
    name: c.name,
    startTime: c.startTime,
    endTime: c.endTime,
    description: c.description,
    createdBy: c.createdById ?? null,
  });

  // Map UI -> server
  const mapToApi = (c: Partial<Omit<Campaign, "id">>) => {
    const out: any = {
      name: c.name,
      description: c.description,
      starTime: toIsoFromDateInput(c.startTime ?? null),
      endTime: toIsoFromDateInput(c.endTime ?? null),
      createdById: c.createdBy ?? null,
    };
    Object.keys(out).forEach((k) => out[k] === undefined && delete out[k]);
    return out;
  };

  // Safe unwrap for your API wrapper (handles both wrapped and raw)
  const unwrap = async (res: Response) => {
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    return json?.data?.data ?? json?.data ?? json;
  };


  // GET
  const fetchCampaigns = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE}/campaigns`, { signal, cache: "no-store" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to load campaigns");

      const json = await res.json();
      const list = (json?.data?.data ?? []) as any[];
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



  // POST
  const createCampaign = async (payload: Omit<Campaign, "id">) => {
    const res = await authFetch(`${API_BASE}/campaigns`, {
      method: "POST",
      body: JSON.stringify(mapToApi(payload)),
    });
    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) throw new Error((await res.text()) || "Create failed");

    const body = await unwrap(res);
    return mapFromApi(body);
  };


  // PUT
  const updateCampaign = async (id: string, payload: Partial<Campaign>) => {
    const res = await authFetch(`${API_BASE}/campaigns/${id}`, {
      method: "PUT",
      body: JSON.stringify(mapToApi(payload)),
    });
    if (res.status === 401) throw new Error("Unauthorized");
    if (!res.ok) throw new Error((await res.text()) || "Update failed");

    const body = await unwrap(res);
    return mapFromApi(body);
  };



  // DELETE
  const deleteCampaign = async (id: string) => {
    const res = await authFetch(`${API_BASE}/campaigns/${id}`, { method: "DELETE" });
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

  const { toast } = useToast();
  const router = useRouter();

  const toMidnight = (d: string | Date) => {
    const date = typeof d === "string" ? new Date(d) : d;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const getCampaignStatus = (start: string, end: string, today = new Date()) => {
    const dToday = toMidnight(today);
    const dStart = toMidnight(start);
    const dEnd = toMidnight(end);

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

  const [today, setToday] = useState(new Date());
  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const ms = nextMidnight.getTime() - now.getTime();
    const t1 = setTimeout(() => {
      setToday(new Date());
      const t2 = setInterval(() => setToday(new Date()), 24 * 60 * 60 * 1000);
      // cleanup for interval inside timeout
      return () => clearInterval(t2);
    }, ms);
    return () => clearTimeout(t1);
  }, []);

  const getCampaignPhase = (start: string, end: string, today = new Date()) => {
    const dToday = toMidnight(today);
    const dStart = toMidnight(start);
    const dEnd = toMidnight(end);
    if (dToday < dStart) return "sap_bat_dau";
    if (dToday > dEnd) return "ket_thuc";
    return "dang_dien_ra";
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchTerm.toLowerCase());
    const phase = getCampaignPhase(campaign.startTime, campaign.endTime, today);
    const matchesStatus = statusFilter === "all" || phase === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Dialog helpers
  const openDelete = (c: Campaign) => {
    setDeleting(c);
    setDeleteOpen(true);
  };

  // ---- Handlers wired to real API -----------------------------------------
  const handleAddCampaign = async (created: Campaign) => {
    try {
      // If your Add dialog already builds full Campaign with temp id:
      const { id: _ignoreId, ...rest } = created;
      const payload: Omit<Campaign, "id"> = {
        ...rest,
        createdBy: created.createdBy ?? null,
      };
      const saved = await createCampaign(payload);
      setCampaigns((prev) => [...prev, saved]);
      toast({ title: "Success", description: "Campaign added successfully!" });
      setIsAddDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Thất bại", description: err?.message ?? "Không thể tạo đợt", variant: "destructive" });
    }
  };

  const handleUpdateCampaign = async (updated: Campaign) => {
    try {
      const saved = await updateCampaign(updated.id, updated);
      setCampaigns((prev) => prev.map((c) => (c.id === saved.id ? { ...c, ...saved } : c)));
      toast({ title: "Đã cập nhật", description: "Cập nhật đợt tuyển dụng thành công." });
      setEditOpen(false);
      setEditing(null);
    } catch (err: any) {
      toast({ title: "Cập nhật thất bại", description: err?.message ?? "Không thể cập nhật", variant: "destructive" });
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    try {
      await deleteCampaign(id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
      toast({ title: "Đã xóa", description: "Xóa đợt tuyển dụng thành công." });
      setDeleteOpen(false);
      setDeleting(null);
    } catch (err: any) {
      toast({ title: "Xóa thất bại", description: err?.message ?? "Không thể xóa", variant: "destructive" });
    }
  };
  // -------------------------------------------------------------------------

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
            {loading ? "Đang tải..." : `Tất cả đợt (${filteredCampaigns.length})`}
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
                {!loading && filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">{campaign.name}</TableCell>
                    <TableCell>
                      {(() => {
                        const status = getCampaignStatus(campaign.startTime, campaign.endTime, today);
                        return <Badge className={getStatusColor(status)}>{status}</Badge>;
                      })()}
                    </TableCell>
                    <TableCell>{formatDMYHM(campaign.startTime)}</TableCell>
                    <TableCell>{formatDMYHM(campaign.endTime)}</TableCell>
                    <TableCell>{campaign.description}</TableCell>
                    <TableCell>{campaign.createdBy ?? "—"}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>

                        {/* <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Hành động</DropdownMenuLabel>
                          <DropdownMenuItem> */}

                        <DropdownMenuContent align="end">                          
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setEditing(campaign);
                              setEditOpen(true);
                            }}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600" onClick={() => openDelete(campaign)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
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
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <AddCampaignDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onCreate={handleAddCampaign}
        nextId={campaigns.length + 1}
        defaultCreatedBy={null}
      />

      <UpdateCampaignDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        campaign={editing}
        onSave={handleUpdateCampaign}
      />

      <DeleteCampaignDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        campaign={deleting}
        onConfirm={(id) => handleDeleteCampaign(id)}
      />
    </div>
  );
}