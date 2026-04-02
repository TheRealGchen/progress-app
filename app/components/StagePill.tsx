"use client";

import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

const STAGE_COLORS: Record<string, string> = {
  Saved: "bg-slate-100 text-slate-700 hover:bg-slate-200",
  Applied: "bg-blue-100 text-blue-700 hover:bg-blue-200",
  "Phone Screen": "bg-purple-100 text-purple-700 hover:bg-purple-200",
  Interview: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  Offer: "bg-green-100 text-green-700 hover:bg-green-200",
  Closed: "bg-gray-100 text-gray-600 hover:bg-gray-200",
  Toured: "bg-teal-100 text-teal-700 hover:bg-teal-200",
  Approved: "bg-emerald-100 text-emerald-700 hover:bg-emerald-200",
};

interface StagePillProps {
  stageName: string;
  entryId: number;
  isLast: boolean;
  onAdvance?: () => void;
  readOnly?: boolean;
}

export function StagePill({ stageName, entryId, isLast, onAdvance, readOnly = false }: StagePillProps) {
  const router = useRouter();

  async function handleClick(e: React.MouseEvent) {
    if (readOnly) return;
    e.preventDefault();
    e.stopPropagation();
    if (isLast) return;

    await fetch(`/api/entries/${entryId}/advance`, { method: "POST" });
    router.refresh();
    onAdvance?.();
  }

  const colorClass =
    STAGE_COLORS[stageName] ?? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200";

  return (
    <span
      onClick={handleClick}
      title={readOnly ? stageName : isLast ? "Final stage" : "Click to advance to next stage"}
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium transition-colors",
        colorClass,
        !readOnly && !isLast && "cursor-pointer"
      )}
    >
      {stageName}
      {!readOnly && !isLast && <span className="ml-1 opacity-50">→</span>}
    </span>
  );
}
