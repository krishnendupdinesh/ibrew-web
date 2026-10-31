"use client";

import { usePathname } from "next/navigation";

// Shows its children everywhere EXCEPT on the /admin pages.
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname.startsWith("/admin")) return null;

  return <>{children}</>;
}