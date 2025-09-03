"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Calendar, TrendingUp, Clock } from "lucide-react"

import ChartCandidatesbyDepartment from "@/components/dashboard/chartColumnCandidate"
import ChartPieStatusCandidate from "@/components/dashboard/chartPieStatusCandidate"
import API from "@/api/api"

type DashboardApiResponse = {
  code: number
  status: boolean
  message: string
  data: {
    totalApplicant: number
    totalEmployees: number
    totalOnboarded: number
    totalScheduleToday: number
  }
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardApiResponse["data"] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(
          `${API.DASHBOARD.BASE}`,
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
        const json: DashboardApiResponse = await res.json()
        if (!json.status || !json.data) throw new Error(json.message || "Unexpected API response")
        setDashboardData(json.data)
      } catch (e: any) {
        setError(e.message || "Failed to load dashboard data")
      } finally {
        setLoading(false)
      }
    }
    loadDashboard()
  }, [])
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Thống kê tuyển dụng</h1>
          <p className="text-gray-600 mt-1">Tổng quan về quy trình tuyển dụng của bạn</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-[#FDF7D7]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số ứng viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalApplicant ?? (loading ? "…" : 0)}</div>
            <p className="text-xs text-muted-foreground">Đã được scan vào hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-violet-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số nhân viên</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalEmployees ?? (loading ? "…" : 0)}</div>
            <p className="text-xs text-muted-foreground">Hiện tại trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-[#EDF5EA]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số onboard</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalOnboarded ?? (loading ? "…" : 0)}</div>
            <p className="text-xs text-muted-foreground">Đã được tạo trong hệ thống</p>
          </CardContent>
        </Card>

        <Card className="bg-blue-50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tổng số lịch phỏng vấn</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData?.totalScheduleToday ?? (loading ? "…" : 0)}</div>
            <p className="text-xs text-muted-foreground">Trong ngày hôm nay</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Stats */}
        <ChartCandidatesbyDepartment/>

        {/* Status Distribution */}
        <ChartPieStatusCandidate/>      
      </div>

      {/* Monthly Trend */}
      {/* <Card>
        <CardHeader>
          <CardTitle>Monthly Recruitment Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="applications" stroke="#3B82F6" strokeWidth={2} name="Applications" />
              <Line type="monotone" dataKey="hired" stroke="#10B981" strokeWidth={2} name="Hired" />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card> */}

      {/* Recent Activity Section */}
      {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6"> */}
        {/* Recent Candidates */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Candidates</CardTitle>
            <Button variant="outline" size="sm">
              View All
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentCandidates.map((candidate) => (
                <div key={candidate.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{candidate.name}</h4>
                    <p className="text-sm text-gray-600">{candidate.position}</p>
                    <p className="text-xs text-gray-500">
                      {candidate.department} • Applied {candidate.appliedDate}
                    </p>
                  </div>
                  <Badge className={getStatusColor(candidate.status)}>{candidate.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card> */}

        {/* Upcoming Interviews */}
        {/* <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Upcoming Interviews</CardTitle>
            <Button variant="outline" size="sm">
              View Calendar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingInterviews.map((interview) => (
                <div key={interview.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{interview.candidate}</h4>
                    <p className="text-sm text-gray-600">{interview.position}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-blue-600">{interview.time}</p>
                    <p className="text-xs text-gray-500">{interview.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div> */}
    </div>
  )
}
