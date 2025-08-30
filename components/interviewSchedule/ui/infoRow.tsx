"use client";
export default function InfoRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1 py-2 md:grid md:grid-cols-[180px_1fr] md:gap-4 md:py-2 border-b last:border-b-0">
      <div className="text-xs font-medium uppercase tracking-wide text-muted-foreground md:pt-1">
        {label}
      </div>
      <div className="text-sm leading-6">{value ?? "—"}</div>
    </div>
  );
}
