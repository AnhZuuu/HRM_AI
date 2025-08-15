"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, Plus, Trash2, Edit3 } from "lucide-react";
import {
  listInterviewTypes, seedInterviewTypesIfEmpty,
  deleteInterviewType, countSchedulesUsingTypeIdOrCode,
  InterviewTypeRecord
} from "@/components/interviewType/interviewTypeRepo";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger
} from "@/components/ui/alert-dialog";

export default function InterviewTypesListPage() {
  const [items, setItems] = useState<InterviewTypeRecord[]>([]);
  const [q, setQ] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [inUseCount, setInUseCount] = useState(0);

  const reload = async () => setItems(await listInterviewTypes());

  useEffect(() => {
    (async () => {
      await seedInterviewTypesIfEmpty();
      await reload();
    })();
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    if (!s) return items;
    return items.filter(x =>
      x.id.toLowerCase().includes(s) ||
      x.code.toLowerCase().includes(s) ||
      x.name.toLowerCase().includes(s) ||
      (x.description ?? "").toLowerCase().includes(s)
    );
  }, [items, q]);

  const askDelete = async (id: string) => {
    setDeletingId(id);
    setInUseCount(await countSchedulesUsingTypeIdOrCode(id));
  };

  const confirmDelete = async () => {
    if (!deletingId || inUseCount > 0) return;
    await deleteInterviewType(deletingId);
    setDeletingId(null);
    await reload();
  };

  const deleting = items.find(x => x.id === deletingId);

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Loại phỏng vấn</h1>
          <p className="text-gray-600 mt-1">Quản lý các loại phỏng vấn.</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/interviewTypes/new"><Plus className="h-4 w-4 mr-2" />Tạo loại mới</Link>
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
              <button onClick={() => setQ("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 px-2" aria-label="Clear">✕</button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          {filtered.length === 0 ? (
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
                  {filtered.map(row => (
                    <tr key={row.id} className="border-top">                      
                      <td className="py-2 pr-4 font-mono">{row.code}</td>
                      <td className="py-2 pr-4">{row.name}</td>
                      <td className="py-2 pr-4">{row.description ?? "—"}</td>
                      <td className="py-2 pr-4">
                        <div className="flex gap-2">
                          <Button variant="outline" asChild>
                            <Link href={`/dashboard/interviewTypes/${row.id}/edit`}>
                              <Edit3 className="h-4 w-4 mr-1" /> Chỉnh sửa
                            </Link>
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-50"
                                onClick={() => askDelete(row.id)}
                              >
                                <Trash2 className="h-4 w-4 mr-1" /> Xóa
                              </Button>
                            </AlertDialogTrigger>

                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Xóa “{deleting?.name}”?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  {inUseCount > 0
                                    ? `Không thể xóa. Loại này (code ${deleting?.code}) đang được sử dụng bởi ${inUseCount} lịch phỏng vấn.`
                                    : "Hành động này không thể hoàn tác."}
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel onClick={() => setDeletingId(null)}>Hủy</AlertDialogCancel>
                                <AlertDialogAction disabled={inUseCount > 0} onClick={confirmDelete}>
                                  Xóa
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
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
