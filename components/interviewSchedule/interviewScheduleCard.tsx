import { Clock, MapPin, PencilLineIcon, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

function initials(name?: string) {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  const i1 = parts[0]?.[0] ?? "";
  const i2 = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (i1 + i2).toUpperCase();
}


type Props = {
  item: InterviewSchedule;
  onEdit?: (id: string) => void;
  onCancel?: (id: string) => void;
};

export default function InterviewScheduleCard({ item, onEdit, onCancel }: Props) {
  const router = useRouter();
  const start = new Date(item.startTime);
  const end = item.endTime ? new Date(item.endTime) : null;
  const duration = start && end ? Math.round((end.getTime() - start.getTime()) / 60000) : null;

  const avatarUrl = (item as any)?.cvApplicant?.avatarUrl as string | undefined;

  return (
    <div className="w-full rounded-xl shadow-[0_10px_20px_rgba(0,0,0,0.15)] bg-white overflow-hidden">
      <div className="bg-blue-800 text-white text-center font-semibold py-2 px-4 rounded-t-xl">
        Ngày: {new Date(item.startTime).toLocaleDateString("vi-VN")}
      </div>

      <div className="p-4">
        <div className="flex justify-between items-center mb-2">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="font-semibold text-gray-900">
                {item.cvApplicant?.fullName || "Unknown Candidate"}
              </h3>
              <p className="text-sm text-gray-500">
                Vòng {item.round || "N/A"} • {item.interviewType}
              </p>
            </div>
          </div>

          {item.status && (
            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
              {item.status}
            </span>
          )}
        </div>

        <div className="flex items-center text-sm text-gray-700 mt-2">
          <MapPin className="w-4 h-4 mr-2 text-gray-500" />
          {item.cvApplicant?.campaignPosition?.department || "N/A"}
        </div>

        <div className="flex items-center text-sm text-gray-700 mt-3">
          <Clock className="w-4 h-4 mr-2 text-gray-500" />
          {start.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" })}
          {duration && ` (${duration} phút)`}
        </div>

        <div className="flex items-center text-sm text-gray-700 mt-2">
          <User className="w-4 h-4 mr-2 text-gray-500" />
          Người phỏng vấn: {item.interviewers || "N/A"}
        </div>

        {item.notes && (
          <div className="flex items-center text-sm text-gray-700 mt-1">
            <PencilLineIcon className="w-4 h-4 mr-2 text-gray-500" />
            Ghi chú: {item.notes}
          </div>
        )}

        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push(`/dashboard/schedules/${item.id}/edit`)}
          >
            Đặt lịch lại
          </Button>
          <Button
            variant="outline"
            className="flex-1 text-red-600 border-red-600 hover:bg-red-50"
            onClick={() => onCancel?.(item.id)}
          >
            Hủy
          </Button>
        </div>
      </div>
    </div>
  );
}
