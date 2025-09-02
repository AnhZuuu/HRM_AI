"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasAnyRole, Role } from "@/lib/auth";

type Props = {
  children: React.ReactNode;
  allow: Role[];           // e.g., [Role.DeparmentManager] or [Role.Admin, Role.DeparmentManager]
  redirectTo?: string;     // default /403
};

export default function RequireRole({ children, allow, redirectTo = "/403" }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    const allowed = hasAnyRole(allow);
    setOk(allowed);
    if (!allowed) {
      router.replace(`${redirectTo}?from=${encodeURIComponent(pathname)}`);
    }
  }, [allow, redirectTo, pathname, router]);

  if (ok === null) return null; // or spinner
  if (!ok) return null;         // will be redirected
  return <>{children}</>;
}


// 4) Use it in a page
// // app/admin/page.tsx
// import RequireRole from "@/components/RequireRole";
// import { Role } from "@/lib/auth";

// export default function AdminPage() {
//   return (
//     <RequireRole allow={[Role.DeparmentManager]}>
//       <h1>Department Manager Dashboard</h1>
//     </RequireRole>
//   );
// }

// 5) Hide manager‑only UI bits
// "use client";
// import { isDepartmentManager } from "@/lib/auth";

// export function ManagerOnlyButton() {
//   if (!isDepartmentManager()) return null;
//   return <button className="btn">Create Department</button>;
// }