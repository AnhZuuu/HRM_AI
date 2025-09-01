"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import {
  ExternalLink, Users, FileText, Award, Briefcase, GraduationCap,
  Phone, Mail, MapPin, Calendar, ChevronDown, ChevronUp,
} from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

/* ========= types unchanged ========= */
interface CvApplicantDetail { type: string; key: string; value: string; groupIndex: number; }
interface CvApplicant {
  fileUrl: string; fileAlt: string; fullName: string | null; email: string; point: string;
  status: number; cvApplicantDetailModels: CvApplicantDetail[]; id: string; creationDate: string;
}
interface CampaignPositionDetail { type: string; key: string; value: string; groupIndex: number; }
interface CampaignData {
  departmentId: string;
  campaignId: string;
  totalSlot: number;
  description: string;
  cvApplicantModels: CvApplicant[];
  campaignPositionDetailModels: CampaignPositionDetail[];
  id: string;
  creationDate: string;
}
interface ApiEnvelope {
  code?: number;
  status?: boolean;
  message?: string;
  data?: any;
}
/* =================================== */

export default function CampaignPositionPage() {
  const { id } = useParams<{ id: string }>(); // <- read /[id]
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedApplicants, setExpandedApplicants] = useState<Set<string>>(new Set());

  // unwrap helper: tolerate {data:{...}} or raw object
  const unwrap = (json: any) => json?.data ?? json;

  useEffect(() => {
    if (!id) return;
    const ctrl = new AbortController();

    const fetchCampaignData = async () => {
      setLoading(true);
      try {
        const res = await authFetch(`${API.CAMPAIGN.POSITION}/${id}`, {
          signal: ctrl.signal,
          cache: "no-store",
        });

        const text = await res.text();
        const json: ApiEnvelope = text ? JSON.parse(text) : {};
        // optional: log metadata if backend sends it
        if (typeof json.code !== "undefined") console.log("API Response Code:", json.code);
        if (typeof json.status !== "undefined") console.log("API Response Status:", json.status);
        if (typeof json.message !== "undefined") console.log("API Response Message:", json.message);

        const data = unwrap(json) as CampaignData;
        setCampaignData(data);
      } catch (error) {
        console.error("Error fetching campaign position:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCampaignData();
    return () => ctrl.abort();
  }, [id]);

  const toggleApplicantExpansion = (applicantId: string) => {
    setExpandedApplicants((prev) => {
      const s = new Set(prev);
      s.has(applicantId) ? s.delete(applicantId) : s.add(applicantId);
      return s;
    });
  };

  const getApplicantInfo = (details: CvApplicantDetail[], type: string, key: string) =>
    details.find((d) => d.type === type && d.key === key)?.value || "";

  const getApplicantsByType = (details: CvApplicantDetail[], type: string) =>
    details.filter((d) => d.type === type);

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString("vi-VN", {
      year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
    });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (!campaignData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-destructive text-lg">Không thể tải dữ liệu vị trí</p>
      </div>
    );
  }

  const applicantCount = campaignData.cvApplicantModels.length;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-foreground">Chi tiết vị trí tuyển dụng</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              <Users className="w-4 h-4 mr-2" />
              {applicantCount} / {campaignData.totalSlot} ứng viên
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl">{campaignData.description}</CardTitle>
              <CardDescription>ID Chiến dịch: {campaignData.campaignId}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Tổng slot: <strong>{campaignData.totalSlot}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Đã ứng tuyển: <strong>{applicantCount}</strong></span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <span className="text-sm">Tạo lúc: <strong>{formatDate(campaignData.creationDate)}</strong></span>
                </div>
              </div>

              {campaignData.campaignPositionDetailModels.length > 0 && (
                <div className="mt-4">
                  <h4 className="font-semibold mb-2">Yêu cầu vị trí:</h4>
                  <div className="flex flex-wrap gap-2">
                    {campaignData.campaignPositionDetailModels.map((detail, idx) => (
                      <Badge key={idx} variant="outline">
                        {detail.key}: {detail.value}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applicants */}
        <div className="space-y-6">
          <h2 className="text-2xl font-bold text-foreground mb-4">
            Danh sách ứng viên ({applicantCount})
          </h2>

          {campaignData.cvApplicantModels.map((applicant) => {
            const fullName =
              getApplicantInfo(applicant.cvApplicantDetailModels, "personal_info", "full_name") ||
              applicant.fullName || "Chưa có tên";
            const email = getApplicantInfo(applicant.cvApplicantDetailModels, "contact", "email") || applicant.email;
            const phone = getApplicantInfo(applicant.cvApplicantDetailModels, "contact", "phone");
            const address = getApplicantInfo(applicant.cvApplicantDetailModels, "contact", "address");
            const linkedin = getApplicantInfo(applicant.cvApplicantDetailModels, "contact", "linkedin");
            const position = getApplicantInfo(applicant.cvApplicantDetailModels, "personal_info", "position");

            const education = getApplicantsByType(applicant.cvApplicantDetailModels, "education");
            const experience = getApplicantsByType(applicant.cvApplicantDetailModels, "experience");
            const skills = getApplicantsByType(applicant.cvApplicantDetailModels, "skill");
            const certificates = getApplicantsByType(applicant.cvApplicantDetailModels, "certificate");

            const isExpanded = expandedApplicants.has(applicant.id);

            return (
              <Card key={applicant.id} className="w-full">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-xl">{fullName}</CardTitle>
                      <CardDescription className="mt-1">
                        {position && <span className="text-sm text-muted-foreground">{position}</span>}
                      </CardDescription>
                      <div className="mt-2">
                        <Badge variant={applicant.status === 0 ? "secondary" : "default"}>
                          Điểm: {applicant.point}
                        </Badge>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href={applicant.fileUrl} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Xem CV
                        </a>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => toggleApplicantExpansion(applicant.id)}>
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  {/* Contact */}
                  <div className="mb-4">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <Phone className="w-4 h-4" /> Thông tin liên hệ
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {email && <div className="flex items-center gap-2"><Mail className="w-4 h-4 text-muted-foreground" />{email}</div>}
                      {phone && <div className="flex items-center gap-2"><Phone className="w-4 h-4 text-muted-foreground" />{phone}</div>}
                      {address && <div className="flex items-center gap-2"><MapPin className="w-4 h-4 text-muted-foreground" />{address}</div>}
                      {linkedin && (
                        <div className="flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-muted-foreground" />
                          <a href={linkedin} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            LinkedIn Profile
                          </a>
                        </div>
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="space-y-6">
                      <Separator />

                      {/* Education */}
                      {education.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> Học vấn
                          </h4>
                          <div className="space-y-2">
                            {education
                              .reduce((acc: any[], curr) => {
                                const gi = curr.groupIndex;
                                if (!acc[gi]) acc[gi] = {};
                                acc[gi][curr.key] = curr.value;
                                return acc;
                              }, [])
                              .map((edu, idx) => (
                                <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                                  {edu.school && <div><strong>Trường:</strong> {edu.school}</div>}
                                  {edu.degree && <div><strong>Chuyên ngành:</strong> {edu.degree}</div>}
                                  {edu.grade && <div><strong>Điểm:</strong> {edu.grade}</div>}
                                  {edu.date && <div><strong>Thời gian:</strong> {edu.date}</div>}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {experience.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Briefcase className="w-4 h-4" /> Kinh nghiệm làm việc
                          </h4>
                          <div className="space-y-2">
                            {experience
                              .reduce((acc: any[], curr) => {
                                const gi = curr.groupIndex;
                                if (!acc[gi]) acc[gi] = {};
                                acc[gi][curr.key] = curr.value;
                                return acc;
                              }, [])
                              .map((exp, idx) => (
                                <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                                  {exp.position && <div><strong>Vị trí:</strong> {exp.position}</div>}
                                  {exp.company && <div><strong>Công ty:</strong> {exp.company}</div>}
                                  {exp.date && <div><strong>Thời gian:</strong> {exp.date}</div>}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {skills.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3">Kỹ năng</h4>
                          <div className="space-y-2">
                            {skills.map((skill, idx) => (
                              <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm">
                                <strong>{skill.key.replace("_", " ").toUpperCase()}:</strong> {skill.value}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certificates */}
                      {certificates.length > 0 && (
                        <div>
                          <h4 className="font-semibold mb-3 flex items-center gap-2">
                            <Award className="w-4 h-4" /> Chứng chỉ
                          </h4>
                          <div className="space-y-2">
                            {certificates
                              .reduce((acc: any[], curr) => {
                                const gi = curr.groupIndex;
                                if (!acc[gi]) acc[gi] = {};
                                acc[gi][curr.key] = curr.value;
                                return acc;
                              }, [])
                              .map((cert, idx) => (
                                <div key={idx} className="bg-muted/50 p-3 rounded-lg text-sm space-y-1">
                                  {cert.certificate_name && <div><strong>Chứng chỉ:</strong> {cert.certificate_name}</div>}
                                  {cert.date && <div><strong>Ngày cấp:</strong> {cert.date}</div>}
                                </div>
                              ))}
                          </div>
                        </div>
                      )}

                      <Separator />

                      {/* Metadata */}
                      <div className="text-xs text-muted-foreground">
                        {/* <div>ID ứng viên: {applicant.id}</div> */}
                        <div>Ngày đăng tải: {formatDate(applicant.creationDate)}</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {applicantCount === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <Users className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Chưa có ứng viên nào</h3>
              <p className="text-muted-foreground">Vị trí này chưa nhận được CV ứng tuyển nào.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
