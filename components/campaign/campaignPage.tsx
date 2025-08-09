import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  Plus,
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Mail,
  Phone,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import UpdateCampaignDialog from "./handleUpdateCampaign";
import AddCampaignDialog from "./handleAddCampaign";
import DeleteCampaignDialog from "./handleDeleteCampaign";
import { useRouter } from "next/navigation";

// Mock candidates data
const campaignsData = [
  {
    id: "1",
    name: "đợt 1",
    startTime: "2024-01-14",
    endTime: "2024-02-14",
    description: "abc",
    createdBy: "123",
  },
  {
    id: "2",
    name: "đợt 2",
    startTime: "2024-01-14",
    endTime: "2024-02-14",
    description: "abc",
    createdBy: "123",
  },
  {
    id: "3",
    name: "đợt 3",
    startTime: "2024-01-14",
    endTime: "2024-02-14",
    description: "abc",
    createdBy: "123",
  },
];

export default function CampaignPage() {
  const [campaigns, setCampaigns] = useState(campaignsData);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Campaign | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState<Campaign | null>(null);
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
    return `còn ${daysLeft} ngày`;
  };

  const getStatusColor = (status: string) => {
    if (status === "kết thúc" || status === "kết thúc hôm nay")
      return "bg-red-100 text-red-800";
    if (status === "sắp bắt đầu") return "bg-yellow-100 text-yellow-800";

    const num = Number(status.match(/\d+/)?.[0] ?? "999");
    if (num <= 2) return "bg-orange-100 text-orange-800";
    return "bg-green-100 text-green-800";
  };

  const [today, setToday] = useState(new Date());

  useEffect(() => {
    const now = new Date();
    const nextMidnight = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1
    );
    const ms = nextMidnight.getTime() - now.getTime();
    const t1 = setTimeout(() => {
      setToday(new Date());

      const t2 = setInterval(() => setToday(new Date()), 24 * 60 * 60 * 1000);
    }, ms);
    return () => clearTimeout(t1);
  }, []);

  const getCampaignPhase = (start: string, end: string, today = new Date()) => {
    const dToday = toMidnight(today)
    const dStart = toMidnight(start)
    const dEnd = toMidnight(end)

    if (dToday < dStart) return "sap_bat_dau"
    if (dToday > dEnd) return "ket_thuc"
    return "dang_dien_ra"
  }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const phase = getCampaignPhase(campaign.startTime, campaign.endTime, today);
    const matchesStatus = statusFilter === "all" || phase === statusFilter;

  return matchesSearch && matchesStatus;
  });

  const handleAddCampaign = (created: Campaign) => {
    setCampaigns((prev : any) => [...prev, created]);
    toast({ title: "Success", description: "Campaign added successfully!" });
  };

  const handleUpdateCampaign = (updated: Campaign) => {
    setCampaigns((prev : any) =>
      prev.map((c : any) => (c.id === updated.id ? { ...c, ...updated } : c))
    );
    toast({ title: "Đã cập nhật", description: "Cập nhật đợt tuyển dụng thành công." });
  };

  const openDelete = (c: Campaign) => {
    setDeleting(c);
    setDeleteOpen(true);
  };

  const handleDeleteCampaign = async (id: string) => {
    setCampaigns((prev : any) => prev.filter((c : any) => c.id !== id));
    toast({ title: "Đã xóa", description: "Xóa đợt tuyển dụng thành công." });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Các đợt tuyển dụng
          </h1>
          <p className="text-gray-600 mt-1">Quản lý đợt tuyển dụng </p>
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
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
          <CardTitle>Tất cả đợt ({filteredCampaigns.length})</CardTitle>
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
                </TableRow>
              </TableHeader>

              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const status = getCampaignStatus(campaign.startTime, campaign.endTime, today)
                        return <Badge className={getStatusColor(status)}>{status}</Badge>
                      })()}
                    </TableCell>
                    <TableCell>{campaign.startTime}</TableCell>
                    <TableCell>{campaign.endTime}</TableCell>
                    <TableCell>{campaign.description}</TableCell>
                    <TableCell>{campaign.createdBy}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">                          
                          <DropdownMenuItem onClick={() => router.push(`/dashboard/campaigns/${campaign.id}`)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Chi tiết
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              setEditing(campaign);
                              setEditOpen(true);
                            }}>
                            <Edit className="mr-2 h-4 w-4" />
                            Sửa
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600"
                            onClick={() => openDelete(campaign)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Xóa
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
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
        defaultCreatedBy={"null"}
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
        onConfirm={handleDeleteCampaign}
      />

    </div>
  );
}
