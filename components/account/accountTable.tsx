"use client";

import {
  MoreHorizontal,
  Mail,
  Phone,
  Eye,
  Edit,
  Building2,
  LockKeyhole,
  Lock,
  LockOpen,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { Separator } from "../ui/separator";
import { useEffect, useState } from "react";
import ConfirmBlockDialog from "./handleBlockAccount";
import API from "@/api/api";
import { isAdmin } from "@/lib/auth";

interface AccountTableProps {
  accounts: Account[];
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

function statusBadgeClass(deleted: boolean) {
  return deleted ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700";
}

export function AccountTable({ accounts }: AccountTableProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [target, setTarget] = useState<Account | null>(null);
  const [rows, setRows] = useState<Account[]>(accounts);
  useEffect(() => setRows(accounts), [accounts]);

  const openBlockDialog = (acc: Account) => {
    setTarget(acc);
    setDialogOpen(true);
  };

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên người dùng</TableHead>
            <TableHead>Email / Số điện thoại</TableHead>
            <TableHead>Phòng ban</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="flex items-center gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={a.image || ""} />
                  <AvatarFallback>
                    {a.firstName?.[0]}
                    {a.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div className="font-medium">
                    {a.firstName} {a.lastName}
                  </div>
                  <div className="text-xs text-gray-500">@{a.username}</div>
                </div>
              </TableCell>
              <TableCell>
                {a.phoneNumber ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-3 w-3" />
                    {a.phoneNumber}
                  </div>
                ) : (
                  "—"
                )}
                <div className="flex items-center gap-2 text-xs">
                  <Mail className="h-3 w-3" />
                  {a.email}
                </div>
              </TableCell>
              <TableCell>
                {a.departmentName ? (
                  <div className="flex items-center gap-2 text-sm">
                    <Building2 className="h-3 w-5" />
                    {a.departmentName}
                  </div>
                ) : (
                  "—"
                )}
              </TableCell>
              <TableCell>
                {a.accountRoles?.length
                  ? a.accountRoles.map((r) => (
                      <Badge key={r.id} className="mr-1">
                        {r.roleName}
                      </Badge>
                    ))
                  : "—"}
              </TableCell>
              <TableCell>
                <Badge className={statusBadgeClass(a.isDeleted)}>
                  {a.isDeleted ? "Đã khóa" : "Hoạt động"}
                </Badge>
              </TableCell>
              <TableCell>{formatDate(a.creationDate)}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => router.push(`/dashboard/accounts/${a.id}`)}
                    >
                      <Eye className="mr-2 h-4 w-4" />
                      Chi tiết
                    </DropdownMenuItem>
                    {isAdmin() && (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() =>
                            router.push(`/dashboard/accounts/${a.id}/edit`)
                          }
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Chỉnh sửa
                        </DropdownMenuItem>
                        <Separator/>
                        <DropdownMenuItem
                          onClick={() => openBlockDialog(a)}
                          className={
                            a.isDeleted
                              ? "text-emerald-600 focus:text-emerald-700"
                              : "text-red-600 focus:text-red-700"
                          }
                        >
                          {a.isDeleted ? (
                            <>
                              <LockOpen className="mr-2 h-4 w-4" />
                              <span>Mở khóa tài khoản</span>
                            </>
                          ) : (
                            <>
                              <Lock className="mr-2 h-4 w-4" />
                              <span>Khóa tài khoản</span>
                            </>
                          )}
                      </DropdownMenuItem>
                    </>
                  )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={7}
                className="text-center text-sm text-gray-500 py-8"
              >
                Không tìm thấy tài khoản.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <ConfirmBlockDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        target={
          target ? { id: target.id, username: target.username, isDeleted: target.isDeleted } : null
        }
        apiConfig={{
          url: (id, next) => `${API.ACCOUNT.BASE}/${id}/change-status`,
          method: "PUT",
        }}
        onCompleted={(next) => {
          if (!target) return;
          setRows((prev) =>
            prev.map((x) => (x.id === target.id ? { ...x, isDeleted: next } : x))
          );
          router.refresh();}}
      />
    </div>
  );
}
