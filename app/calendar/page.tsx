"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Calendar, Clock, Plus, Users, MapPin, Video } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

// Mock interview data
const interviewsData = [
  {
    id: 1,
    candidate: "Sarah Johnson",
    position: "Frontend Developer",
    interviewer: "John Smith",
    date: "2024-01-16",
    time: "10:00",
    duration: 60,
    type: "Technical",
    location: "Conference Room A",
    status: "Scheduled",
  },
  {
    id: 2,
    candidate: "Michael Chen",
    position: "Product Manager",
    interviewer: "Jane Doe",
    date: "2024-01-16",
    time: "14:00",
    duration: 45,
    type: "Behavioral",
    location: "Video Call",
    status: "Scheduled",
  },
  {
    id: 3,
    candidate: "Lisa Anderson",
    position: "Marketing Specialist",
    interviewer: "Bob Wilson",
    date: "2024-01-17",
    time: "11:00",
    duration: 30,
    type: "HR Screening",
    location: "Conference Room B",
    status: "Scheduled",
  },
  {
    id: 4,
    candidate: "Alex Rodriguez",
    position: "Backend Developer",
    interviewer: "Sarah Tech",
    date: "2024-01-17",
    time: "15:30",
    duration: 90,
    type: "Technical",
    location: "Video Call",
    status: "Scheduled",
  },
  {
    id: 5,
    candidate: "Emma Thompson",
    position: "Data Analyst",
    interviewer: "Mike Data",
    date: "2024-01-18",
    time: "09:30",
    duration: 60,
    type: "Technical",
    location: "Conference Room C",
    status: "Scheduled",
  },
]

const timeSlots = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
]

