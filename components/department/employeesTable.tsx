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
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import AddEmployeesDialog from "./addEmployeesDialog";

/* If you already export AccountRole elsewhere, import it instead of re-declaring.
   This interface matches your backend screenshots. */
interface AccountRole {
  id: string;
  totalReputation?: number;
  status?: number | null; // 0 = active in your data
  role?: number;          // numeric enum fallback
  roleName?: string;      // readable name
}

/* Your Employee type likely already has accountRoles: AccountRole[].
   This extension is just to be safe and to allow legacy roleName fallback. */
type EmployeeRow = Employee & {
  accountRoles?: AccountRole[];
  roleName?: string | null;
};

const ROLE_NAME_BY_ID: Record<number, string> = {
  1: "HR",
  2: "Department Manager",
  3: "Employee",
  4: "Admin",
};

/* Map a role label to a colored badge class (Tailwind).
   Tweak colors to your taste; these mirror your AccountTable look & feel. */
function roleBadgeClass(name: string) {
  switch (name) {
    case "Admin":
      return "bg-red-100 text-red-700";
    case "Department Manager":
      return "bg-violet-100 text-violet-700";
    case "HR":
      return "bg-indigo-100 text-indigo-700";
    case "Employee":
    default:
      return "bg-slate-100 text-slate-700";
  }
}

const fullName = (e: EmployeeRow) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() || "—";

/** Build final list of role labels to render as badges.
 *  - Prefer active roles (status === 0); if none, show all roles.
 *  - Prefer r.roleName; fallback to mapping numeric r.role.
 *  - If nothing, fallback to legacy e.roleName or "—".
 */
function getRoleLabels(e: EmployeeRow): string[] {
  const roles = e.accountRoles ?? [];
  if (roles.length === 0) return e.roleName ? [e.roleName] : [];

  const active = roles.filter((r) => r?.status === 0);
  const src = active.length ? active : roles;

  const names = src
    .map((r) => r.roleName || (r.role ? ROLE_NAME_BY_ID[r.role] : undefined))
    .filter((x): x is string => Boolean(x));

  return names;
}

export default function EmployeesTable({
  items,
  departmentId,
}: {
  items: EmployeeRow[];
  departmentId: string;
}) {
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
              <TableHead className="w-[160px]">Vai trò</TableHead>
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
              items.map((e) => {
                const roleLabels = getRoleLabels(e);

                return (
                  <TableRow key={e.id}>
                    <TableCell className="align-top">{fullName(e)}</TableCell>
                    <TableCell className="align-top">{e.email ?? "—"}</TableCell>
                    <TableCell className="align-top">{e.phoneNumber ?? "—"}</TableCell>

                    {/* Colored role badges (supports multiple roles) */}
                    <TableCell className="align-top">
                      {roleLabels.length ? (
                        <div className="flex flex-wrap gap-1">
                          {roleLabels.map((label, idx) => (
                            <Badge key={`${e.id}-${label}-${idx}`} className={roleBadgeClass(label)}>
                              {label}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        "—"
                      )}
                    </TableCell>

                    <TableCell className="align-top">
                      {e.creationDate ? new Date(e.creationDate).toLocaleString("vi-VN") : "—"}
                    </TableCell>
                  </TableRow>
                );
              })
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
