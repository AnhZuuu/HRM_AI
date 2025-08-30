import OnboardCreateClientPage from "@/components/onboard/handleCreateOnboard";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={<div className="p-4 text-sm text-muted-foreground">Loading…</div>}>
      <OnboardCreateClientPage />
    </Suspense>
  );
}
