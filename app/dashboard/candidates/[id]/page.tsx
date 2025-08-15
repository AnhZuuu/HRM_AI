"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { Mail, Phone, MapPin, ExternalLink, FileText, ArrowLeft, CheckCircle2, XCircle, Clock, Star } from "lucide-react";
import { authFetch } from "@/app/utils/authFetch";
import API from "@/api/api";

// ---------- Types ----------
type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message: string;
  data: T;
};

type CvApplicantDetail = {
  cvApplicantId: string;
  type: string; // personal_info | contact | objective | education | skill | experience | interest | reference | ...
  key: string;  // e.g. "full_name", "dob", "phone", "school", "position"
  value: string;
  groupIndex: number;
};

type CvApplicant = {
  id: string;
  fullName: string;
  email: string;
  point: string; // "36/100"
  status: 0 | 1 | 2 | 3; // 0 Pending, 1 Reviewed, 2 Rejected, 3 Accepted
  campaignPositionId?: string | null;
  fileUrl?: string | null;
  fileAlt?: string | null;
  cvApplicantDetailModels?: CvApplicantDetail[];
  creationDate?: string;
};

// ---------- Helpers ----------
const STATUS_LABEL: Record<CvApplicant["status"], string> = {
  0: "Pending",
  1: "Reviewed",
  2: "Rejected",
  3: "Accepted",
};

