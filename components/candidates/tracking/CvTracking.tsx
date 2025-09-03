"use client";

import { useEffect, useState } from "react";
import {
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

function getIcon(isCompleted: boolean | null) {
  if (isCompleted === true) {
    return CircleCheckBig;
  }
  if (isCompleted === false) {
    return X;
  }
  return Loader;
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
        const url = `${API.CV.APPLICANT}/${encodeURIComponent(
          cvApplicantId
        )}/processes`;
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

  if (loading)
    return <p className="text-sm text-muted-foreground">Loading stages…</p>;
  if (err) return <p className="text-sm text-destructive">{err}</p>;
  if (!stages.length)
    return <p className="text-sm text-muted-foreground">No stages found</p>;

  return (
    <div className="space-y-8">
      <div className="flex items-start justify-between">
        {stages.map((stage, index) => {
          const Icon = getIcon(stage.isCompleted);
          const isCompleted = stage.isCompleted === true;
          const isFailed = stage.isCompleted === false;

          const isCurrent =
            stages[index - 1]?.isCompleted !== null && stage.isCompleted === null;
          
          const prevStageIsComplete = stages[index - 1]?.isCompleted === true;
          const prevStageIsFailed = stages[index - 1]?.isCompleted === false;

          return (
            <>
              <div
                key={stage.id}
                className="flex flex-col items-center relative z-10 w-full text-center"
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-12 h-12 rounded-full border-2 mb-2",
                    isCompleted
                      ? "bg-primary border-primary text-primary-foreground"
                      : isFailed
                      ? "bg-destructive border-destructive text-destructive-foreground"
                      : "bg-accent border-accent text-accent-foreground"
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>

                <div className="text-center">
                  <p
                    className={cn(
                      "text-sm font-medium",
                      isCompleted || isCurrent || isFailed
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {stage.stageName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Vòng {stage.order}
                  </p>
                  {stage.description && (
                    <p className="text-xs mt-1 text-muted-foreground italic">
                      {stage.description}
                    </p>
                  )}
                </div>
              </div>
              {index < stages.length - 1 && (
                <div
                  className={cn(
                    "flex-grow h-0.5 mt-6 -z-10",
                    isCompleted
                      ? "bg-primary"
                      : isFailed
                      ? "bg-destructive"
                      : (prevStageIsComplete || prevStageIsFailed)
                      ? "bg-primary"
                      : "bg-border"
                  )}
                />
              )}
            </>
          );
        })}
      </div>
    </div>
  );
}