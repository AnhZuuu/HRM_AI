"use client"

import type React from "react"

import { useState, Suspense } from "react"
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
import { Home, Users, Calendar, BarChart3, Settings, Bell, Search, Menu, X, User, LogOut, Plus, Mail, Megaphone, Building2Icon, CalendarRange, Shapes} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

const inter = Inter({ subsets: ["latin"] })

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: Home },
  { name: "Candidates", href: "/dashboard/candidates", icon: Users },
  { name: "Calendar", href: "/dashboard/calendar", icon: Calendar },
  { name: "Analytics", href: "/dashboard/analytics", icon: BarChart3 },
  { name: "System Config", href: "/dashboard/settings", icon: Settings },
  { name: "Mail", href: "/dashboard/mail", icon: Mail },
  { name: "Campaign", href: "/dashboard/campaigns", icon:  Megaphone},
  { name: "Department", href: "/dashboard/departments", icon:  Building2Icon},
  { name: "Schedule", href: "/dashboard/schedules", icon:  CalendarRange},
  { name: "Interview Type", href: "/dashboard/interviewTypes", icon:  Shapes},

]

export default function ClientLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

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
                    <Button variant="outline" size="sm" className="hidden sm:flex">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Candidate
                    </Button>

                    <Button variant="ghost" size="sm" className="relative">
                      <Bell className="h-5 w-5" />
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
                        3
                      </Badge>
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                          <div className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                          <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none">John Doe</p>
                            <p className="text-xs leading-none text-muted-foreground">john@company.com</p>
                          </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <User className="mr-2 h-4 w-4" />
                          <span>Profile</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>System Config</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <LogOut className="mr-2 h-4 w-4" />
                          <Link href="/" >
                            <span>Log out</span>
                          </Link>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>
            </div>

            {/* Page content */}
            <main className="flex-1">{children}</main>
          </div>
        </div>
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
                const isActive = pathname === item.href
                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${isActive ? "bg-blue-50 text-blue-600" : "text-gray-700 hover:text-blue-600 hover:bg-gray-50"
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
          <li className="mt-auto">
            {/* <div className="rounded-lg bg-blue-50 p-4">
              <h3 className="text-sm font-medium text-blue-900">Upgrade to Pro</h3>
              <p className="text-xs text-blue-700 mt-1">Get advanced analytics and unlimited candidates</p>
              <Button size="sm" className="mt-3 w-full bg-blue-600 hover:bg-blue-700">
                Upgrade Now
              </Button>
            </div> */}
          </li>
        </ul>
      </nav>
    </div>
  )
}
