"use client";

import type React from "react";
import { useState, Suspense, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Home, Users, Mail, Megaphone, Building2Icon, CalendarRange, Shapes,
  Settings, Menu, X, User, LogOut, ReceiptText, BriefcaseBusiness,
} from "lucide-react";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer, toast } from "react-toastify";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { getRoleLabels, hasAnyRole, Role } from "@/lib/auth";

/* ===== Breadcrumbs (unchanged) ===== */
const LABELS: Record<string, string> = {
  accounts: "Tài khoản",
  dashboard: "Dashboard",
  candidates: "Ứng viên",
  campaigns: "Đợt tuyển dụng",
  mail: "Mẫu mail",
  schedules: "Lịch phỏng vấn",
  department: "Phòng ban",
  departments: "Phòng ban",
  interviewTypes: "Loại phỏng vấn",
  interviewProcess: "Quy trình phỏng vấn",
  interviewStage: "Vòng phỏng vấn",
  onboards: "on-board",
  campaignPosition: "Vị trí ứng tuyển",
  new: "Tạo mới",
  edit: "Chỉnh sửa",
  suggest: "Gợi ý"
};
const inter = Inter({ subsets: ["latin"] });

function isLikelyId(seg: string) {
  return /^\d+$/.test(seg) || /^[0-9a-f-]{6,}$/i.test(seg);
}
function Breadcrumbs() {
  const pathname = usePathname();
  const segments = pathname.split("/").filter(Boolean);
  const items: { label: string; href?: string }[] = [];
  let hrefAcc = "";
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i];
    hrefAcc += `/${seg}`;
    let label =
      LABELS[seg] ??
      seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    if (isLikelyId(seg)) {
      const parent = segments[i - 1];
      const parentLabel = LABELS[parent] ?? "Chi tiết";
      label = `Chi tiết ${parentLabel}`;
    }
    items.push({ label, href: i < segments.length - 1 ? hrefAcc : undefined });
  }
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className="py-2 px-4 sm:px-6 lg:px-8 bg-white border-b border-gray-200">
      <ol className="flex items-center gap-2 text-sm text-muted-foreground">
        {items.map((it, idx) => (
          <li key={idx} className="flex items-center gap-2">
            {it.href ? (
              <Link href={it.href} className="hover:text-foreground">
                {it.label}
              </Link>
            ) : (
              <span className="font-medium text-foreground">{it.label}</span>
            )}
            {idx < items.length - 1 && <span className="select-none">›</span>}
          </li>
        ))}
      </ol>
    </nav>
  );
}

/* ===== Nav items (unchanged) ===== */
  function getDepartmentIdFromLS(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return localStorage.getItem("departmentId");
  } catch {
    return null;
  }
}

const depId = getDepartmentIdFromLS();

type NavItem = { name: string; href: string; icon: React.ComponentType<{ className?: string }>; allow?: Role[]; };
const NAVIGATION: NavItem[] = [
  { name: "Thống kê", href: "/dashboard", icon: Home },
  { name: "Tài khoản", href: "/dashboard/accounts", icon: Users, allow: [Role.HR, Role.Admin] },
  { name: "Ứng viên", href: "/dashboard/candidates", icon: Users, allow: [Role.HR, Role.DeparmentManager, Role.Admin] },
  { name: "Mail", href: "/dashboard/mail", icon: Mail, allow: [Role.Admin] },
  { name: "Đợt tuyển dụng", href: "/dashboard/campaigns", icon: Megaphone, allow: [Role.HR, Role.DeparmentManager] },
  { name: "Vị trí ứng tuyển", href: "/dashboard/campaignPosition", icon: BriefcaseBusiness, allow: [Role.HR, Role.DeparmentManager] },
  { name: "Phòng ban", href: "/dashboard/departments", icon: Building2Icon, allow: [Role.HR, Role.Admin] },
  { name: "Phòng ban", href: `/dashboard/departments/${depId}`, icon: Building2Icon, allow: [ Role.DeparmentManager] },
  { name: "Lịch", href: "/dashboard/schedules", icon: CalendarRange },
  { name: "Loại phỏng vấn", href: "/dashboard/interviewTypes", icon: Shapes, allow: [Role.HR, Role.Admin] },
  { name: "Onboard", href: "/dashboard/onboards", icon: ReceiptText, allow: [Role.HR, Role.DeparmentManager] },
];

