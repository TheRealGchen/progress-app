"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-56 border-r bg-muted/30 flex flex-col p-4 gap-1 shrink-0">
      <div className="mb-4 px-2">
        <h1 className="text-lg font-semibold tracking-tight">Progress</h1>
      </div>
      <Link
        href="/"
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md text-sm hover:bg-accent transition-colors",
          pathname === "/" && "bg-accent font-medium"
        )}
      >
        <LayoutDashboard size={16} />
        Dashboard
      </Link>
    </aside>
  );
}
