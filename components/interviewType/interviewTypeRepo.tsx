// /mocks/interviewTypeRepo.ts
export interface InterviewType { name: string; description?: string }

export type InterviewTypeRecord = {
  id: string;                // internal ID
  code: string;              // business code, immutable
  name: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
};

const STORAGE_KEY = "mock_interview_types_v3";

function read(): InterviewTypeRecord[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : [];
}
function write(data: InterviewTypeRecord[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}
function uuid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return "it_" + Math.random().toString(36).slice(2, 10);
}
function slugToCode(name: string): string {
  const base = name
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")   // strip accents
    .replace(/[^a-zA-Z0-9]+/g, "_")                    // non-alnum -> _
    .replace(/^_+|_+$/g, "")                           // trim _
    .toUpperCase();
  return base || `TYPE_${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}
function uniqueCode(base: string, all: InterviewTypeRecord[]) {
  let code = base;
  let i = 2;
  while (all.some(x => x.code === code)) code = `${base}_${i++}`;
  return code;
}

// Seed
export async function seedInterviewTypesIfEmpty() {
  const cur = read();
  if (cur.length) return;
  const now = new Date().toISOString();
  write([
    { id: uuid(), code: "ONLINE", name: "Phỏng vấn online", description: "Qua video call", createdAt: now, updatedAt: now },
    { id: uuid(), code: "ONSITE", name: "Trực tiếp",        description: "Tại văn phòng", createdAt: now, updatedAt: now },
    { id: uuid(), code: "PHONE",  name: "Điện thoại",       description: "Gọi nhanh",     createdAt: now, updatedAt: now },
  ]);
}

// CRUD
export async function listInterviewTypes(): Promise<InterviewTypeRecord[]> {
  return read().sort((a,b) => a.name.localeCompare(b.name));
}
export async function getInterviewTypeById(id: string) {
  return read().find(x => x.id === id) ?? null;
}
export async function getInterviewTypeByCode(code: string) {
  return read().find(x => x.code === code) ?? null;
}
export async function createInterviewType(input: InterviewType): Promise<InterviewTypeRecord> {
  const data = read();
  const id = uuid();
  const code = uniqueCode(slugToCode(input.name), data);
  const now = new Date().toISOString();
  const rec: InterviewTypeRecord = {
    id,
    code,                           // auto & immutable
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    createdAt: now,
    updatedAt: now,
  };
  data.push(rec);
  write(data);
  return rec;
}
export async function updateInterviewType(id: string, input: InterviewType): Promise<InterviewTypeRecord> {
  const data = read();
  const idx = data.findIndex(x => x.id === id);
  if (idx === -1) throw new Error("Không tìm thấy.");
  const now = new Date().toISOString();
  const merged: InterviewTypeRecord = {
    ...data[idx],
    name: input.name.trim(),
    description: input.description?.trim() || undefined,
    updatedAt: now,
  };
  data[idx] = merged;
  write(data);
  return merged;
}
export async function deleteInterviewType(id: string): Promise<void> {
  write(read().filter(x => x.id !== id));
}


export async function countSchedulesUsingTypeIdOrCode(id: string): Promise<number> {
  const rec = await getInterviewTypeById(id);
  const all = await listInterviewTypes();
  if (!rec) return 0;
  return all.filter(iv =>
    (iv as any).interviewTypeId === rec.id ||         // new way
    (iv as any).interviewTypeCode === rec.code        // legacy way
  ).length;
}