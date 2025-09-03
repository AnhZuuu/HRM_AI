import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { formatDMYHM, toMidnight } from "@/app/utils/helper";
import AddPositionDialog from "@/components/campaignPosition/handleAddCampaignPosition";
import CampaignPositions from "@/components/campaignPosition/positionCard";
import { Button } from "@/components/ui/button";
import { isHR } from "@/lib/auth";
import { Plus } from "lucide-react";
import { notFound } from "next/navigation";


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
    cvApplicants?: CVApplicant[];
  }>;
};


// Add this near your mappers
type ApiCvApplicantModel = {
  id: string;
  fileUrl: string;
  fileAlt: string;
  fullName: string | null;
  email: string | null;
  point?: string | null; // "22/100"
  status?: number | string | null;
  campaignPositionId?: string | null;
};

const leadingInt = (s?: string | null): number | null => {
  if (!s) return null;
  const m = /^(\d+)/.exec(s);
  return m ? Number(m[1]) : null;
};

const mapCvApplicantModelToCvApplicant = (m: ApiCvApplicantModel): CVApplicant => ({
  id: String(m.id ?? ""),
  fileUrl: String(m.fileUrl ?? ""),
  fileAlt: String(m.fileAlt ?? ""),
  fullName: m.fullName ?? "",
  email: m.email ?? null,
  // point: leadingInt(m.point),      
  point: typeof m.point === "string" ? m.point : null,
  status: m.status == null ? null : String(m.status),
  campaignPositionId: m.campaignPositionId ?? null,
  campaignPosition: null,
  cvApplicantDetails: [],
  interviewSchedules: [],
});

// ---------- Strong mappers from API -> UI ----------
type ApiCampaign = any; // if you have a DTO, use it instead of 'any'
type ApiCampaignPosition = any;
type ApiCampaignPositionDetail = any;

const mapPositionDetail = (d: ApiCampaignPositionDetail): CampaignPositionDetail => ({
  id: String(d?.id ?? ""),
  campaignPositionId: String(d?.campaignPositionId ?? d?.campaign_position_id ?? ""),
  campaignPosition: null, // avoid circular; fill only when you truly need it
  type: String(d?.type ?? ""),
  key: String(d?.key ?? ""),
  value: String(d?.value ?? ""),
  groupIndex: Number.isFinite(d?.groupIndex) ? Number(d.groupIndex) : 0,
});


//   id: String(p?.id ?? ""),
//   departmentId: String(p?.departmentId ?? p?.department_id ?? ""),
//   campaignId: String(p?.campaignId ?? p?.campaign_id ?? ""),
//   campaign: p?.campaign?.name ?? (typeof p?.campaign === "string" ? p.campaign : null),
//   department: p?.department?.name ?? (typeof p?.department === "string" ? p.department : null),
//   createdBy: p?.createdBy ?? p?.createdById ?? null,
//   totalSlot: Number.isFinite(p?.totalSlot) ? Number(p.totalSlot) : 0,
//   description: typeof p?.description === "string" ? p.description : "",
//   cvApplicants: Array.isArray(p?.cvApplicants) ? p.cvApplicants : undefined, // keep your existing CVApplicant[] type
// });
const mapPosition = (p: ApiCampaignPosition): CampaignPosition => ({
  id: String(p?.id ?? ""),
  departmentId: String(p?.departmentId ?? p?.department_id ?? ""),
  campaignId: String(p?.campaignId ?? p?.campaign_id ?? ""),
  campaign: p?.campaign?.name ?? (typeof p?.campaign === "string" ? p.campaign : null),

  // ← important: prefer API's departmentName, then nested object, then your string
  department:
    (p as any).departmentName ??
    p?.department?.name ??
    (typeof p?.department === "string" ? p.department : null),

  createdBy: p?.createdBy ?? p?.createdById ?? null,
  totalSlot: Number.isFinite(p?.totalSlot) ? Number(p.totalSlot) : 0,
  description: typeof p?.description === "string" ? p.description : "",

  // ← important: project cvApplicantModels into your CVApplicant[]
  cvApplicants: Array.isArray((p as any).cvApplicantModels)
    ? ((p as any).cvApplicantModels as ApiCvApplicantModel[]).map(mapCvApplicantModelToCvApplicant)
    : (Array.isArray(p?.cvApplicants) ? p.cvApplicants : []),
});

const mapPositionModel = (p: ApiCampaignPosition): CampaignPositionModel => ({
  id: String(p?.id ?? ""),
  departmentId: String(p?.departmentId ?? p?.department_id ?? ""),
  campaignId: String(p?.campaignId ?? p?.campaign_id ?? ""),
  departmentName:
    p?.department?.name ??
    p?.departmentName ??
    (typeof p?.department === "string" ? p.department : ""),
  totalSlot: Number.isFinite(p?.totalSlot) ? Number(p.totalSlot) : 0,
  description: typeof p?.description === "string" ? p.description : null,
  campaignPositionDetail: Array.isArray(p?.campaignPositionDetails)
    ? (p.campaignPositionDetails as ApiCampaignPositionDetail[]).map(mapPositionDetail)
    : null,
});

const mapFromApi = (c: ApiCampaign): CampaignWithPositions => {
  const start = c?.startTime ?? c?.starTime; // tolerate backend typo
  const end = c?.endTime;

  if (!start || !end) throw new Error("Invalid campaign payload: missing start/end time");

  const rawPositions: ApiCampaignPosition[] = Array.isArray(c?.campaignPositions)
    ? c.campaignPositions
    : [];

  // If you want Campaign.campaignPosition to be CampaignPosition[] (not the *Model*),
  // map with mapPosition. If you prefer the richer *Model*, swap to mapPositionModel below.
  const positions: CampaignPosition[] = rawPositions.map(mapPosition);

  return {
    id: String(c?.id ?? ""),
    name: String(c?.name ?? ""),
    startTime: String(start),
    endTime: String(end),
    description: typeof c?.description === "string" ? c.description : "",
    createdBy: c?.createdBy ?? c?.createdById ?? null,
    createdByName: typeof c?.createdByName === "string" ? c.createdByName : null,
    campaignPosition: positions,
  };
};

export default async function CampaignDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
  // params: { id: string };
}) {
  const { id } = await params;
  //await

  const res = await authFetch(`${API.CAMPAIGN.BASE}/${id}`, {
    cache: "no-store",
  });

  console.log("Fetched campaign data detail:", res);

  if (res.status === 404) return notFound();
  if (!res.ok) return notFound();

  const json = await res.json();
  const entity = json?.data;
  if (!entity) return notFound();

  const campaign = mapFromApi(entity);

  const status = getCampaignStatus(campaign.startTime, campaign.endTime);
  const { className, message } = getStatusTone(status);
  const showAddPosition =
  message === "Kết thúc";
    // message === "Đợt tuyển dụng chưa bắt đầu" ||
    // message === "Đang diễn ra";


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

          { !showAddPosition && (   // only HR sees the button
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
