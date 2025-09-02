"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus } from "lucide-react";

import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api"; 

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

type InterviewTypeDto = {
  code: string;
  name: string;
  description: string | null;
  id: string;
  creationDate?: string;
  createdById?: string | null;
  modificationDate?: string | null;
  modifiedById?: string | null;
  deletionDate?: string | null;
  deletedById?: string | null;
  isDeleted?: boolean;
};

type Row = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

async function fetchInterviewTypes(): Promise<Row[]> {
  const base =
    (API as any)?.BASE_URL ??
    (API as any)?.API_BASE_URL ??
    process.env.NEXT_PUBLIC_API_BASE_URL;

  if (!base) {
    throw new Error("API base URL is not configured.");
  }

  const url = `${base}/interview-types`;

  const doFetch: typeof fetch =
    typeof authFetch === "function" ? (authFetch as any) : fetch;

  const res = await doFetch(url, { method: "GET", cache: "no-store" });
  const text = await res.text();
  const json: ApiEnvelope<InterviewTypeDto[]> = text ? JSON.parse(text) : ({} as any);

  if (!res.ok || !json?.status) {
    const msg = json?.message || `Failed to load interview types (${res.status})`;
    throw new Error(msg);
  }

  const items = Array.isArray(json.data) ? json.data : [];
  return items.map((x) => ({
    id: x.id,
    code: x.code,
    name: x.name,
    description: x.description ?? null,
  }));
}

export default function InterviewTypesListPage() {
  const [items, setItems] = useState<Row[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  const reload = async () => {
    try {
      setErr(null);
      setLoading(true);
      const data = await fetchInterviewTypes();
      setItems(data);
    } catch (e: any) {
      setErr(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    reload();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter((x) => {
      const code = x.code?.toLowerCase() ?? "";
      const name = x.name?.toLowerCase() ?? "";
      const desc = x.description?.toLowerCase() ?? "";
      const id = x.id?.toLowerCase() ?? "";
      return (
        id.includes(s) ||
        code.includes(s) ||
        name.includes(s) ||
        desc.includes(s)
      );
    });
  }, [items, q]);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loại phỏng vấn</h1>
          <p className="text-gray-600 mt-1">Quản lý các loại phỏng vấn.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/interviewTypes/new">
            <Plus className="h-4 w-4 mr-2" />
            Tạo loại mới
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm kiếm bằng code, tên, mô tả"
              className="pl-9 h-10 rounded-full border-gray-200 focus-visible:ring-0 focus-visible:ring-offset-0 shadow-sm"
            />
            {!!q && (
              <button
                onClick={() => setQ("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2"
                aria-label="Clear"
              >
                ✕
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-gray-500">Đang tải…</p>
          ) : err ? (
            <div className="text-red-600">Lỗi tải dữ liệu: {err}</div>
          ) : filtered.length === 0 ? (
            <p className="text-gray-500">Chưa có loại phỏng vấn nào.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500">
                    <th className="py-2 pr-4">Code</th>
                    <th className="py-2 pr-4">Tên</th>
                    <th className="py-2 pr-4">Mô tả</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <tr key={row.id} className="border-top">
                      <td className="py-2 pr-4 font-mono">{row.code}</td>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4">{row.description ?? "—"}</td>   
                      <td className="py-2 pr-4">
                        <Button asChild variant="outline" size="sm">
                          <Link href={`/dashboard/interviewTypes/${row.id}/edit`}>Chỉnh sửa</Link>
                        </Button>
                      </td>                   
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
