"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Briefcase,
  Calendar as CalendarIcon,
  CheckCircle2,
  Loader2,
  AlertCircle,
  X,
} from "lucide-react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import SuggestSchedulesPage from "./result/page";
// import SuggestSchedulesPage from "@/components/scheduling/SuggestSchedulesPage";

/* Types */
interface CampaignPosition {
  id: string;
  departmentId: string;
  campaignId: string;
  departmentName: string;
  campaignName: string;
  description: string;
  createdByName: string | null;
  totalSlot: number;
  totalSlotOnBoard: number | null;
}

/* Helper: Date -> ISO midnight UTC */
function toISOStartOfDayUTC(d: Date): string {
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

export default function CampaignPositionsPage() {
  const router = useRouter();

  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [campaignPositions, setCampaignPositions] = useState<CampaignPosition[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // date picking
  const [selectedDates, setSelectedDates] = useState<string[]>([]);
  const [inputDate, setInputDate] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function fetchPositions() {
      setLoading(true);
      try {
        const res = await authFetch(API.CAMPAIGN.POSITION);
        const json = await res.json().catch(() => ({}));
        const items: CampaignPosition[] = json?.data?.data ?? [];
        if (!cancelled) setCampaignPositions(items);
      } catch (err: any) {
        if (!cancelled) setErrorMsg(err?.message || "Không thể tải dữ liệu.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    fetchPositions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleAddDate = () => {
    if (inputDate && !selectedDates.includes(inputDate)) {
      setSelectedDates([...selectedDates, inputDate]);
    }
    setInputDate("");
  };

  const handleRemoveDate = (date: string) => {
    setSelectedDates(selectedDates.filter((d) => d !== date));
  };

  const dateTimes: string[] = useMemo(() => {
    return selectedDates.map((ds) => {
      const [y, m, d] = ds.split("-").map(Number);
      return toISOStartOfDayUTC(new Date(y, m - 1, d));
    });
  }, [selectedDates]);

  const handleConfirm = () => {
    if (!selectedPosition || dateTimes.length === 0) return;

    const params = new URLSearchParams();
    params.set("positionId", selectedPosition);
    dateTimes.forEach((dt) => params.append("dateTimes", dt));

    router.push(`/dashboard/schedules/new/suggest/result?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Chọn Vị Trí Ứng Tuyển</h1>

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải dữ liệu vị trí…</span>
          </div>
        )}
        {errorMsg && (
          <div className="flex items-center gap-2 text-destructive mb-6">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Positions list */}
        <div className="grid gap-4 mb-6">
          {!loading &&
            campaignPositions.map((pos) => (
              <Card
                key={pos.id}
                className={`cursor-pointer ${
                  selectedPosition === pos.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => setSelectedPosition(pos.id)}
              >
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    {pos.description}
                    {selectedPosition === pos.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary ml-2" />
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Phòng ban: {pos.departmentName} | Chiến dịch: {pos.campaignName}
                  </p>
                </CardContent>
              </Card>
            ))}
        </div>

        {/* Date selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Chọn ngày phỏng vấn
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={inputDate}
                onChange={(e) => setInputDate(e.target.value)}
                className="border rounded px-2 py-1"
              />
              <Button type="button" onClick={handleAddDate}>
                Thêm
              </Button>
            </div>
            {selectedDates.length > 0 && (
              <ul className="mt-3 space-y-1">
                {selectedDates.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm">
                    <Badge>{d}</Badge>
                    <Button
                      type="button"
                      size="icon"
                      variant="ghost"
                      onClick={() => handleRemoveDate(d)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Confirm button */}
        {/* <div className="flex justify-end mb-8">
          <Button
            onClick={handleConfirm}
            disabled={!selectedPosition || dateTimes.length === 0}
            size="lg"
            className="min-w-32"
          >
            Xác Nhận
          </Button>
        </div> */}

        {/* Inline preview of suggested schedules if you want */}
        {selectedPosition && dateTimes.length > 0 && (
          <div className="mt-8">
            <h2 className="text-xl font-semibold mb-3">Đề xuất lịch phỏng vấn</h2>
            <SuggestSchedulesPage positionId={selectedPosition} dateTimes={dateTimes} />
          </div>
        )}
      </div>
    </div>
  );
}
