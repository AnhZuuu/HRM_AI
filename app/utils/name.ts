import { Account } from "@/components/interviewSchedule/sampleData/mockData";

export function displayName(acc?: Account) {
  return (
    `${acc?.firstName ?? ""} ${acc?.lastName ?? ""}`.trim() ||
    acc?.username ||
    acc?.email ||
    ""
  );
}

export function namesFromIds(ids: string[], employees: Account[]) {
  return ids
    .map((id) => displayName(employees.find((e) => e.id === id)) || id)
    .filter(Boolean)
    .join(", ");
}
