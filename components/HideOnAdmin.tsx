"use client";

import { usePathname } from "next/navigation";
import { Suspense } from "react";

function HideOnAdminContent({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return <>{children}</>;
}

// Shows its children everywhere EXCEPT on the /admin pages.
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<>{children}</>}>
      <HideOnAdminContent>{children}</HideOnAdminContent>
    </Suspense>
  );
}