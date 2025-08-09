import CampaignPositions from "@/components/campaignPosition/positionCard";
import { notFound } from "next/navigation";

const campaignsData: Campaign[] = [
  {
    id: "1",
    name: "đợt 1",
    startTime: "2024-01-14",
    endTime: "2025-08-30",
    description: "Tuyển dụng nhiều vị trí cho đợt 1.",
    createdBy: "123",
    campaignPosition: [
      {
        id: "12",
        departmentId: "dep-01",
        campaignId: "1",
        campaign: "dot 1",
        department: "department 1",
        createdBy: "123",
        totalSlot: 10,
        description:
          "Vị trí Nhân viên Kinh doanh phụ trách khu vực miền Trung.",
        // cvApplicants: [
        //   { fullName: "Nguyễn A" },
        //   { fullName: "Trần B" },
        //   { fullName: "Lê C" },
        // ],
      },
      {
        id: "13",
        departmentId: "dep-02",
        campaignId: "1",
        campaign: "dot 1",
        department: "department 1",
        createdBy: "123",
        totalSlot: 1,
        description: "Vị trí Lập trình viên Frontend (React/Next.js).",
        // cvApplicants: [{ fullName: "Nguyễn A" }],
      },
    ],
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

function toMidnight(d: string | Date) {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}
function getCampaignStatus(start: string, end: string, today = new Date()) {
  const dToday = toMidnight(today);
  const dStart = toMidnight(start);
  const dEnd = toMidnight(end);

  if (dToday < dStart) return "Sắp bắt đầu";
  if (dToday > dEnd) return "Kết thúc";

  const msPerDay = 24 * 60 * 60 * 1000;
  const daysLeft = Math.round((dEnd.getTime() - dToday.getTime()) / msPerDay);
  if (daysLeft === 0) return "Kết thúc hôm nay";
  return `Còn ${daysLeft} ngày`;
}

function getStatusTone(status: string) {
  if (status === "Kết thúc" || status === "Kết thúc hôm nay") {
    return {
      className: "bg-red-100 text-red-700",
      message: "Đợt tuyển dụng đã kết thúc",
    };
  }
  if (status === "Sắp bắt đầu") {
    return {
      className: "bg-yellow-100 text-yellow-700",
      message: "Đợt tuyển dụng chưa bắt đầu",
    };
  }
  const num = Number(status.match(/\d+/)?.[0] ?? "999");
  if (num <= 2) {
    return {
      className: "bg-orange-100 text-orange-700",
      message: "Sắp kết thúc",
    };
  }
  return {
    className: "bg-green-100 text-green-700",
    message: "Đang diễn ra",
  };
}

function getPositionStatus(campaignStatus: string, pos: CampaignPosition) {
  if (campaignStatus === "Kết thúc" || campaignStatus === "Kết thúc hôm nay")
    return { label: "Đóng", tone: "bg-zinc-100 text-zinc-700" };
  const applied = pos.cvApplicants?.length ?? 0;
  if (applied >= pos.totalSlot)
    return { label: "Đóng", tone: "bg-red-100 text-red-700" };
  return { label: "Mở", tone: "bg-emerald-100 text-emerald-700" };
}

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Replace with your real fetch:
  const { id } = await params;
  const campaign = campaignsData.find((c) => c.id === id);
  if (!campaign) return notFound();

  const status = getCampaignStatus(campaign.startTime, campaign.endTime);
  const { className, message } = getStatusTone(status);

  return (
    <div className="p-6 space-y-6">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
          <p className="text-muted-foreground">
            {campaign.description || "Không có mô tả."}
          </p>
          <p className="text-sm text-muted-foreground">
            Từ {campaign.startTime} • Đến {campaign.endTime}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={className}>
            {status} – {message}
          </span>
        </div>
      </div>

      <CampaignPositions
        positions={campaign.campaignPosition ?? []}
        campaignStatus={status}
      />
    </div>
  );
}
