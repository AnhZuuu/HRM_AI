"use client"

import { useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Clock, Users, FileText, Calendar } from "lucide-react"

type InterviewStage = {
  stageName: string
  description: string
  order: number | string
  totalTime: number
  departmentModel: any
  interviewTypeModel: any
  id: string
  creationDate: string
  createdById: string | null
  modificationDate: string | null
  modifiedById: string | null
  deletionDate: string | null
  deletedById: string | null
  isDeleted: boolean
}

type InterviewProcessData = {
  interviewStageModels?: InterviewStage[] | null
  departmentId: string
  processName: string
  description: string
  departmentName: string
  countOfStage: number
  id: string
  creationDate: string
  createdById: string | null
  modificationDate: string | null
  modifiedById: string | null
  deletionDate: string | null
  deletedById: string | null
  isDeleted: boolean
}

export function InterviewProcessDetail({ data }: { data: InterviewProcessData }) {
  // normalize + sort (handles string "1" from API)
  const stages: InterviewStage[] = Array.isArray(data?.interviewStageModels) ? data!.interviewStageModels! : []
  const sortedStages = useMemo(
    () => [...stages].filter(Boolean).sort((a, b) => Number(a.order ?? 0) - Number(b.order ?? 0)),
    [stages]
  )

  const getStageIcon = (order: number) => {
    switch (order) {
      case 1:
        return <FileText className="h-5 w-5" />
      case 2:
        return <Users className="h-5 w-5" />
      case 3:
        return <Calendar className="h-5 w-5" />
      default:
        return <Clock className="h-5 w-5" />
    }
  }

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", { year: "numeric", month: "long", day: "numeric" })

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header Section (match liked layout, blue accents) */}
      <div className="text-center space-y-4">
        <h1 className="text-3xl font-bold text-foreground">Chi Tiết Quy Trình Phỏng Vấn</h1>
        {/* <h3 className="text-3xl font-bold text-foreground">Phòng ban: {data.departmentName}</h3> */}

        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-blue-600">{data.processName}</h2>
          <p className="text-muted-foreground">{data.description}</p>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Users className="h-4 w-4" />
              Phòng ban: {data.departmentName}
            </span>
            <span className="flex items-center gap-1">
              <FileText className="h-4 w-4" />
              {Number(data.countOfStage) || 0} vòng phỏng vấn
            </span>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {sortedStages.length === 0 ? (
        <Card className="bg-muted/40">
          <CardHeader>
            <CardTitle className="text-lg">Chưa có vòng phỏng vấn</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Quy trình này hiện chưa có vòng nào hoặc dữ liệu đang trống.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Timeline Progress (like your preferred UI, blue accents) */}
          <div className="relative">
            <div className="flex items-center justify-between mb-8">
              {sortedStages.map((stage, index) => (
                <div key={stage.id ?? index} className="flex flex-col items-center relative">
                  {/* line between nodes */}
                  {index < sortedStages.length - 1 && (
                    <div
                      className="absolute top-6 left-6 h-0.5 bg-border z-0"
                      style={{ width: "calc(100vw / " + sortedStages.length + " - 3rem)" }}
                    />
                  )}
                  {/* node circle */}
                  <div className="relative z-10 w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center font-semibold">
                    {Number(stage.order) || index + 1}
                  </div>
                  <span className="mt-2 text-sm font-medium text-center max-w-20">{stage.stageName}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stage Detail Cards (like preferred UI, blue accents) */}
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {sortedStages.map((stage, idx) => {
              const ord = Number(stage.order) || idx + 1
              return (
                <Card key={stage.id ?? `stage-${idx}`} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-50 text-blue-600">{getStageIcon(ord)}</div>
                        <Badge variant="secondary">Vòng {ord}</Badge>
                      </div>
                    </div>
                    <CardTitle className="text-lg">{stage.stageName}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <CardDescription className="text-sm leading-relaxed">
                      {stage.description || "Chưa có mô tả chi tiết cho vòng phỏng vấn này."}
                    </CardDescription>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Thời gian: {stage.totalTime > 0 ? `${stage.totalTime} phút` : "Chưa xác định"}</span>
                      </div>
                      {stage.creationDate && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Tạo: {formatDate(stage.creationDate)}</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </>
      )}

      {/* Action Buttons (blue primary) */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center pt-6">
        <Button size="lg" className="px-8 bg-blue-600 hover:bg-blue-600/90 text-white">
          <Calendar className="h-4 w-4 mr-2" />
          Lên Lịch Phỏng Vấn
        </Button>
        <Button variant="outline" size="lg" className="px-8 bg-transparent border-blue-600 text-blue-600 hover:bg-blue-50">
          <FileText className="h-4 w-4 mr-2" />
          Xuất Báo Cáo
        </Button>
      </div>

      {/* Process Info (same layout as liked UI) */}
      <Card className="bg-muted/50">
        <CardHeader>
          <CardTitle className="text-lg">Thông Tin Quy Trình</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div>
            <span className="text-sm font-medium text-muted-foreground">ID Quy Trình:</span>
            <p className="text-sm font-mono">{data.id}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Ngày Tạo:</span>
            <p className="text-sm">{data.creationDate ? formatDate(data.creationDate) : "—"}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Phòng Ban:</span>
            <p className="text-sm">{data.departmentName}</p>
          </div>
          <div>
            <span className="text-sm font-medium text-muted-foreground">Tổng Số Vòng:</span>
            <p className="text-sm">{Number(data.countOfStage) || 0} vòng</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
