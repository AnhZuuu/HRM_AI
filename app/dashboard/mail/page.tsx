"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Plus } from "lucide-react"

export default function EmailSender() {
  const { toast } = useToast()

  const [recipient, setRecipient] = useState("")
  const [subject, setSubject] = useState("")
  const [body, setBody] = useState("")

  const handleSend = () => {
    if (!recipient || !subject || !body) {
      toast({
        title: "Vui lòng điền đầy đủ thông tin.",
        variant: "destructive",
      })
      return
    }

    // Simulate sending
    toast({
      title: "Email đã được gửi!",
      description: `Tới: ${recipient}`,
    })

    // Reset fields
    setRecipient("")
    setSubject("")
    setBody("")
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl text-gray-900">📧 Mẫu gửi Email</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="recipient">Người nhận *</Label>
            <Input
              id="recipient"
              type="email"
              placeholder="example@example.com"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Tiêu đề *</Label>
            <Input
              id="subject"
              placeholder="Nhập tiêu đề email"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="body">Nội dung *</Label>
            <Textarea
              id="body"
              rows={6}
              placeholder="Nhập nội dung email tại đây..."
              value={body}
              onChange={(e) => setBody(e.target.value)}
            />
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSend} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              Gửi Email
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
