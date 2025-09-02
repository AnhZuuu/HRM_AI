"use client";

import { useEffect, useMemo, useState } from "react";
import {
    CheckCircle,
    Users,
    Award,
    UserCheck,
    MessageSquare,
    Calendar,
    Target,
    Star,
    FileText,
    X,
    CircleCheckBig,
    Loader,
} from "lucide-react";
import API from "@/api/api";
import { authFetch } from "@/app/utils/authFetch";
import { cn } from "@/lib/utils";

type Stage = {
    id: string;
    stageName: string;
    description?: string | null;
    order: number;
    totalTime?: number;
    isCompleted: boolean | null;
};

type ApiEnvelope<T> = {
    code: number;
    status: boolean;
    message: string;
    data: T;
};

const stageIcons = [
    Loader,    // order 1
    CircleCheckBig,          // order 2
    X,    ,          // order 3
    UserCheck,      // order 4
    MessageSquare,  // order 5
    Calendar,       // order 6
    Target,         // order 7
    Star,           // order 8
    FileText,       // order 9
    CheckCircle,    // order 10+
];

function getIcon(order: number) {
    // orders are 1-based, icons array is 0-based
    return stageIcons[order - 1] ?? CheckCircle;
}

type Props = {
    cvApplicantId: string;
};

export function InterviewTracker({ cvApplicantId }: Props) {
    const [stages, setStages] = useState<Stage[]>([]);
    const [loading, setLoading] = useState(true);
    const [err, setErr] = useState<string | null>(null);

    useEffect(() => {
        let ignore = false;
        const abort = new AbortController();

        async function load() {
            setLoading(true);
            try {
                const url = `${API.CV.APPLICANT}/${encodeURIComponent(cvApplicantId)}/processes`;
                const res = await authFetch(url, { signal: abort.signal });
                const payload: ApiEnvelope<any[]> =
                    typeof res.json === "function" ? await res.json() : res;

                if (!payload?.status || !Array.isArray(payload.data)) {
                    throw new Error(payload?.message || "Invalid API response");
                }

                const normalized: Stage[] = payload.data
                    .map((s) => ({
                        id: s.id,
                        stageName: s.stageName,
                        description: s.description ?? null,
                        order: s.order,
                        totalTime: s.totalTime ?? 0,
                        isCompleted: s.isCompleted,
                    }))
                    .sort((a, b) => a.order - b.order);

                if (!ignore) setStages(normalized);
            } catch (e: any) {
                if (!ignore && e?.name !== "AbortError") {
                    setErr(e?.message || "Failed to load interview processes.");
                }
            } finally {
                if (!ignore) setLoading(false);
            }
        }

        load();
        return () => {
            ignore = true;
            abort.abort();
        };
    }, [cvApplicantId]);

    const { currentStageIndex, progressPercent } = useMemo(() => {
        if (!stages.length) return { currentStageIndex: -1, progressPercent: 0 };
        const completed = stages.filter((s) => s.isCompleted === true).length;
        const segments = Math.max(stages.length - 1, 1);
        const pct = (completed / segments) * 100;

        const idx =
            stages.findIndex((s) => s.isCompleted === null) !== -1
                ? stages.findIndex((s) => s.isCompleted === null)
                : stages.length - 1;

        return { currentStageIndex: idx, progressPercent: pct };
    }, [stages]);

    if (loading) return <p className="text-sm text-muted-foreground">Loading stages…</p>;
    if (err) return <p className="text-sm text-destructive">{err}</p>;
    if (!stages.length) return <p className="text-sm text-muted-foreground">No stages found</p>;

    return (
        <div className="space-y-8">
            <div className="relative">
                <div className="flex items-center justify-between">
                    {stages.map((stage, index) => {
                        const Icon = getIcon(stage.order);
                        const isCompleted = stage.isCompleted === true;
                        const isCurrent = index === currentStageIndex;

                        return (
                            <div key={stage.id} className="flex flex-col items-center relative z-10">
                                <div
                                    className={cn(
                                        "flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2",
                                        isCompleted
                                            ? "bg-primary border-primary text-primary-foreground"
                                            : isCurrent
                                                ? "bg-accent border-accent text-accent-foreground"
                                                : "bg-muted border-border text-muted-foreground"
                                    )}
                                >
                                    <Icon className="w-5 h-5" />
                                </div>


                                <div className="text-center">
                                    <p
                                        className={cn(
                                            "text-sm font-medium",
                                            isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                                        )}
                                    >
                                        {stage.stageName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">Vòng {stage.order}</p>
                                    {stage.description && (
                                        <p className="text-xs mt-1 text-muted-foreground italic">
                                            {stage.description}
                                        </p>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="absolute top-6 left-6 right-6 h-0.5 bg-border -z-10">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>
        </div>
    );
}
