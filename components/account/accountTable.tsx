"use client";

import { MoreHorizontal, Mail, Phone, Eye, Copy } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
import { useToast } from "@/components/ui/use-toast";

interface AccountTableProps {
  accounts: Account[];
}

function formatDate(date: string | null) {
  if (!date) return "—";
  return new Date(date).toLocaleDateString();
}

function statusBadgeClass(deleted: boolean) {
  return deleted
    ? "bg-red-100 text-red-700"
    : "bg-green-100 text-green-700";
}

export function AccountTable({ accounts }: AccountTableProps) {
  const router = useRouter();
  const { toast } = useToast();

  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tên người dùng</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Số điện thoại</TableHead>
            <TableHead>Vai trò</TableHead>
            <TableHead>Trạng thái</TableHead>
            <TableHead>Ngày tạo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {accounts.map((a) => (
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
                  <div className="font-medium">{a.firstName} {a.lastName}</div>
                  <div className="text-xs text-gray-500">@{a.username}</div>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="h-3 w-3" />
                  {a.email}
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
              </TableCell>
              <TableCell>
                {a.accountRoles?.length ? (
                  a.accountRoles.map((r) => (
                    <Badge key={r.id} className="mr-1">
                      {r.roleName}
                    </Badge>
                  ))
                ) : (
                  "—"
                )}
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
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() =>
                        navigator.clipboard.writeText(a.id).then(() =>
                          toast({ title: "Copied ID" })
                        )
                      }
                    >
                      <Copy className="mr-2 h-4 w-4" />
                      Lưu ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
          {accounts.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-sm text-gray-500 py-8">
                Không tìm thấy tài khoản.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
