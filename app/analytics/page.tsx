"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, TrendingDown, Users, Calendar, Clock, Target } from "lucide-react"
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
  AreaChart,
  Area,
} from "recharts"

// Mock analytics data
const performanceData = [
  { month: "Jul", applications: 89, interviews: 34, hired: 12, conversionRate: 13.5 },
  { month: "Aug", applications: 112, interviews: 45, hired: 18, conversionRate: 16.1 },
  { month: "Sep", applications: 134, interviews: 52, hired: 22, conversionRate: 16.4 },
  { month: "Oct", applications: 156, interviews: 61, hired: 25, conversionRate: 16.0 },
  { month: "Nov", applications: 178, interviews: 68, hired: 28, conversionRate: 15.7 },
  { month: "Dec", applications: 195, interviews: 75, hired: 32, conversionRate: 16.4 },
]

const sourceData = [
  { name: "LinkedIn", value: 145, color: "#0077B5" },
  { name: "Indeed", value: 89, color: "#2557A7" },
  { name: "Company Website", value: 67, color: "#10B981" },
  { name: "Referrals", value: 45, color: "#F59E0B" },
  { name: "GitHub", value: 32, color: "#6B7280" },
  { name: "Other", value: 28, color: "#8B5CF6" },
]

const departmentPerformance = [
  { department: "Engineering", applications: 145, interviews: 58, hired: 23, timeToHire: 16 },
  { department: "Sales", value: 89, interviews: 42, hired: 18, timeToHire: 12 },
  { department: "Marketing", applications: 67, interviews: 28, hired: 12, timeToHire: 14 },
  { department: "Design", applications: 45, interviews: 22, hired: 8, timeToHire: 18 },
  { department: "Product", applications: 38, interviews: 18, hired: 7, timeToHire: 15 },
  { department: "HR", applications: 22, interviews: 12, hired: 4, timeToHire: 10 },
]

const interviewSuccessRate = [
  { stage: "Application", candidates: 406, percentage: 100 },
  { stage: "Screening", candidates: 162, percentage: 40 },
  { stage: "First Interview", candidates: 89, percentage: 22 },
  { stage: "Final Interview", candidates: 45, percentage: 11 },
  { stage: "Offer", candidates: 32, percentage: 8 },
  { stage: "Hired", candidates: 28, percentage: 7 },
]

const timeToHireData = [
  { range: "0-7 days", count: 8, percentage: 12.5 },
  { range: "8-14 days", count: 18, percentage: 28.1 },
  { range: "15-21 days", count: 22, percentage: 34.4 },
  { range: "22-30 days", count: 12, percentage: 18.8 },
  { range: "30+ days", count: 4, percentage: 6.2 },
]

export default function AnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Recruitment Analytics</h1>
        <p className="text-gray-600 mt-1">Insights and performance metrics</p>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">16.4%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +2.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interview Success Rate</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">31.5%</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingUp className="h-3 w-3 mr-1" />
              +1.8% from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Time to Hire</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15.2 days</div>
            <div className="flex items-center text-xs text-red-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              +1.2 days from last month
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost per Hire</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$3,240</div>
            <div className="flex items-center text-xs text-green-600">
              <TrendingDown className="h-3 w-3 mr-1" />
              -$180 from last month
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Recruitment Performance Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={performanceData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Area
                type="monotone"
                dataKey="applications"
                stackId="1"
                stroke="#3B82F6"
                fill="#3B82F6"
                fillOpacity={0.6}
                name="Applications"
              />
              <Area
                type="monotone"
                dataKey="interviews"
                stackId="2"
                stroke="#8B5CF6"
                fill="#8B5CF6"
                fillOpacity={0.6}
                name="Interviews"
              />
              <Area
                type="monotone"
                dataKey="hired"
                stackId="3"
                stroke="#10B981"
                fill="#10B981"
                fillOpacity={0.6}
                name="Hired"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Source Analysis */}
        <Card>
          <CardHeader>
            <CardTitle>Candidate Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {sourceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Interview Success Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {interviewSuccessRate.map((stage, index) => (
                <div key={stage.stage} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-600">{stage.candidates}</span>
                      <Badge variant="outline">{stage.percentage}%</Badge>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${stage.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Department Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Department Performance</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={departmentPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="department" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="applications" fill="#3B82F6" name="Applications" />
              <Bar dataKey="interviews" fill="#8B5CF6" name="Interviews" />
              <Bar dataKey="hired" fill="#10B981" name="Hired" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Time to Hire Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Time to Hire Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {timeToHireData.map((item, index) => (
              <div key={index} className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{item.count}</div>
                <div className="text-sm text-gray-600 mt-1">{item.range}</div>
                <div className="text-xs text-gray-500 mt-1">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
