"use client";

import HandleUpdateInteviewSchedule from "@/components/interviewSchedule/handleUpdateInterviewSchedule";
import { useParams } from "next/navigation";

export default function NewInterviewPage() {
    const {id} = useParams<{ id: string }>();
  return (
    <div className="container mx-auto p-6 space-y-6">
        <HandleUpdateInteviewSchedule id={id}/>
    </div>
  );
}