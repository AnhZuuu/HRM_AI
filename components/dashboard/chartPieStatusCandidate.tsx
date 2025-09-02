import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, TrendingUp, Clock, Plus } from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
} from "recharts";
import { useEffect, useState } from "react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

type ApiResponse = {
  code: number;
  status: boolean;
  message: string;
  data: any[];
};

const STATUS_COLORS: Record<string, string> = {
  Pending: "#3B82F6",
  Accepted: "#10B981",
  Failed: "#8B5CF6",
  Rejected: "#EF4444",
  Onboarded : "#F59E0B"
}

export default function ChartPieStatusCandidate() {
  const [statusData, setStatusData] = useState<{ name: string; value: number; color: string }[]>([])
  const [loadingStatus, setLoadingStatus] = useState(false)
  const [statusError, setStatusError] = useState<string | null>(null)

  useEffect(() => {
    const loadStatus = async () => {
      setLoadingStatus(true)
      setStatusError(null)
      try {
        const res = await authFetch(
          `${API.DASHBOARD.PIE_STATUS_CANDIDATE}`,
          { headers: { accept: "application/json" } }
        )
        if (!res.ok) {
          let msg = `HTTP ${res.status}`;
          try {
            const json = await res.json();
            msg = json?.message || msg;
          } catch {}
          throw new Error(msg);
        }
        const json: ApiResponse = await res.json()
        if (!json.status || !Array.isArray(json.data)) {
          throw new Error(json.message || "Unexpected API response")
        }
        const rows = json.data
        .filter(item => item.value > 0)
        .map(item => ({
          ...item,
          color: STATUS_COLORS[item.name] || "#9CA3AF",
        }))
        setStatusData(rows)
      } catch (e: any) {
        setStatusError(e.message || "Failed to load status data")
        setStatusData([])
      } finally {
        setLoadingStatus(false)
      }
    }
    loadStatus()
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trạng thái ứng viên</CardTitle>
      </CardHeader>
      <CardContent>
        {statusError && <p className="text-sm text-red-600">{statusError}</p>}
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={statusData}
              cx="50%"
              cy="50%"
              outerRadius={100}
              dataKey="value"
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
            >
              {statusData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
        {loadingStatus && <p className="text-xs text-muted-foreground mt-2">Đang tải dữ liệu trạng thái…</p>}
      </CardContent>
    </Card>
  )
}