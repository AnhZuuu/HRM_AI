"use client";
import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  FaEdit,
  FaBuilding,
  FaUsers,
  FaBriefcase,
  FaInfoCircle,
} from "react-icons/fa";
import { Button } from "../ui/button";
import { Plus, Search } from "lucide-react";
import { Card, CardContent } from "../ui/card";
import { Input } from "../ui/input";
import { DeleteDepartmentDialog } from "./handleDeleteDepartment";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";

export interface Department {
  id: string;
  departmentName: string;
  code: string;
  description: string | null;
  numOfCampaignPosition: number;
  numOfEmployee: number;
  // keep optional fields in case you need them later
  creationDate?: string | null;
  createdById?: string | null;
  modificationDate?: string | null;
  modifiedById?: string | null;
  deletionDate?: string | null;
  deletedById?: string | null;
  isDeleted?: boolean;
}

type ApiSuccess<T> = {
  code: number;
  status: boolean;
  message: string;
  data: {
    data: T;
    currentPage: number;
    pageSize: number;
    totalPages: number;
  };
};


// ---- Page ----
export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);

  // Fetch real data
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${API.DEPARTMENT.BASE}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
        });
        if (!res.ok) {
          const txt = await res.text();
          throw new Error(txt || "Không thể tải dữ liệu phòng ban.");
        }
        const json = (await res.json()) as ApiSuccess<Department[]>;
        const items = json?.data?.data ?? [];
        setDepartments(items);
      } catch (e: any) {
        setError(e?.message || "Không thể tải dữ liệu phòng ban.");
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return departments;
    return departments.filter((d) => {
      const name = d.departmentName?.toLowerCase() || "";
      const code = d.code?.toLowerCase() || "";
      const desc = d.description?.toLowerCase() || "";
      return name.includes(q) || code.includes(q) || desc.includes(q);
    });
  }, [departments, searchQuery]);

  const handleDeleteDepartment = async (id: string) => {
    try {
      // If your API uses soft delete or different route, adjust here
      const res = await authFetch(`${API.DEPARTMENT.BASE}/${id}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(txt || "Xóa phòng ban thất bại.");
      }
      setDepartments((prev) => prev.filter((d) => d.id !== id));
    } catch (e: any) {
      setError(e?.message || "Xóa phòng ban thất bại.");
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Các phòng ban</h1>
          <p className="text-gray-600 mt-1">Quản lý các phòng ban</p>
        </div>
        <Button asChild className="bg-blue-600 hover:bg-blue-700">
          <Link href="/dashboard/departments/new">
            <Plus className="w-4 h-4 mr-2" />
            Thêm phòng ban
          </Link>
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Tìm phòng ban theo tên, mã, mô tả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading && (
        <p className="text-center text-gray-600">Đang tải phòng ban...</p>
      )}
      {error && <p className="text-center text-red-600">Lỗi: {error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((dept) => {
          const empCount = dept.numOfEmployee ?? 0;
          const posCount = dept.numOfCampaignPosition ?? 0;

          return (
            <div
              key={dept.id}
              className="bg-white rounded-lg overflow-hidden shadow-lg transform transition-transform duration-300 hover:scale-105 relative"
            >
              <div className="absolute -top-[20px] left-1/2 -translate-x-1/2 w-0 h-0 border-l-[75px] border-r-[75px] border-b-[40px] border-l-transparent border-r-transparent border-b-blue-500 z-10"></div>

              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <FaBuilding className="text-blue-500 text-xl mr-2" />
                    <h2 className="text-xl font-bold text-gray-800">
                      {dept.departmentName}
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link href={`/dashboard/departments/${dept.id}/edit`}>
                      <button
                        className="text-sm text-blue-500 hover:text-blue-700"
                        title="Chỉnh sửa phòng ban"
                      >
                        <FaEdit className="text-lg" />
                      </button>
                    </Link>
                    {/* <Button
                      variant="destructive"
                      onClick={() => {
                        setSelectedDept(dept);
                        setDeleteOpen(true);
                      }}
                    >
                      Xóa
                    </Button> */}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center">
                    <span className="text-xs uppercase tracking-wide bg-gray-100 text-gray-700 px-2 py-0.5 rounded">
                      {dept.code}
                    </span>
                  </div>

                  {dept.description && (
                    <div className="flex items-start">
                      <FaInfoCircle className="text-gray-500 mt-1 mr-2" />
                      <p className="text-gray-600">{dept.description}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-4">
                    <div className="flex items-center text-gray-700">
                      <FaUsers className="mr-2" />
                      <span>{empCount} nhân sự</span>
                    </div>
                    <div className="flex items-center text-gray-700">
                      <FaBriefcase className="mr-2" />
                      <span>{posCount} vị trí tuyển</span>
                    </div>
                  </div>
                </div>

                <Link href={`/dashboard/departments/${dept.id}`}>
                  <button className="mt-6 w-full bg-blue-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition-colors duration-300">
                    Xem chi tiết
                  </button>
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      <DeleteDepartmentDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        department={selectedDept as any}
        onConfirm={handleDeleteDepartment}
      />
    </div>
  );
}
