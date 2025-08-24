"use client"

import type React from "react"
import { useState, Suspense, useEffect } from "react"
import { Inter } from "next/font/google"
import "./globals.css"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Home, Users, Mail, Megaphone, Building2Icon, CalendarRange, Shapes,
  Settings, Bell, Search, Menu, X, User, LogOut, Plus,
  BookUser,
  ReceiptText
} from "lucide-react"
import "react-toastify/dist/ReactToastify.css"
import { ToastContainer, toast } from "react-toastify"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

// ---------------- Added breadcrumb helper ----------------
const LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  candidates: "Ứng viên",
  campaigns: "Đợt tuyển dụng",
  mail: "Mail",
  schedules: "Lịch phỏng vấn",
  department: "Phòng ban",
  departments: "Phòng ban",
  interviewTypes: "Loại phỏng vấn",
  interviewProcess: "Quy trình phỏng vấn",
  interviewStage: "Vòng phỏng vấn",
  onboards: "on-board",
  campaignPosition: "Vị trí ứng tuyển",
}

function isLikelyId(seg: string) {
  return /^\d+$/.test(seg) || /^[0-9a-f-]{6,}$/i.test(seg)
}

function Breadcrumbs() {
  const pathname = usePathname()
  const segments = pathname.split("/").filter(Boolean)

  const items = []
  let hrefAcc = ""

  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]
    hrefAcc += `/${seg}`
    let label =
      LABELS[seg] ??
      seg.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())

    if (isLikelyId(seg)) {
      const parent = segments[i - 1]
      const parentLabel = LABELS[parent] ?? "Chi tiết"
      label = `Chi tiết ${parentLabel}`
    }

    items.push({
      label,
      href: i < segments.length - 1 ? hrefAcc : undefined,
    })
  }

  if (items.length === 0) return null

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
  )
}
// -----------------------------------------------------------

const inter = Inter({ subsets: ["latin"] })

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Tài khoản", href: "/dashboard/accounts", icon: BookUser  },
  { name: "Ứng viên", href: "/dashboard/candidates", icon: Users },
  { name: "Mail", href: "/dashboard/mail", icon: Mail },
  { name: "Campaign", href: "/dashboard/campaigns", icon: Megaphone },
  { name: "Campaign Position", href: "/dashboard/campaignPosition", icon: Megaphone },
  { name: "Department", href: "/dashboard/departments", icon: Building2Icon },
  { name: "Schedule", href: "/dashboard/schedules", icon: CalendarRange },
  { name: "Interview Type", href: "/dashboard/interviewTypes", icon: Shapes },
  { name: "Onboard", href: "/dashboard/onboards", icon: ReceiptText },
]




export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [name, setName] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const router = useRouter();
  const handleLogout = () => {

    try {
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      // Nếu muốn kỹ hơn thì localStorage.clear() nhưng thường không cần nếu bạn còn lưu state khác
      toast.success("Đăng xuất thành công!");
    } catch {
      toast.error("Không thể đăng xuất. Vui lòng thử lại.");
    } finally {
      // Cho toast hiện 1 chút rồi chuyển trang
      setTimeout(() => router.push("/"), 500);
    }
  };
  useEffect(() => {
    try {
      setName(localStorage.getItem("name") ?? "");
      setEmail(localStorage.getItem("email") ?? "");
    } catch {
      // ignore if blocked
    }
  }, []);
  return (
    <html lang="en">
      <body className={inter.className}>
        <div className="min-h-screen bg-gray-50">
          {/* Mobile sidebar overlay */}
          {sidebarOpen && (
            <div className="fixed inset-0 z-40 lg:hidden">
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" onClick={() => setSidebarOpen(false)} />
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
                  <SidebarContent />
                </Suspense>
              </div>
            </div>
          )}

          {/* Desktop sidebar */}
          <div className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
            <Suspense fallback={"Loading"}>
              <SidebarContent />
            </Suspense>
          </div>

          {/* Main content */}
          <div className="lg:pl-64">
            {/* Top navbar */}
            <div className="sticky top-0 z-10 bg-white shadow-sm border-b border-gray-200">
              <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
                <button type="button" className="lg:hidden" onClick={() => setSidebarOpen(true)}>
                  <Menu className="h-6 w-6" />
                </button>

                <div className="flex flex-1 items-center justify-between">
                  <div className="flex flex-1 items-center">
                    <div className="w-full max-w-lg lg:max-w-xs">
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                          <Search className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          className="block w-full rounded-md border-gray-300 pl-10 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                          placeholder="Search candidates..."
                          type="search"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="ml-4 flex items-center space-x-4">
                    {/* <Button variant="outline" size="sm" className="hidden sm:flex">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Button> */}

                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        3
                      </Badge>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <div className="h-8 w-8 rounded-full  flex items-center justify-center">
                            <User className="h-4 w-4 text-black" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">{name || "—"}</p>
                            <p className="text-xs leading-none text-muted-foreground">{email || "—"}</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <Link href="/profile" >
                            <span>Hồ sơ</span>
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>System Config</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <button
                            onClick={handleLogout}
                            className="inline bg-transparent p-0 m-0 border-0 cursor-pointer focus:outline-none">
                            <LogOut className="inline mr-2 h-4 w-4" />
                            <span>Đăng xuất</span>
                          </button>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* ---------------- Added breadcrumb here ---------------- */}
            <Breadcrumbs />
            {/* ------------------------------------------------------- */}

            {/* Page content */}
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

  )
}

function SidebarContent() {
  const pathname = usePathname()
  return (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4 shadow-lg">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-lg bg-blue-600 flex items-center justify-center">
            <Users className="h-5 w-5 text-white" />
          </div>
          <span className="ml-3 text-xl font-bold text-gray-900">HRM AI</span>
        </div>
      </div>
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {navigation.map((item) => {
                const isActive = pathname.startsWith(item.href)
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${isActive
                        ? "bg-blue-50 text-blue-600"
                        : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                        }`}
                    >
                      <item.icon
                        className={`h-6 w-6 shrink-0 ${isActive ? "text-blue-600" : "text-gray-400 group-hover:text-blue-600"
                          }`}
                      />
                      {item.name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </li>
          <li className="mt-auto"></li>
        </ul>
      </nav>
    </div>
  )
}
