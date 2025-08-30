"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Users, Calendar, TrendingUp, Clock, Plus } from "lucide-react"
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
} from "recharts"

// Mock data
const departmentData = [
  { name: "Engineering", candidates: 45, hired: 12 },
  { name: "Marketing", candidates: 32, hired: 8 },
  { name: "Sales", candidates: 28, hired: 15 },
  { name: "Design", candidates: 18, hired: 5 },
  { name: "HR", candidates: 12, hired: 3 },
]

const statusData = [
  { name: "Applied", value: 135, color: "#3B82F6" },
  { name: "Screening", value: 45, color: "#F59E0B" },
  { name: "Interview", value: 28, color: "#8B5CF6" },
  { name: "Hired", value: 43, color: "#10B981" },
  { name: "Rejected", value: 67, color: "#EF4444" },
]

const monthlyData = [
  { month: "Jan", applications: 120, hired: 15 },
  { month: "Feb", applications: 135, hired: 18 },
  { month: "Mar", applications: 148, hired: 22 },
  { month: "Apr", applications: 162, hired: 25 },
  { month: "May", applications: 178, hired: 28 },
  { month: "Jun", applications: 195, hired: 32 },
]

const recentCandidates = [
  {
    id: 1,
    name: "Sarah Johnson",
    position: "Frontend Developer",
    status: "Interview",
    department: "Engineering",
    appliedDate: "2024-01-15",
  },
  {
    id: 2,
    name: "Michael Chen",
    position: "Product Manager",
    status: "Screening",
    department: "Product",
    appliedDate: "2024-01-14",
  },
  {
    id: 3,
    name: "Emily Davis",
    position: "UX Designer",
    status: "Hired",
    department: "Design",
    appliedDate: "2024-01-13",
  },
  {
    id: 4,
    name: "James Wilson",
    position: "Sales Executive",
    status: "Applied",
    department: "Sales",
    appliedDate: "2024-01-12",
  },
  {
    id: 5,
    name: "Lisa Anderson",
    position: "Marketing Specialist",
    status: "Interview",
    department: "Marketing",
    appliedDate: "2024-01-11",
  },
]

const upcomingInterviews = [
  { id: 1, candidate: "Sarah Johnson", position: "Frontend Developer", time: "10:00 AM", date: "Today" },
  { id: 2, candidate: "Michael Chen", position: "Product Manager", time: "2:00 PM", date: "Today" },
  { id: 3, candidate: "Alex Rodriguez", position: "Backend Developer", time: "11:00 AM", date: "Tomorrow" },
  { id: 4, candidate: "Emma Thompson", position: "Data Analyst", time: "3:30 PM", date: "Tomorrow" },
]

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("")

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Hired":
        return "bg-green-100 text-green-800"
      case "Interview":
        return "bg-purple-100 text-purple-800"
      case "Screening":
        return "bg-yellow-100 text-yellow-800"
      case "Applied":
        return "bg-blue-100 text-blue-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Recruitment Dashboard</h1>
          <p className="text-gray-600 mt-1">Overview of your recruitment pipeline</p>
        </div>
        {/* <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Add Candidate
        </Button> */}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Candidates</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">318</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Interviews</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">28</div>
            <p className="text-xs text-muted-foreground">4 scheduled today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Hired This Month</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">32</div>
            <p className="text-xs text-muted-foreground">+8% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">18 days</div>
            <p className="text-xs text-muted-foreground">-2 days from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Stats */}
        <Card>
          <CardHeader>
            <CardTitle>Candidates by Department</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="candidates" fill="#3B82F6" name="Total Candidates" />
                <Bar dataKey="hired" fill="#10B981" name="Hired" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
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
          </CardContent>
        </Card>
      </div>

      {/* Monthly Trend */}
      <Card>
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
      </Card>

      {/* Recent Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Candidates */}
        <Card>
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
        </Card>

        {/* Upcoming Interviews */}
        <Card>
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
      </div>
    </div>
  )
}
