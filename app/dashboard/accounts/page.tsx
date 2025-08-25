"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Filter, Building2, Plus } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { AccountTable } from "@/components/account/accountTable";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";
import { useRouter } from "next/navigation";

type Department = {
  id: string;
  departmentName: string;
};
const NONE_DEPT = "__none__";

export interface AccountsApiResponse {
  code: number;
  status: boolean;
  message: string;
  data: Account[];
}

export default function AccountPage() {
  const [items, setItems] = useState<Account[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [departments, setDepartments] = useState<Department[]>([]);
  const [depLoading, setDepLoading] = useState(true);
  const [depError, setDepError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setDepLoading(true);
        setDepError(null);
        const res = await authFetch(`${API.DEPARTMENT.BASE}`, {
          signal: ctrl.signal,
        });
        if (!res.ok) throw new Error(`Load departments failed (${res.status})`);
        const payload = await res.json();
        const arr: Department[] = Array.isArray(payload?.data?.data)
          ? payload.data.data
          : Array.isArray(payload?.data)
          ? payload.data
          : Array.isArray(payload)
          ? payload
          : [];
        setDepartments(
          arr.map((d: any) => ({ id: d.id, departmentName: d.departmentName }))
        );
      } catch (e: any) {
        if (!ctrl.signal.aborted)
          setDepError(e?.message ?? "Không thể tải phòng ban");
        setDepartments([]);
      } finally {
        setDepLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        // const res = await authFetch(`${API.ACCOUNT.BASE}?page=${page}&pageSize=${pageSize}`);
        const res = await authFetch(`${API.ACCOUNT.BASE}`);
        if (!res.ok)
          throw new Error(`Failed to fetch accounts (${res.status})`);
        const json: AccountsApiResponse = await res.json();

        const arr = Array.isArray(json?.data) ? json.data : [];
        console.log("data account" + arr);
        setItems(arr);
      } catch (e: any) {
        console.error(e);
        setItems([]);
        setTotalPages(1);
        setError(e?.message ?? "Unknown error");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const base = Array.isArray(items) ? items : [];
    const q = searchTerm.trim().toLowerCase();

    let out = base;

    if (q) {
      out = out.filter(
        (a) =>
          (a.firstName && a.firstName.toLowerCase().includes(q)) ||
          (a.lastName && a.lastName.toLowerCase().includes(q)) ||
          (a.username && a.username.toLowerCase().includes(q)) ||
          (a.email && a.email.toLowerCase().includes(q)) ||
          (a.phoneNumber && a.phoneNumber.toLowerCase().includes(q))
      );
    }

    if (roleFilter !== "all") {
      out = out.filter((a) =>
        a.accountRoles?.some((r) => r.roleName === roleFilter)
      );
    }

    if (deptFilter !== "all") {
      out = out.filter((a) => {
        if (deptFilter === NONE_DEPT) {
          return !a.departmentId; 
        }
        return a.departmentId === deptFilter;
      });
    }

    return out;
  }, [items, searchTerm, roleFilter, deptFilter]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Tài khoản</h1>
          <p className="text-gray-600 mt-1">
            Quản lý các tài khoản trên hệ thống
          </p>
        </div>
        <Button onClick={() => router.push("/dashboard/accounts/create")}>
          <Plus className="h-4 w-4 mr-2" />
          Tạo tài khoản
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Tìm kiếm bởi tên, email, số điện thoại…"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                }}
                className="pl-10"
              />
            </div>
            <Select
              value={roleFilter}
              onValueChange={(v) => {
                setRoleFilter(v);
              }}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Vai trò</SelectItem>
                <SelectItem value="Admin">Admin</SelectItem>
                <SelectItem value="Department Manager">Department Manager</SelectItem>
                <SelectItem value="Employee">Employee</SelectItem>
                <SelectItem value="HR">HR</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deptFilter} onValueChange={(v) => setDeptFilter(v)}>
              <SelectTrigger className="w-[220px]">
                <Building2 className="h-4 w-4 mr-2" />
                <SelectValue placeholder={depLoading ? "Đang tải..." : "Lọc theo phòng ban"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tất cả phòng ban</SelectItem>
                <SelectItem value={NONE_DEPT}>Không thuộc phòng ban</SelectItem>
                {departments.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.departmentName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

          </div>

          {depError && (
            <div className="mt-2 text-xs text-red-600">
              Không thể tải danh sách phòng ban: {depError}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            Tất cả tài khoản{" "}
            {!loading && !error ? (
              <span className="text-gray-500">
                ({filtered.length} / {items.length} tài khoản trong trang này)
              </span>
            ) : null}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="p-6 text-sm text-gray-500">Đang tải…</div>
          ) : error ? (
            <div className="p-6 text-sm text-red-600">Lỗi: {error}</div>
          ) : (
            <AccountTable accounts={filtered} />
          )}

          {!loading && !error && totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-500">
                Trang {page} / {totalPages}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                >
                  Trước
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                >
                  Tiếp
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
