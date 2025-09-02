"use client";

import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
  TableCaption,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import type { CampaignPositionModel } from "@/app/dashboard/departments/[id]/page";

export default function PositionsTable({ items }: { items: CampaignPositionModel[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableCaption>Danh sách vị trí trong phòng ban</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Mô tả</TableHead>
              <TableHead className="w-[100px]">Tổng slot</TableHead>
              <TableHead>Tiêu chí / Chi tiết</TableHead>
              <TableHead className="w-[220px]">Ngày tạo</TableHead>
              {/* <TableHead className="w-[260px]">ID</TableHead> */}
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  Chưa có vị trí.
                </TableCell>
              </TableRow>
            ) : (
              items.map((p) => (
                <TableRow key={p.id}>
                  <TableCell className="align-top">{p.description ?? "—"}</TableCell>
                  <TableCell className="align-top">{p.totalSlot ?? 0}</TableCell>
                  <TableCell className="align-top">
                    {p.campaignPositionDetailModels?.length ? (
                      <ul className="list-disc pl-5 space-y-1">
                        {p.campaignPositionDetailModels.map((d) => (
                          <li key={d.id}>
                            <span className="font-medium">{d.type ?? "Tiêu chí"}:</span>{" "}
                            {d.key ?? "—"} — {d.value ?? "—"}
                            {/* {typeof d.groupIndex === "number" ? (
                              <span className="text-muted-foreground"> (Nhóm {d.groupIndex})</span>
                            ) : null} */}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <span className="text-muted-foreground">Không có chi tiết</span>
                    )}
                  </TableCell>
                  <TableCell className="align-top">
                    {p.creationDate ? new Date(p.creationDate).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  {/* <TableCell className="align-top font-mono text-xs">{p.id}</TableCell> */}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
