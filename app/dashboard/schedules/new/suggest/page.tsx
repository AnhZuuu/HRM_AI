"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Users,
  Calendar,
  Briefcase,
  ChevronDown,
  ChevronUp,
  User as UserIcon,
  Hash,
  ListChecks,
  Loader2,
  AlertCircle,
} from "lucide-react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";

type CampaignPositionDetailModel = {
  campaignPositionId: string;
  type: string | null;
  key: string | null;
  value: string | null;
  groupIndex: number | null;
  id: string;
  creationDate: string | null;
  createdById: string | null;
  modificationDate: string | null;
  modifiedById: string | null;
  deletionDate: string | null;
  deletedById: string | null;
  isDeleted: boolean;
};

interface CampaignPosition {
  departmentId: string;
  campaignId: string;
  departmentName: string;
  campaignName: string;
  createdByName: string | null;
  totalSlot: number;
  totalSlotOnBoard: number | null;
  description: string;
  campaignPositionDetailModels?: CampaignPositionDetailModel[] | null;
  id: string;
}

export default function CampaignPositionsPage() {
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);
  const [campaignPositions, setCampaignPositions] = useState<CampaignPosition[]>([]);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchPositions() {
      setLoading(true);
      setErrorMsg(null);
      try {
        const res = await authFetch(API.CAMPAIGN.POSITION);

        let json: any = null;
        try {
          json = await res.json();
        } catch {
          throw new Error("Phản hồi không hợp lệ từ máy chủ.");
        }

        const items: CampaignPosition[] = json?.data?.data ?? [];
        if (!cancelled) {
          setCampaignPositions(items);
        }
      } catch (err: any) {
        if (!cancelled) {
          setErrorMsg(err?.message || "Không thể tải dữ liệu. Vui lòng thử lại.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchPositions();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectPosition = (positionId: string) => {
    setSelectedPosition(positionId);
  };

  const toggleExpanded = (positionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedCards((prev) => {
      const next = new Set(prev);
      if (next.has(positionId)) next.delete(positionId);
      else next.add(positionId);
      return next;
    });
  };

  const handleNextAction = () => {
    if (selectedPosition) {
      const picked = campaignPositions.find((p) => p.id === selectedPosition);
      console.log("Selected position:", picked);
      alert(`Đã chọn vị trí: ${picked?.description ?? "—"}`);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Chọn Vị Trí Ứng Tuyển</h1>
          <p className="text-muted-foreground">
            Vui lòng chọn một vị trí để tiếp tục thực hiện các hành động khác
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground mb-6">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Đang tải dữ liệu vị trí ứng tuyển…</span>
          </div>
        )}

        {/* Error */}
        {!loading && errorMsg && (
          <div className="flex items-center gap-2 text-destructive mb-6">
            <AlertCircle className="h-5 w-5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Empty */}
        {!loading && !errorMsg && campaignPositions.length === 0 && (
          <Card className="mb-6">
            <CardContent className="py-8 text-center text-muted-foreground">
              Không có vị trí ứng tuyển nào tìm thấy.
            </CardContent>
          </Card>
        )}

        {/* List */}
        <div className="grid gap-4 mb-6">
          {!loading &&
            !errorMsg &&
            campaignPositions.map((position) => {
              const isExpanded = expandedCards.has(position.id);

              return (
                <Card
                  key={position.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                    selectedPosition === position.id
                      ? "ring-2 ring-primary border-primary bg-primary/5"
                      : "hover:border-primary/50"
                  }`}
                  onClick={() => handleSelectPosition(position.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Briefcase className="h-5 w-5 text-primary" />
                          Vị trí ứng tuyển: {position.description}
                        </CardTitle>
                      </div>
                      <div className="flex items-center gap-2">
                        {selectedPosition === position.id && (
                          <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0" />
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => toggleExpanded(position.id, e)}
                          className="h-8 w-8 p-0"
                          aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                        >
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>Phòng ban: {position.departmentName}</span>
                    </div>

                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Đợt tuyển dụng: {position.campaignName}</span>
                    </div>

                    {isExpanded && (
                      <div className="pt-3 border-t border-border space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-4 w-4" />
                            <span>ID Phòng ban: {position.departmentId}</span>
                          </div>
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <Hash className="h-4 w-4" />
                            <span>ID Chiến dịch: {position.campaignId}</span>
                          </div>
                          {position.createdByName && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <UserIcon className="h-4 w-4" />
                              <span>Tạo bởi: {position.createdByName}</span>
                            </div>
                          )}
                          {position.totalSlotOnBoard !== null && (
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>Đã tuyển: {position.totalSlotOnBoard}</span>
                            </div>
                          )}
                        </div>

                        {/* Details list */}
                        <div className="mt-2">
                          <div className="flex items-center gap-2 mb-2">
                            <ListChecks className="h-4 w-4 text-primary" />
                            <span className="text-sm font-medium">Tiêu chí vị trí</span>
                          </div>

                          {position.campaignPositionDetailModels &&
                          position.campaignPositionDetailModels.length > 0 ? (
                            <div className="rounded-lg border border-border">
                              <div className="grid grid-cols-12 text-xs uppercase text-muted-foreground px-3 py-2">
                                <div className="col-span-3">Loại</div>
                                <div className="col-span-4">Tiêu chí</div>
                                <div className="col-span-4">Giá trị</div>
                                <div className="col-span-1 text-right">Nhóm</div>
                              </div>
                              <div className="divide-y">
                                {position.campaignPositionDetailModels.map((d) => (
                                  <div
                                    key={d.id}
                                    className="grid grid-cols-12 px-3 py-2 text-sm"
                                  >
                                    <div className="col-span-3 truncate">
                                      {d.type ?? "—"}
                                    </div>
                                    <div className="col-span-4 truncate">
                                      {d.key ?? "—"}
                                    </div>
                                    <div className="col-span-4 truncate">
                                      {d.value ?? "—"}
                                    </div>
                                    <div className="col-span-1 text-right">
                                      {d.groupIndex ?? "—"}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              Chưa có tiêu chí cho vị trí này.
                            </p>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Badge variant="secondary" className="text-xs">
                        Số lượng: {position.totalSlot} vị trí
                      </Badge>
                      {selectedPosition === position.id && (
                        <Badge variant="default" className="text-xs">
                          Đã chọn
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>

        <div className="flex justify-end">
          <Button
            onClick={handleNextAction}
            disabled={!selectedPosition}
            size="lg"
            className="min-w-32"
          >
            Tiếp tục
          </Button>
        </div>
      </div>
    </div>
  );
}