export default function CalendarPage() {
  const [interviews, setInterviews] = useState(interviewsData)
  const [selectedDate, setSelectedDate] = useState("2024-01-16")
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const { toast } = useToast()

  const [newInterview, setNewInterview] = useState({
    candidate: "",
    position: "",
    interviewer: "",
    date: "",
    time: "",
    duration: "60",
    type: "",
    location: "",
    notes: "",
  })

  // Generate calendar days for the current month
  const generateCalendarDays = () => {
    const today = new Date()
    const currentMonth = today.getMonth()
    const currentYear = today.getFullYear()
    const firstDay = new Date(currentYear, currentMonth, 1)
    const lastDay = new Date(currentYear, currentMonth + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`
      const dayInterviews = interviews.filter((interview) => interview.date === dateStr)
      days.push({
        day,
        date: dateStr,
        interviews: dayInterviews,
        isToday: dateStr === today.toISOString().split("T")[0],
        isSelected: dateStr === selectedDate,
      })
    }

    return days
  }

  const getSelectedDateInterviews = () => {
    return interviews
      .filter((interview) => interview.date === selectedDate)
      .sort((a, b) => a.time.localeCompare(b.time))
  }

  const getInterviewTypeColor = (type: string) => {
    switch (type) {
      case "Technical":
        return "bg-blue-100 text-blue-800"
      case "Behavioral":
        return "bg-green-100 text-green-800"
      case "HR Screening":
        return "bg-yellow-100 text-yellow-800"
      case "Final":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const handleAddInterview = () => {
    if (!newInterview.candidate || !newInterview.date || !newInterview.time) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      })
      return
    }

    const interview = {
      id: interviews.length + 1,
      ...newInterview,
      duration: Number.parseInt(newInterview.duration),
      status: "Scheduled",
    }

    setInterviews([...interviews, interview])
    setNewInterview({
      candidate: "",
      position: "",
      interviewer: "",
      date: "",
      time: "",
      duration: "60",
      type: "",
      location: "",
      notes: "",
    })
    setIsAddDialogOpen(false)

    toast({
      title: "Success",
      description: "Interview scheduled successfully!",
    })
  }

  const calendarDays = generateCalendarDays()
  const selectedDateInterviews = getSelectedDateInterviews()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Interview Calendar</h1>
          <p className="text-gray-600 mt-1">Schedule and manage interviews</p>
        </div>

        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Schedule Interview
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule New Interview</DialogTitle>
              <DialogDescription>Schedule an interview with a candidate.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="candidate">Candidate *</Label>
                  <Input
                    id="candidate"
                    value={newInterview.candidate}
                    onChange={(e) => setNewInterview({ ...newInterview, candidate: e.target.value })}
                    placeholder="Candidate name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="position">Position</Label>
                  <Input
                    id="position"
                    value={newInterview.position}
                    onChange={(e) => setNewInterview({ ...newInterview, position: e.target.value })}
                    placeholder="Position applied for"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="interviewer">Interviewer</Label>
                  <Input
                    id="interviewer"
                    value={newInterview.interviewer}
                    onChange={(e) => setNewInterview({ ...newInterview, interviewer: e.target.value })}
                    placeholder="Interviewer name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Interview Type</Label>
                  <Select
                    value={newInterview.type}
                    onValueChange={(value) => setNewInterview({ ...newInterview, type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="HR Screening">HR Screening</SelectItem>
                      <SelectItem value="Technical">Technical</SelectItem>
                      <SelectItem value="Behavioral">Behavioral</SelectItem>
                      <SelectItem value="Final">Final</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={newInterview.date}
                    onChange={(e) => setNewInterview({ ...newInterview, date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Time *</Label>
                  <Select
                    value={newInterview.time}
                    onValueChange={(value) => setNewInterview({ ...newInterview, time: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {timeSlots.map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (min)</Label>
                  <Select
                    value={newInterview.duration}
                    onValueChange={(value) => setNewInterview({ ...newInterview, duration: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30">30 min</SelectItem>
                      <SelectItem value="45">45 min</SelectItem>
                      <SelectItem value="60">60 min</SelectItem>
                      <SelectItem value="90">90 min</SelectItem>
                      <SelectItem value="120">120 min</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={newInterview.location}
                  onChange={(e) => setNewInterview({ ...newInterview, location: e.target.value })}
                  placeholder="Conference Room A or Video Call"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  value={newInterview.notes}
                  onChange={(e) => setNewInterview({ ...newInterview, notes: e.target.value })}
                  placeholder="Additional notes for the interview..."
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleAddInterview} className="bg-blue-600 hover:bg-blue-700">
                Schedule Interview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendar */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                January 2024
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-7 gap-1 mb-4">
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
                    {day}
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => (
                  <div key={index} className="min-h-[80px]">
                    {day && (
                      <div
                        className={`p-2 rounded-lg cursor-pointer transition-colors ${
                          day.isSelected
                            ? "bg-blue-100 border-2 border-blue-500"
                            : day.isToday
                              ? "bg-blue-50 border border-blue-200"
                              : "hover:bg-gray-50"
                        }`}
                        onClick={() => setSelectedDate(day.date)}
                      >
                        <div className={`text-sm font-medium ${day.isToday ? "text-blue-600" : "text-gray-900"}`}>
                          {day.day}
                        </div>
                        <div className="mt-1 space-y-1">
                          {day.interviews.slice(0, 2).map((interview) => (
                            <div key={interview.id} className="text-xs p-1 rounded bg-blue-100 text-blue-800 truncate">
                              {interview.time} - {interview.candidate}
                            </div>
                          ))}
                          {day.interviews.length > 2 && (
                            <div className="text-xs text-gray-500">+{day.interviews.length - 2} more</div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Selected Date Details */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {new Date(selectedDate).toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedDateInterviews.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>No interviews scheduled for this date</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedDateInterviews.map((interview) => (
                    <div key={interview.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <h4 className="font-medium text-gray-900">{interview.candidate}</h4>
                          <p className="text-sm text-gray-600">{interview.position}</p>
                        </div>
                        <Badge className={getInterviewTypeColor(interview.type)}>{interview.type}</Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          {interview.time} ({interview.duration} min)
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4" />
                          {interview.interviewer}
                        </div>
                        <div className="flex items-center gap-2">
                          {interview.location.includes("Video") ? (
                            <Video className="h-4 w-4" />
                          ) : (
                            <MapPin className="h-4 w-4" />
                          )}
                          {interview.location}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button size="sm" variant="outline" className="flex-1">
                          Edit
                        </Button>
                        <Button size="sm" variant="outline" className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
