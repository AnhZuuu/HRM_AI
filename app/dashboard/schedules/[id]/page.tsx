"use client";

import { useMemo, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  ExternalLink,
  Star,
  FileText,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  PencilLine,
} from "lucide-react";

import {
  mockApplicants,
  mockInterviewSchedule,
  type CVApplicant,
} from "@/components/interviewSchedule/sampleData/mockData"; // <-- update path to your mock file
import { DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FancyTextarea } from "@/components/interviewSchedule/ui/fancyTextarea";

// ---------- Helpers ----------
const STATUS_LABEL: Record<string, string> = {
  Pending: "Pending",
  "Chưa phỏng vấn": "Pending",
  Accepted: "Accepted",
  Rejected: "Rejected",
  Reviewed: "Reviewed",
  Pass: "Pass",
  Fail: "Fail",
  Canceled: "Canceled",
};

function statusBadgeClass(status?: string | null) {
  switch (status) {
    case "Pending":
    case "Chưa phỏng vấn":
      return "bg-blue-100 text-blue-800";
    case "Accepted":
    case "Pass":
      return "bg-green-100 text-green-800";
    case "Rejected":
    case "Fail":
      return "bg-red-100 text-red-800";
    case "Reviewed":
      return "bg-purple-100 text-purple-800";
    case "Canceled":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

const formatISODate = (iso?: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString();
};

const shortId = (id?: string | null) =>
  id ? `${id.slice(0, 6)}…${id.slice(-4)}` : "—";

const initials = (name?: string | null) =>
  (name ?? "")
    .trim()
    .split(/\s+/)
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "CV";

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-sm">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}

function LegendRow({
  icon,
  label,
  cls,
}: {
  icon: React.ReactNode;
  label: string;
  cls: string;
}) {
  return (
    <div className="inline-flex items-center gap-2">
      <span className={`px-2 py-0.5 rounded-full text-xs ${cls}`}>{label}</span>
      <span className="text-gray-500">{icon}</span>
    </div>
  );
}

// ---------- Sample extra data to render left column like your screenshot ----------
const sampleSections = {
  experience: [{ company: "FPT Telecom", position: "Developer" }],
  education: {
    school: "FPT University",
    degree: "Software Engineer",
    gpa: "7.586/10 or 3.03/4",
  },
  personal: {
    full_name: "", // will fall back to candidate.fullName
    dob: "—",
    gender: "—",
  },
  skills: [
    "HTML",
    "CSS",
    "JavaScript",
    "React.js",
    "Next.js",
    "Node.js",
    "React Native",
    "Wi-Fi setup",
    "secure file transfer with SFTP",
    "Git",
    "Postman",
    "VS Code",
    "Microsoft Office",
    "Oracle",
    "Fixing software/OS issues",
    "helping users with tech problems",
    "Technical communication & teamwork",
    "Troubleshooting technical issues",
    "Adapting to new technologies",
  ],
  contact: {
    phone: "0329907056",
    address: "Thủ Đức, TpHCM",
  },
};

// ---------- Page ----------
export default function InterviewDetailSplit() {
  const candidate: CVApplicant = mockApplicants[0];
  const [review, setReview] = useState("");

  const interview = useMemo(() => {
    return (
      mockInterviewSchedule.find(
        (i: any) => i.cvApplicantId === candidate.id
      ) ?? mockInterviewSchedule[0]
    );
  }, [candidate]);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="outline" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Quay lại
        </Button>
      </div>

      {/* Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* LEFT — Candidate Detail (same look & sections) */}
        <div className="space-y-2">
          {/* Header Card */}
          <Card>
            <CardHeader>
              <CardTitle>Thông tin ứng viên</CardTitle>
              <DropdownMenuSeparator className="bg-gray-300" />
            </CardHeader>

            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center text-xl font-semibold text-gray-600">
                    {initials(candidate.fullName)}
                  </div>

                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">
                        {candidate.fullName || "—"}
                      </h2>
                      <Badge className={statusBadgeClass(candidate.status)}>
                        {STATUS_LABEL[candidate.status ?? ""] ??
                          (candidate.status || "—")}
                      </Badge>
                    </div>

                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4" /> {candidate.point || "—"}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Created{" "}
                        {formatISODate(
                          candidate as any /* if you store creationDate elsewhere, wire it here */
                        )}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="inline-flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                          {shortId(candidate.campaignPositionId)}
                        </span>
                        <span className="text-gray-400 text-xs">
                          (position)
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {candidate.fileUrl && (
                    <Button asChild className="gap-2">
                      <a
                        href={candidate.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open CV File
                      </a>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    className="gap-2"
                    onClick={() => navigator.clipboard.writeText(candidate.id)}
                  >
                    Copy ID
                  </Button>
                </div>
              </div>

              {/* Contact row */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  {candidate.email || "—"}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  {sampleSections.contact.phone}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4" />
                  {sampleSections.contact.address}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Experience */}
          <Card>
            <CardHeader>
              <CardTitle>Experience</CardTitle>
            </CardHeader>
            <CardContent>
              {sampleSections.experience.length === 0 ? (
                <div className="text-sm text-gray-500">
                  No experience listed.
                </div>
              ) : (
                <ul className="space-y-5">
                  {sampleSections.experience.map((exp, idx) => (
                    <li key={idx} className="relative pl-6">
                      <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-gray-300" />
                      <div className="font-medium">{exp.position}</div>
                      <div className="text-sm text-gray-600">{exp.company}</div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* Education */}
          <Card>
            <CardHeader>
              <CardTitle>Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="font-medium">
                    {sampleSections.education.school}
                  </div>
                  <div className="text-sm text-gray-600">
                    {sampleSections.education.degree}
                  </div>
                </div>
                <div className="text-sm">
                  GPA:{" "}
                  <span className="font-medium">
                    {sampleSections.education.gpa}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Skills */}
          <Card>
            <CardHeader>
              <CardTitle>Skills</CardTitle>
            </CardHeader>
            <CardContent>
              {sampleSections.skills.length === 0 ? (
                <div className="text-sm text-gray-500">No skills listed.</div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {sampleSections.skills.map((s) => (
                    <Badge key={s} variant="secondary" className="px-2 py-1">
                      {s}
                    </Badge>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* RIGHT — Interview Information */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Thông tin phỏng vấn</CardTitle>
              <DropdownMenuSeparator className="bg-gray-300" />
            </CardHeader>
            <CardContent className="pt-6">
              {/* Top row: name + status badge */}
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-lg font-semibold">
                    {interview.cvApplicant?.fullName || "—"}
                  </div>
                  <div className="text-gray-600">
                    Vòng {interview.round ?? "—"} •{" "}
                    {interview.interviewTypeId || "—"}
                  </div>
                </div>
                <Badge className={statusBadgeClass(interview.status)}>
                  {STATUS_LABEL[interview.status ?? ""] ??
                    interview.status ??
                    "—"}
                </Badge>
              </div>

              {/* Detail rows */}
              <ul className="mt-3 space-y-2 text-sm text-gray-700">
                <li className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  {"N/A"}
                </li>
                <li className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(interview.startTime).toLocaleString()} —{" "}
                    {new Date(interview.endTime ?? "").toLocaleTimeString()}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="text-gray-600">Người phỏng vấn:</span>
                  <span className="font-medium">
                    {(interview.interviewers as string) ||
                      (Array.isArray(interview.interviewers)
                        ? (interview.interviewers as any[])
                            .map(
                              (p) =>
                                p.username ||
                                [p.firstName, p.lastName]
                                  .filter(Boolean)
                                  .join(" ")
                            )
                            .join(", ")
                        : "—")}
                  </span>
                </li>
                <li className="flex items-center gap-2">
                  <PencilLine className="h-4 w-4" />
                  <span className="text-gray-600">Ghi chú:</span>
                  <span className="text-gray-700">
                    {interview.notes || "—"}
                  </span>
                </li>
              </ul>

              <div className="space-y-2 p-6">
                <DropdownMenuSeparator className="bg-gray-300" />
                <Label className="text-sm font-medium">Đánh giá</Label>
                <FancyTextarea
                  value={review}
                  onChange={setReview}
                  maxLength={1000}
                />
                <div className="mt-4 flex justify-end gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setReview("")}
                    disabled={!review.trim().length} 
                  >
                    Xóa đánh giá
                  </Button>
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    Đánh giá
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
