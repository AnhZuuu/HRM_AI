"use client";
import { useEffect, useRef } from "react";
import { Textarea } from "@/components/ui/textarea";

type FancyTextareaProps = {
  value: string;
  onChange: (next: string | ((prev: string) => string)) => void;
  maxLength?: number;
  placeholder?: string;
  suggestions?: string[];
  minHeight?: number; // px
};

export function FancyTextarea({
  value,
  onChange,
  maxLength = 800,
  placeholder = "Đánh giá ứng viên...",
  suggestions = ["Đúng giờ", "Kỹ năng tốt", "Giao tiếp rõ ràng", "Cần đào sâu thêm"],
  minHeight = 120,
}: FancyTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Autosize height
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = Math.max(el.scrollHeight, minHeight) + "px";
  }, [value, minHeight]);

  return (
    <div className="group">
      <Textarea
        ref={ref}
        value={value}
        maxLength={maxLength}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          resize-none min-h-[120px]
          rounded-2xl border border-gray-200
          bg-gradient-to-b from-white to-gray-50/70
          shadow-sm
          focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:border-primary/40
          text-sm p-4 transition-colors
          placeholder:text-gray-400
        "
      />

      {/* Actions row */}
      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-2">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange((prev) => (prev ? `${prev.trim()} ${s}` : s))}
              className="text-xs rounded-full border border-gray-200 bg-white px-2.5 py-1 hover:bg-gray-50"
              title={`Chèn: ${s}`}
            >
              {s}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500">{value.length}/{maxLength}</div>
      </div>
    </div>
  );
}