const statusBadgeClass = (s: CvApplicant["status"]) => {
  switch (s) {
    case 3:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-purple-100 text-purple-800";
    case 0:
      return "bg-blue-100 text-blue-800";
    case 2:
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const shortId = (id?: string | null) => (id ? `${id.slice(0, 8)}…` : "—");

const initialSections = () => ({
  personal_info: [] as CvApplicantDetail[],
  contact: [] as CvApplicantDetail[],
  objective: [] as CvApplicantDetail[],
  education: [] as CvApplicantDetail[],
  skill: [] as CvApplicantDetail[],
  experience: [] as CvApplicantDetail[],
  interest: [] as CvApplicantDetail[],
  reference: [] as CvApplicantDetail[],
  other: [] as CvApplicantDetail[],
});

function groupDetails(details: CvApplicantDetail[] = []) {
  const buckets = initialSections();
  details.forEach((d) => {
    const key = (d.type as keyof ReturnType<typeof initialSections>) in buckets ? d.type : "other";
    (buckets as any)[key].push(d);
  });

  // sort by groupIndex to keep resume order
  Object.values(buckets).forEach((arr) => arr.sort((a, b) => a.groupIndex - b.groupIndex));
  return buckets;
}

function splitSkillValues(rows: CvApplicantDetail[]) {
  // backend sends multiple rows with key "skill"; also handle comma-separated just in case
  const list: string[] = [];
  rows.forEach((r) => {
    const parts = r.value.split(",").map((s) => s.trim()).filter(Boolean);
    list.push(...parts);
  });
  // de-dup
  return Array.from(new Set(list));
}

function field(rows: CvApplicantDetail[], key: string) {
  return rows.find((r) => r.key === key)?.value ?? "";
}

function formatISODate(iso?: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ---------- Page ----------
export default function CvApplicantDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { toast } = useToast();

  const [item, setItem] = useState<CvApplicant | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setErr(null);
      try {
        const res = await authFetch(`${API.CV.APPLICANT}/${params.id}`, { method: "GET" });
        const text = await res.text();
        const json: ApiEnvelope<CvApplicant> = text ? JSON.parse(text) : ({} as any);
        if (!res.ok || !json?.status) {
          throw new Error(json?.message || "Failed to load CV");
        }
        if (!cancelled) setItem(json.data);
      } catch (e: any) {
        if (!cancelled) {
          setErr(e?.message || "Unexpected error");
          toast({
            title: "Failed to load CV",
            description: e?.message || "Please try again.",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [params.id, toast]);

  const sections = useMemo(() => groupDetails(item?.cvApplicantDetailModels), [item?.cvApplicantDetailModels]);
  const skills = useMemo(() => splitSkillValues(sections.skill), [sections.skill]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" onClick={() => router.back()} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold">Candidate Detail</h1>
      </div>

      {/* Loading / Error */}
      {loading && <div className="text-sm text-gray-500 p-4">Loading profile…</div>}
      {!loading && err && (
        <div className="text-sm text-red-600 p-4">
          {err}
        </div>
      )}

      {!loading && !err && item && (
        <>
          {/* Header Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-16 w-16 text-xl">
                    <AvatarFallback>
                      {item.fullName?.split(" ").map((p) => p[0]).join("").slice(0, 2).toUpperCase() || "CV"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold">{item.fullName || "—"}</h2>
                      <Badge className={statusBadgeClass(item.status)}>{STATUS_LABEL[item.status]}</Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        <Star className="h-4 w-4" /> {item.point || "—"}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="inline-flex items-center gap-1">
                        <FileText className="h-4 w-4" /> Created {formatISODate(item.creationDate)}
                      </span>
                      <Separator orientation="vertical" className="h-4" />
                      <span className="inline-flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 text-xs">
                          {shortId(item.campaignPositionId)}
                        </span>
                        <span className="text-gray-400 text-xs">(position)</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  {item.fileUrl && (
                    <Button asChild className="gap-2">
                      <a href={item.fileUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4" />
                        Open CV File
                      </a>
                    </Button>
                  )}
                  <Button variant="outline" className="gap-2" onClick={() => navigator.clipboard.writeText(item.id)}>
                    Copy ID
                  </Button>
                </div>
              </div>

              {/* Contact row */}
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                <div className="flex items-center gap-2 text-gray-700">
                  <Mail className="h-4 w-4" />
                  {item.email || field(sections.contact, "email") || "—"}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <Phone className="h-4 w-4" />
                  {field(sections.contact, "phone") || "—"}
                </div>
                <div className="flex items-center gap-2 text-gray-700">
                  <MapPin className="h-4 w-4" />
                  {field(sections.contact, "address") || "—"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Content grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left column */}
            <div className="space-y-6 lg:col-span-2">
              {/* Objective */}
              {(sections.objective.length > 0 || field(sections.objective, "objective")) && (
                <Card>
                  <CardHeader>
                    <CardTitle>Objective</CardTitle>
                  </CardHeader>
                  <CardContent className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap">
                      {field(sections.objective, "objective")}
                    </p>
                  </CardContent>
                </Card>
              )}

              {/* Experience */}
              <Card>
                <CardHeader>
                  <CardTitle>Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  {sections.experience.length === 0 ? (
                    <div className="text-sm text-gray-500">No experience listed.</div>
                  ) : (
                    <ul className="space-y-5">
                      {/* Group experience pairs by groupIndex (company/position) */}
                      {Array.from(
                        new Map<number, CvApplicantDetail[]>(
                          sections.experience.reduce((acc, cur) => {
                            const arr = acc.get(cur.groupIndex) || [];
                            arr.push(cur);
                            acc.set(cur.groupIndex, arr);
                            return acc;
                          }, new Map<number, CvApplicantDetail[]>())
                        ).entries()
                      )
                        .sort((a, b) => a[0] - b[0])
                        .map(([g, rows]) => {
                          const company = rows.find((r) => r.key === "company")?.value;
                          const position = rows.find((r) => r.key === "position")?.value;
                          return (
                            <li key={g} className="relative pl-6">
                              <span className="absolute left-0 top-1.5 h-3 w-3 rounded-full bg-gray-300" />
                              <div className="font-medium">{position || "Position"}</div>
                              <div className="text-sm text-gray-600">{company || "Company"}</div>
                              {/* Add dates if you later store them */}
                            </li>
                          );
                        })}
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
                  {sections.education.length === 0 ? (
                    <div className="text-sm text-gray-500">No education listed.</div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                        <div>
                          <div className="font-medium">{field(sections.education, "school") || "—"}</div>
                          <div className="text-sm text-gray-600">
                            {field(sections.education, "degree") || "—"}
                          </div>
                        </div>
                        <div className="text-sm">
                          GPA: <span className="font-medium">{field(sections.education, "gpa") || "—"}</span>
                        </div>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Right column */}
            <div className="space-y-6">
              {/* Personal Info */}
              <Card>
                <CardHeader>
                  <CardTitle>Personal Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <Row label="Full name" value={field(sections.personal_info, "full_name") || item.fullName || "—"} />
                  <Row label="Date of birth" value={field(sections.personal_info, "dob") || "—"} />
                  <Row label="Gender" value={field(sections.personal_info, "gender") || "—"} />
                </CardContent>
              </Card>

              {/* Skills */}
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  {skills.length === 0 ? (
                    <div className="text-sm text-gray-500">No skills listed.</div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {skills.map((s) => (
                        <Badge key={s} variant="secondary" className="px-2 py-1">
                          {s}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Interests */}
              {sections.interest.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Interests</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 whitespace-pre-wrap">
                    {sections.interest.map((r, i) => (
                      <div key={i} className="mb-1">{r.value}</div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* References */}
              {sections.reference.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>References</CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-gray-700 space-y-2">
                    {sections.reference.map((r, i) => (
                      <div key={i}>{r.value}</div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Status Legend */}
              <Card>
                <CardHeader>
                  <CardTitle>Status</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2 text-sm">
                  <LegendRow icon={<Clock className="h-4 w-4" />} label="Pending" cls="bg-blue-100 text-blue-800" />
                  <LegendRow icon={<CheckCircle2 className="h-4 w-4" />} label="Accepted" cls="bg-green-100 text-green-800" />
                  <LegendRow icon={<Clock className="h-4 w-4" />} label="Reviewed" cls="bg-purple-100 text-purple-800" />
                  <LegendRow icon={<XCircle className="h-4 w-4" />} label="Rejected" cls="bg-red-100 text-red-800" />
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ---------- Small UI helpers ----------
function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="text-gray-500">{label}</div>
      <div className="font-medium text-right">{value}</div>
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
    <div className="flex items-center gap-2">
      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full ${cls}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </span>
    </div>
  );
}
