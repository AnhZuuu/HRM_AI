import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useEffect, useState } from "react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

type DeptApiResponse = {
  code: number;
  status: boolean;
  message: string;
  data: any[];
};

export default function ChartCandidatesbyDepartment() {
  const [departmentData, setDepartmentData] = useState<any[]>([]);
  const [loadingDept, setLoadingDept] = useState<boolean>(false);
  const [deptError, setDeptError] = useState<string | null>(null);

  useEffect(() => {
    const loadDept = async () => {
      setLoadingDept(true);
      setDeptError(null);
      try {
        const res = await authFetch(`${API.DASHBOARD.COLUMN_CANDIDATE}`, {
          headers: { accept: "application/json" },
        });
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const json = await res.json();
            msg = json?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const json: DeptApiResponse = await res.json();
        if (!json.status || !Array.isArray(json.data)) {
          throw new Error(json.message || "Phản hồi API không mong muốn");
        }
        const rows: any[] = json.data.map((r: any) => ({
          name: r.departmentName,
          totalCandidates: r.totalCandidates,
          hired: r.hired,
        }));
        setDepartmentData(rows);
      } catch (e: any) {
        setDeptError(e?.message || "Không tải được số liệu thống kê của phòng ban");
        setDepartmentData([]); 
      } finally {
        setLoadingDept(false);
      }
    };
    loadDept();
  }, []);

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Ứng viên theo phòng ban</CardTitle>
        </CardHeader>
        <CardContent>
          {deptError && (
            <p className="text-sm text-red-600 mb-3">{deptError}</p>
          )}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar
                dataKey="totalCandidates"
                fill="#3B82F6"
                name="Tổng số ứng viên"
              />
              <Bar dataKey="hired" fill="#10B981" name="Hired" />
            </BarChart>
          </ResponsiveContainer>
          {loadingDept && (
            <p className="text-xs text-muted-foreground mt-2">
              Đang tải số liệu thống kê của phòng ban…
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
