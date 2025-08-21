"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import type {
  DepartmentDetail,
  CampaignPositionModel,
  Employee,
  InterviewProcessModel
} from "@/app/dashboard/departments/[id]/page";
import PositionsTable from "./positionTable";
import EmployeesTable from "./employeesTable";
import InterviewProcessTable from "./interviewProcessTable";


export default function DepartmentDetailClient({ dept }: { dept: DepartmentDetail }) {
  const positions = (dept.campaignPositionModels ?? []) as CampaignPositionModel[];
  const employees = (dept.employees ?? []) as Employee[];
  const processes = (dept.interviewProcessModels ?? []) as InterviewProcessModel[];

  return (
    <div className="p-6 space-y-6">
      {/* Card thông tin phòng ban giữ nguyên */}
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            Phòng ban: {dept.departmentName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="secondary" className="rounded-md">Mã: {dept.code}</Badge>
            <Badge variant="outline" className="rounded-md">Vị trí: {dept.numOfCampaignPosition}</Badge>
            <Badge variant="outline" className="rounded-md">Nhân sự: {dept.numOfEmployee}</Badge>
            {dept.isDeleted ? <Badge variant="destructive">Đã xóa</Badge> : null}
          </div>

          {dept.description ? (
            <>
              <Separator />
              <p className="text-sm text-muted-foreground">{dept.description}</p>
            </>
          ) : null}

          <div className="text-xs text-muted-foreground">
            ID: <span className="font-mono">{dept.id}</span>
            {" • "}
            Tạo lúc: {dept.creationDate ? new Date(dept.creationDate).toLocaleString("vi-VN") : "—"}
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="positions" className="w-full">
        <TabsList>
          <TabsTrigger value="positions">Vị trí ({positions.length})</TabsTrigger>
          <TabsTrigger value="employees">Nhân sự ({employees.length})</TabsTrigger>
          <TabsTrigger value="interview-process">Quy trình phỏng vấn ({processes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="positions" className="mt-4">
          <PositionsTable items={positions} />
        </TabsContent>

        <TabsContent value="employees" className="mt-4">
          <EmployeesTable items={employees} />
        </TabsContent>

        <TabsContent value="interview-process" className="mt-4">
          <InterviewProcessTable items={processes} />
        </TabsContent>
      </Tabs>
    </div>
  );
}