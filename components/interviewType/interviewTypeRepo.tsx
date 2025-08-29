import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";

export interface InterviewType { name: string; description?: string }

export type InterviewTypeRecord = {
  id: string;
  code: string;
  name: string;
  description: string | null;
};

type ApiEnvelope<T> = {
  code: number;
  status: boolean;
  message?: string;
  data: T;
};


export async function getInterviewTypeById(id: string): Promise<InterviewTypeRecord | null> {
  if (!id) return null;

  const url = `${API.INTERVIEW.TYPE}/${id}`;
  const doFetch: typeof fetch =
    typeof authFetch === "function" ? (authFetch as any) : fetch;

  const res = await doFetch(url, { method: "GET", cache: "no-store" });
  const text = await res.text();
  const json: ApiEnvelope<any> = text ? JSON.parse(text) : ({} as any);

  if (!res.ok || json?.status === false) {
    throw new Error(json?.message || `Không tải được loại phỏng vấn (${res.status})`);
  }

  const x = json?.data;
  if (!x) return null;

  return {
    id: x.id,
    code: x.code,
    name: x.name,
    description: x.description ?? null,
  };
}


export type UpdateInterviewTypePayload = {
  name: string;
  description?: string; 
};

export async function updateInterviewType(id: string, body: UpdateInterviewTypePayload): Promise<void> {
  if (!id) throw new Error("Thiếu id.");
  if (!body?.name?.trim()) throw new Error("Tên không được để trống.");

  const url = `${API.INTERVIEW.TYPE}/${id}`;
  const doFetch: typeof fetch =
    typeof authFetch === "function" ? (authFetch as any) : fetch;

  const res = await doFetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: body.name.trim(),
      description: body.description?.trim?.() ?? null,
    }),
  });

  const text = await res.text();
  if (res.status === 204) return;

  const json: ApiEnvelope<any> = text ? JSON.parse(text) : ({} as any);
  if (!res.ok || json?.status === false) {
    throw new Error(json?.message || `Cập nhật thất bại (${res.status})`);
  }
}

