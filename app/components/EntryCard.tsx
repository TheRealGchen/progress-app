"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StagePill } from "./StagePill";
import { differenceInDays, parseISO } from "date-fns";

interface Stage {
  id: number;
  name: string;
  position: number;
  enteredAt: string | null;
}

interface EntryCardProps {
  id: number;
  company: string;
  title: string;
  priority: string;
  currentStage: Stage;
  stages: Stage[];
}

function isStale(enteredAt: string | null): boolean {
  if (!enteredAt) return false;
  return differenceInDays(new Date(), parseISO(enteredAt)) > 7;
}

export function EntryCard({ id, company, title, priority, currentStage, stages }: EntryCardProps) {
  const stale = isStale(currentStage?.enteredAt ?? null);
  const isLast = currentStage?.position === Math.max(...stages.map((s) => s.position));

  const priorityColors: Record<string, string> = {
    high: "bg-red-100 text-red-700",
    medium: "bg-orange-100 text-orange-700",
    low: "bg-slate-100 text-slate-600",
  };

  return (
    <Link href={`/entries/${id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
        <CardContent className="p-4 flex flex-col gap-2">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-medium text-sm truncate">{company}</p>
              <p className="text-xs text-muted-foreground truncate">{title}</p>
            </div>
            <span
              className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[priority] ?? priorityColors.medium}`}
            >
              {priority}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-1 flex-wrap">
            {currentStage && (
              <StagePill
                stageName={currentStage.name}
                entryId={id}
                isLast={isLast}
              />
            )}
            {stale && (
              <Badge variant="outline" className="text-orange-600 border-orange-300 text-xs">
                Stale
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
