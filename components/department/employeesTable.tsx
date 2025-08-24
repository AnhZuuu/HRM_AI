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
import { Button } from "../ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddEmployeesDialog from "./addEmployeesDialog";

const fullName = (e: Employee) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || "—";

export default function EmployeesTable({ items, departmentId, }: { items: Employee[], departmentId: string; }) {
  const [openAdd, setOpenAdd] = useState(false);
  const router = useRouter();

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="mb-3 flex items-center justify-end">
            <Button onClick={() => setOpenAdd(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Nhân viên
            </Button>
          </div>
        <Table>
          <TableCaption>Danh sách nhân sự thuộc phòng ban</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Họ & tên</TableHead>
              <TableHead className="w-[220px]">Email</TableHead>
              <TableHead className="w-[160px]">SĐT</TableHead>
              <TableHead className="w-[120px]">Vai trò</TableHead>
              <TableHead className="w-[220px]">Ngày tạo</TableHead>
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
                  <TableCell className="align-top">{e.roleName ?? "—"}</TableCell>
                  <TableCell className="align-top">
                    {e.creationDate ? new Date(e.creationDate).toLocaleString("vi-VN") : "—"}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        <AddEmployeesDialog
          departmentId={departmentId}
          open={openAdd}
          onOpenChange={setOpenAdd}
          onAdded={() => router.refresh()}
        />

      </CardContent>
    </Card>
  );
}