/* ===== Layout (top navbar removed) ===== */
export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [role, setRole] = useState<string>("");
  const router = useRouter();

  const handleLogout = () => {
    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      localStorage.clear();
      toast.success("Đăng xuất thành công!");
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      setTimeout(() => router.push("/"), 500);
    }
  };

  useEffect(() => {
    try {
      setName(localStorage.getItem("name") ?? "");
      setEmail(localStorage.getItem("email") ?? "");
      setRole(getRoleLabels().join(" / "));
    } catch {}
  }, []);

  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Mobile sidebar drawer */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-gray-600/75" onClick={() => setSidebarOpen(false)} />
              <div className="relative flex w-full max-w-xs flex-1 flex-col bg-white">
                <div className="absolute top-0 right-0 -mr-12 pt-2">
                  <button
                    type="button"
                    className="ml-1 flex h-10 w-10 items-center justify-center rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                    onClick={() => setSidebarOpen(false)}
                  >
                    <X className="h-6 w-6 text-white" />
                  </button>
                </div>
                <Suspense fallback={"Loading"}>
                  <SidebarContent name={name} email={email} role={role} onLogout={handleLogout} />
                </Suspense>
              </div>
            </div>
          )}

          {/* Desktop sidebar only */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <Suspense fallback={"Loading"}>
              <SidebarContent name={name} email={email} role={role} onLogout={handleLogout} />
            </Suspense>
          </div>

          {/* Main area (no top bar) */}
          <div className="lg:pl-64">
            {/* Mobile floating trigger to open sidebar */}
            <button
              type="button"
              className="fixed bottom-4 right-4 z-30 inline-flex items-center justify-center rounded-full p-3 shadow-md bg-white border text-gray-700 lg:hidden"
              aria-label="Open navigation"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Breadcrumbs + Page content */}
            <Breadcrumbs />
            <main className="flex-1">{children}</main>
          </div>
        </div>

        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          style={{ zIndex: 9999 }}
        />
      </body>
    </html>
  );
}

/* ===== Sidebar (already owns brand + user menu) ===== */
function SidebarContent({
  name,
  email,
  role,
  onLogout,
}: {
  name?: string;
  email?: string;
  role?: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();
  const [items, setItems] = useState<NavItem[]>([]);

  useEffect(() => {
    setItems(NAVIGATION.filter((it) => !it.allow || hasAnyRole(it.allow)));
  }, []);

  return (
    <div className="flex grow flex-col overflow-y-auto bg-white px-6 pb-4 shadow-lg">
      <nav className="flex flex-1 flex-col">
        {/* Brand */}
        <div className="flex h-16 shrink-0 items-center">
          <div className="flex items-center">
            <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
              <Users className="h-5 w-5 text-white" />
            </div>
            <span className="ml-3 text-xl font-bold text-gray-900">HRM AI</span>
          </div>
        </div>

        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {items.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                        isActive
                          ? "bg-blue-50 text-blue-600"
                          : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                      }`}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${
                          isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                        }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>

          {/* User dropdown pinned bottom */}
          <li className="mt-auto">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start px-2">
                  <div className="h-8 w-8 rounded-full flex items-center justify-center mr-2">
                    <User className="h-4 w-4 text-black" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-sm font-medium leading-none">{name || "—"}</span>
                    <span className="text-xs leading-none text-muted-foreground">{role || "—"}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>

              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{name || "—"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{email || "—"}</p>
                    <p className="text-xs leading-none text-muted-foreground">{role || "—"}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <Link href="/profile">
                    <span>Hồ sơ</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>System Config</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <button
                    onClick={onLogout}
                    className="inline bg-transparent p-0 m-0 border-0 cursor-pointer focus:outline-none w-full text-left"
                  >
                    <LogOut className="inline mr-2 h-4 w-4" />
                    <span>Đăng xuất</span>
                  </button>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </ul>
      </nav>
    </div>
  );
}
