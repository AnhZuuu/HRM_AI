"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, MoreHorizontal, Eye, Edit, Trash2, Filter } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

// import AddCampaignPositionDialog from "./handleAddCampaignPosition";
// import UpdateCampaignPositionDialog from "./handleUpdateCampaignPosition";
// import DeleteCampaignPositionDialog from "./handleDeleteCampaignPosition";

type CvApplicantModel = {
  id: string;
};

type CampaignPosition = {
  id: string;
  description: string | null; // tên hiển thị
  totalSlot: number;
  campaignId: string;
  campaignName?: string; // TODO: add when API provides
  departmentId: string;
  departmentName?: string; // TODO: add when API provides
  cvApplicantModels: CvApplicantModel[];
};

export default function CampaignPositionPage() {
  const router = useRouter();
  const { toast } = useToast();

  const [positions, setPositions] = useState<CampaignPosition[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // search + pagination (client-side)
  const [searchTerm, setSearchTerm] = useState("");
  const [pageSize, setPageSize] = useState<number>(10);
  const [page, setPage] = useState<number>(1);

  // Dialog states (kept for later, but not used now)
  // const [isAddOpen, setIsAddOpen] = useState(false);
  // const [isEditOpen, setIsEditOpen] = useState(false);
  // const [editing, setEditing] = useState<CampaignPosition | null>(null);
  // const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  // const [deleting, setDeleting] = useState<CampaignPosition | null>(null);

  const mapFromApi = (raw: any): CampaignPosition => ({
    id: raw.id,
    description: raw.description ?? null,
    totalSlot: Number(raw.totalSlot ?? 0),
    campaignId: raw.campaignId,
    campaignName: raw.campaignName ?? undefined, // not available yet
    departmentId: raw.departmentId,
    departmentName: raw.departmentName ?? undefined, // not available yet
    cvApplicantModels: Array.isArray(raw.cvApplicantModels) ? raw.cvApplicantModels : [],
  });

  const unwrap = async (res: Response) => {
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    // The backend wraps data in { data: { data: [...] } }, but we only care about the array
    return json?.data?.data ?? json?.data ?? json ?? [];
  };

  const fetchPositions = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await authFetch(`${API.CAMPAIGN.POSITION}`, { signal, cache: "no-store" });
      if (res.status === 401) throw new Error("Unauthorized");
      if (!res.ok) throw new Error("Failed to load campaign positions");

      const arr = await unwrap(res);
      setPositions((Array.isArray(arr) ? arr : []).map(mapFromApi));
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

  useEffect(() => {
    const ctrl = new AbortController();
    fetchPositions(ctrl.signal);
    return () => ctrl.abort();
  }, []);

  // Derived search + pagination
  const filtered = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return positions;
    return positions.filter((p) =>
      (p.description ?? "").toLowerCase().includes(q) ||
      p.campaignId.toLowerCase().includes(q) ||
      p.departmentId.toLowerCase().includes(q)
      // || (p.campaignName ?? "").toLowerCase().includes(q)
      || (p.departmentName ?? "").toLowerCase().includes(q)
    );
  }, [positions, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageStartIndex = (currentPage - 1) * pageSize;
  const pageItems = filtered.slice(pageStartIndex, pageStartIndex + pageSize);

  // Stubs to keep menu compiled without real handlers yet
  const notReady = () =>
    toast({ description: "Chức năng sẽ được bổ sung sau.", duration: 1500 });

  // // Create
  // const handleCreate = async (payload: Omit<CampaignPosition, "id" | "cvApplicantModels">) => {
  //   // TODO: call POST API when available
  // };

  // // Update
  // const handleUpdate = async (updated: CampaignPosition) => {
  //   // TODO: call PUT API when available
  // };

  // // Delete
  // const handleDelete = async (id: string) => {
  //   // TODO: call DELETE API when available
  // };

  // Reset page when search/pageSize changes
  useEffect(() => {
    setPage(1);
  }, [searchTerm, pageSize]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Vị trí tuyển dụng</h1>
          <p className="text-gray-600 mt-1">Quản lý vị trí theo từng đợt</p>
        </div>

        {/* <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setIsAddOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm vị trí
        </Button> */}
        {/* <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => notReady()}>
          <Plus className="w-4 h-4 mr-2" />
          Thêm vị trí
        </Button> */}
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm vị trí theo tên/đợt/phòng ban..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <Select
                value={String(pageSize)}
                onValueChange={(v) => setPageSize(Number(v))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Số dòng/trang" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10 / trang</SelectItem>
                  <SelectItem value="20">20 / trang</SelectItem>
                  <SelectItem value="50">50 / trang</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            {loading ? "Đang tải..." : `Tất cả vị trí (${filtered.length})`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Số thứ tự</TableHead>
                  <TableHead>Tên</TableHead>
                  <TableHead>Số lượng</TableHead>
                  <TableHead>Đợt tuyển dụng</TableHead>
                  <TableHead>Phòng ban</TableHead>
                  <TableHead>Đã ứng tuyển</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {!loading && pageItems.map((pos, idx) => {
                  const stt = pageStartIndex + idx + 1;
                  const appliedCount = pos.cvApplicantModels?.length ?? 0;

                  return (
                    <TableRow key={pos.id}>
                      <TableCell className="w-[100px]">{stt}</TableCell>

                      <TableCell className="font-medium">
                        {pos.description ?? "—"}
                      </TableCell>

                      <TableCell>{pos.totalSlot}</TableCell>

                      <TableCell>
                        {/* {pos.campaignId} */}
                        {pos.campaignName ? ` ${pos.campaignName}` : null}
                      </TableCell>

                      <TableCell>
                        {/* {pos.departmentId} */}
                        {pos.departmentName ? ` ${pos.departmentName}` : null}
                      </TableCell>

                      <TableCell>{appliedCount}</TableCell>

                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>

                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => router.push(`/dashboard/campaignPosition/${pos.id}`)}
                            //   onClick={() => notReady()}
                            >
                              <Eye className="mr-2 h-4 w-4" />
                              Chi tiết
                            </DropdownMenuItem>

                            <DropdownMenuItem
                              // onClick={() => {
                              //   setEditing(pos);
                              //   setIsEditOpen(true);
                              // }}
                              onClick={() => notReady()}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Sửa
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              className="text-red-600"
                              // onClick={() => {
                              //   setDeleting(pos);
                              //   setIsDeleteOpen(true);
                              // }}
                              onClick={() => notReady()}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Xóa
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}

                {loading && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Đang tải dữ liệu...
                    </TableCell>
                  </TableRow>
                )}

                {!loading && pageItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-gray-500">
                      Không có dữ liệu phù hợp.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination controls */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Trang {currentPage}/{totalPages} • Tổng {filtered.length}
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={currentPage <= 1}
              >
                Trước
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage >= totalPages}
              >
                Sau
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* <AddCampaignPositionDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        onCreate={handleCreate}
      />

      <UpdateCampaignPositionDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        position={editing}
        onSave={handleUpdate}
      />

      <DeleteCampaignPositionDialog
        open={isDeleteOpen}
        onOpenChange={setIsDeleteOpen}
        position={deleting}
        onConfirm={(id) => handleDelete(id)}
      /> */}
    </div>
  );
}
