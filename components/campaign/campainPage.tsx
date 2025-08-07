import { useState } from "react";
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

// Mock candidates data
const campaignsData = [
  {
    id: 1,
    name: "đợt 1",
    startTime: "2024-01-14",
    endTime: "2024-02-14",
    description: "abc",
    createdBy: "123",
  },
  {
    id: 2,
    name: "đợt 2",
    startTime: "2024-01-14",
    endTime: "2024-02-14",
    description: "abc",
    createdBy: "123",
  },
  {
    id: 3,
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
  const { toast } = useToast();

  const [newCampaign, setNewCampaign] = useState({
    name: "",
    startTime: "",
    endTime: "",
    description: "",
  });

  //   const getStatusColor = (status: string) => {
  //     switch (status) {
  //       case "Hired":
  //         return "bg-green-100 text-green-800"
  //       case "Interview":
  //         return "bg-purple-100 text-purple-800"
  //       case "Screening":
  //         return "bg-yellow-100 text-yellow-800"
  //       case "Applied":
  //         return "bg-blue-100 text-blue-800"
  //       case "Rejected":
  //         return "bg-red-100 text-red-800"
  //       default:
  //         return "bg-gray-100 text-gray-800"
  //     }
  //   }

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    // const matchesStatus = statusFilter === "all" || campaign.status.toLowerCase() === statusFilter.toLowerCase()
    return matchesSearch;
  });

  const handleAddCampaign = () => {
    if (!newCampaign.name || !newCampaign.startTime || !newCampaign.endTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const campaign = {
      id: campaigns.length + 1,
      ...newCampaign,
      createdBy: "null",
    };

    setCampaigns([...campaigns, campaign]);
    setNewCampaign({
      name: "",
      startTime: "",
      endTime: "",
      description: "",
    });
    setIsAddDialogOpen(false);

    toast({
      title: "Success",
      description: "Campaign added successfully!",
    });
  };

  //   const handleStatusChange = (candidateId: number, newStatus: string) => {
  //     setCandidates(
  //       candidates.map((candidate) =>
  //         candidate.id === candidateId
  //           ? { ...candidate, status: newStatus }
  //           : candidate
  //       )
  //     );

  //     toast({
  //       title: "Status Updated",
  //       description: `Candidate status changed to ${newStatus}`,
  //     });
  //   };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Các đợt tuyển dụng</h1>
          <p className="text-gray-600 mt-1">Quản lý đợt tuyển dụng </p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Thêm đợt tuyển dụng
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Thêm mới đợt tuyển dụng</DialogTitle>
              <DialogDescription>
                Nhập thông tin về đợt tuyển dụng
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tên *</Label>
                  <Input
                    id="name"
                    value={newCampaign.name}
                    onChange={(e) =>
                      setNewCampaign({ ...newCampaign, name: e.target.value })
                    }
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startTime">Bắt đầu từ: *</Label>
                  <Input
                    id="startTime"
                    type="date"
                    value={newCampaign.startTime.slice(0, 10)}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        startTime: e.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endTime">Kết thúc vào: *</Label>
                  <Input
                    id="endTime"
                    type="date"
                    value={newCampaign.endTime.slice(0, 10)}
                    onChange={(e) =>
                      setNewCampaign({
                        ...newCampaign,
                        endTime: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Mô tả</Label>
                <Textarea
                  id="notes"
                  value={newCampaign.description}
                  onChange={(e) =>
                    setNewCampaign({ ...newCampaign, description: e.target.value })
                  }
                  placeholder="Thêm mô tả về đợt tuyển dụng này..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddDialogOpen(false)}
              >
                Hủy
              </Button>
              <Button
                onClick={handleAddCampaign}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Thêm đợt tuyển dụng
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
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
            {/* <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="applied">Applied</SelectItem>
                  <SelectItem value="screening">Screening</SelectItem>
                  <SelectItem value="interview">Interview</SelectItem>
                  <SelectItem value="hired">Hired</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div> */}
          </div>
        </CardContent>
      </Card>

      {/* Candidates Table */}
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
                  <TableHead>Bắt đầu</TableHead>
                  <TableHead>Kết thúc</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Tạo bởi</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCampaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>
                      {campaign.startTime}
                    </TableCell>
                    <TableCell>
                      {campaign.endTime}
                    </TableCell>
                    <TableCell>{campaign.description}</TableCell>
                    {/* <TableCell>
                      <Badge className={getStatusColor(candidate.status)}>
                        {candidate.status}
                      </Badge>
                    </TableCell> */}
                    <TableCell>{campaign.createdBy}</TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-red-600">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
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
    </div>
  );
}
