"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { InterviewProcessDetail } from "@/components/interviewProcess/interview-process-detail"
import { authFetch } from "@/app/utils/authFetch"
import API from "@/api/api"
import { Loader2 } from "lucide-react"

type ApiEnvelope<T> = { code: number; status: boolean; message: string; data: T }

export default function InterviewProcessDetailPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()   // <-- read id from /[id]
  const [data, setData] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id) return
    const fetchData = async () => {
      try {
        setLoading(true)

        // If your API expects /:id
        const url = `${API.INTERVIEW.PROCESS}/${id}`

        const res = await authFetch(url)
        if (!res.ok) throw new Error(`HTTP error: ${res.status}`)

        const json: ApiEnvelope<any> = await res.json()
        if (json.status && json.data) {
          setData(json.data)
          // NOTE: setState is async; don't read `data` right after setData
          // console.log("data now:", json.data)
        } else {
          throw new Error(json.message || "Không thể lấy dữ liệu")
        }
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [id])

  if (!id) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        URL không hợp lệ (thiếu id)
      </main>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
        <span className="ml-2">Đang tải...</span>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center text-red-500">
        Lỗi: {error}
      </main>
    )
  }

  if (!data) {
    return (
      <main className="min-h-screen flex items-center justify-center text-gray-500">
        Không có dữ liệu
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-background">
      <InterviewProcessDetail data={data} />
    </main>
  )
}
