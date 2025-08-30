"use client";

import * as React from "react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

export type DepartmentOption = { id: string; name: string };

type DeptListResponse = {
  code: number;
  status: boolean;
  message: string;
  data: { data: Array<{ id: string; departmentName: string }> };
};

export function useDepartments(initialFetch = true) {
  const [loading, setLoading] = React.useState(false);
  const [items, setItems] = React.useState<DepartmentOption[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const fetchAll = React.useCallback(async () => {
    try {
      setLoading(true);
      const res = await authFetch(`${API.DEPARTMENT.BASE}`);
      if (!res.ok) throw new Error(`Failed (${res.status})`);
      const json: DeptListResponse = await res.json();
      setItems(
        json?.data?.data?.map((d) => ({ id: d.id, name: d.departmentName })) ?? []
      );
    } catch (e: any) {
      setError(e?.message ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (initialFetch) fetchAll();
  }, [fetchAll, initialFetch]);

  return { items, loading, error, refetch: fetchAll };
}
