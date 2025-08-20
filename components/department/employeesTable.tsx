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
import type { Employee } from "@/app/dashboard/departments/[id]/page";

const fullName = (e: Employee) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || "—";

export default function EmployeesTable({ items }: { items: Employee[] }) {
  return (
    <Card>
      <CardContent className="pt-6">
        <Table>
          <TableCaption>Danh sách nhân sự thuộc phòng ban</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>Họ & tên</TableHead>
              <TableHead className="w-[220px]">Email</TableHead>
              <TableHead className="w-[160px]">SĐT</TableHead>
              <TableHead className="w-[120px]">Trạng thái</TableHead>
              <TableHead className="w-[220px]">Ngày tạo</TableHead>
              <TableHead className="w-[260px]">ID</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-sm text-muted-foreground">
                  Chưa có nhân sự.
                </TableCell>
              </TableRow>
            ) : (
              items.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="align-top">{fullName(e)}</TableCell>
                  <TableCell className="align-top">{e.email ?? "—"}</TableCell>
                  <TableCell className="align-top">{e.phoneNumber ?? "—"}</TableCell>
                  <TableCell className="align-top">{e.status ?? "—"}</TableCell>
                  <TableCell className="align-top">
                    {e.creationDate ? new Date(e.creationDate).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                  <TableCell className="align-top font-mono text-xs">{e.id}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
