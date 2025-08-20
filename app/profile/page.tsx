"use client";

import { useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Copy, Mail, Phone, ShieldCheck, ShieldAlert, User2, Calendar, IdCard, Building2, Edit3, KeyRound } from "lucide-react";
import { copy, formatDate, formatDOB, initials } from "../utils/helper";
import { genderLabel } from "../utils/enum";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ui/use-toast";

const demo: Account = {
  firstName: "Tien",
  lastName: "Le",
  username: "TienLe",
  email: "thuytienln238@gmail.com",
  gender: 0,
  dateOfBirth: "2000-08-20",
  phoneNumber: "0987654321",
  departmentId: null,
  image: null,
  emailConfirmed: true,
  phoneNumberConfirmed: false,
  accountRoles: [
    {
      totalReputation: 0,
      status: 0,
      role: 3,
      roleName: "Employee",
      id: "77f3881f-1e73-41f9-a8e5-08dddfc80cae"
    },
  ],
  id: "8999bf0a-c863-458f-a8e4-08dddfc80cae",
  creationDate: "2025-08-20T09:00:45.5484266",
  modificationDate: "2025-08-20T09:01:31.4364312",
  isDeleted: false,
};

export default function ProfilePage({ data = demo }: { data?: Account }) {
  const fullName = useMemo(() => `${data.firstName} ${data.lastName}`.trim(), [data]);
  const primaryRole = data.accountRoles?.[0];
  const router = useRouter();
const params = useSearchParams();
  const { toast } = useToast();
  
  useEffect(() => {
    if (params.get("pwd") === "changed") {
      toast({
        title: "Đổi mật khẩu thành công",
        description: "Bạn có thể dùng mật khẩu mới từ bây giờ.",
      });
      // remove the query param from the URL so it doesn't re-toast on refresh
      router.replace("/profile");
    }
  }, [params, router, toast]);

  return (
    <div className="mx-auto max-w-6xl p-4 md:p-8">
      {/* Top banner */}
      <div className="rounded-3xl border bg-gradient-to-br from-muted/40 to-background p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-5">
            <Avatar className="h-20 w-20 rounded-2xl ring-1 ring-border">
              {data.image ? (
                <AvatarImage src={data.image} alt={fullName} />
              ) : (
                <AvatarFallback className="text-2xl font-semibold">
                  {initials(data.firstName, data.lastName)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{fullName}</h1>
                {primaryRole?.roleName && (
                  <Badge variant="secondary" className="text-xs">{primaryRole.roleName}</Badge>
                )}
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <User2 className="h-4 w-4" />
                <span>@{data.username}</span>
                <Separator orientation="vertical" className="h-4" />
                <Calendar className="h-4 w-4" />
                <span>{formatDOB(data.dateOfBirth ?? "")}</span>
                <Separator orientation="vertical" className="h-4" />
                <span>{genderLabel[data.gender] ?? "—"}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="default" size="sm" onClick={() => router.push("/profile/edit")}> 
              <Edit3 className="h-4 w-4 mr-2" /> Chỉnh sửa
            </Button>
            <Button variant="outline" size="sm" onClick={() => router.push("/profile/changePassword")}> 
              <KeyRound className="h-4 w-4 mr-2" /> Đổi mật khẩu
            </Button>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* Left column: Contact */}
        <Card className="md:col-span-5 lg:col-span-5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Liên lạc</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <dl className="space-y-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Mail className="h-4 w-4 shrink-0" />
                  <span className="truncate">{data.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  {data.emailConfirmed ? (
                    <Badge className="bg-emerald-600 hover:bg-emerald-600">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" /> Đã xác minh
                    </Badge>
                  ) : (
                    <Badge variant="destructive">
                      <ShieldAlert className="h-3.5 w-3.5 mr-1" /> Chưa xác minh
                    </Badge>
                  )}
                  <Button aria-label="Copy email" variant="ghost" size="icon" onClick={() => copy(data.email)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 min-w-0">
                  <Phone className="h-4 w-4 shrink-0" />
                  <span className="truncate">{data.phoneNumber || "—"}</span>
                </div>
                {data.phoneNumber && (
                  <Button aria-label="Copy phone" variant="ghost" size="icon" onClick={() => copy(data.phoneNumber ?? "")}>
                    <Copy className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </dl>
          </CardContent>
        </Card>

        {/* Right column: Account */}
        <Card className="md:col-span-7 lg:col-span-7">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">Account</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Account ID</div>
                <div className="flex items-center gap-2 min-w-0">
                  <IdCard className="h-4 w-4 shrink-0" />
                  <span className="truncate">{data.id}</span>
                  <Button aria-label="Copy ID" variant="ghost" size="icon" onClick={() => copy(data.id)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Phòng ban</div>
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 shrink-0" />
                  <span className="truncate">{data.departmentId ?? "Chưa có phòng ban"}</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Tạo lúc</div>
                <div>{formatDate(data.creationDate)}</div>
              </div>

              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Chỉnh sửa lần cuối</div>
                <div>{formatDate(data.modificationDate)}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
