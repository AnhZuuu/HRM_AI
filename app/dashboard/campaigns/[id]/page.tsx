import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { formatDMYHM } from "@/app/utils/helper";
import AddPositionDialog from "@/components/campaignPosition/handleAddCampaignPosition";
import CampaignPositions from "@/components/campaignPosition/positionCard";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";

// Helpers kept same as your list page for consistent logic
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
    return { className: "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm bg-red-100 text-red-700", message: "Đợt tuyển dụng đã kết thúc" };
  }
  if (status === "Sắp bắt đầu") {
    return { className: "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm bg-yellow-100 text-yellow-700", message: "Đợt tuyển dụng chưa bắt đầu" };
  }
  const num = Number(status.match(/\d+/)?.[0] ?? "999");
  if (num <= 2) {
    return { className: "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm bg-orange-100 text-orange-700", message: "Sắp kết thúc" };
  }
  return { className: "inline-flex items-center rounded-full px-3 py-1 text-sm font-semibold shadow-sm bg-green-100 text-green-700", message: "Đang diễn ra" };
}


type CampaignWithPositions = Campaign & {
  campaignPosition?: Array<{
    id: string;
    departmentId?: string | null;
    campaignId?: string | null;
    campaign?: string | null;
    department?: string | null;
    createdBy?: string | null;
    totalSlot?: number | null;
    description?: string | null;
  }>;
};

// Map API -> UI
const mapFromApi = (c: any): CampaignWithPositions => ({
  id: c.id,
  name: c.name,
  startTime: c.startTime ?? c.starTime, 
  endTime: c.endTime,
  description: c.description,
  createdBy: c.createdById ?? null,
  campaignPosition: (c.campaignPositions ?? []).map((p: any) => ({
    id: p.id,
    departmentId: p.departmentId ?? null,
    campaignId: p.campaignId ?? null,
    campaign: p.campaign?.name ?? null,
    department: p.department?.name ?? null,
    createdBy: p.createdById ?? null,
    totalSlot: p.totalSlot ?? null,
    description: p.description ?? null,
  })),
});

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
  // params: { id: string };
}) {
  const { id } =  await params;
  //await

  const res = await authFetch(`${API.CAMPAIGN.BASE}/${id}`, {
    cache: "no-store",
  });

  if (res.status === 404) return notFound();
  if (!res.ok) return notFound();

  const json = await res.json();
  const entity = json?.data;
  if (!entity) return notFound();

  const campaign = mapFromApi(entity);

  const status = getCampaignStatus(campaign.startTime, campaign.endTime);
  const { className, message } = getStatusTone(status);
  const showAddPosition =
    message === "Đợt tuyển dụng chưa bắt đầu" ||
    message === "Đang diễn ra";


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
            Từ {formatDMYHM(campaign.startTime)} • Đến {formatDMYHM(campaign.endTime)}
          </p>
        </div>

        {/* Right side: status + optional button */}
        <div className="flex flex-col items-end gap-3">   {/* changed: vertical stack */}
          <div className={className}>
            {status} – {message}
          </div>

          {showAddPosition && (
            <AddPositionDialog campaignId={campaign.id} />
          )}
        </div>
      </div>

      {/* Position cards */}
      <CampaignPositions
        positions={campaign.campaignPosition ?? []}
        campaignStatus={status}
      />
    </div>
  );
}
