"use client";

import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StagePill } from "./StagePill";
import { differenceInDays, format, formatDistanceToNowStrict, parseISO } from "date-fns";

interface Stage {
  id: number;
  name: string;
  position: number;
  enteredAt: string | null;
}

function StageProgress({ stages, currentStage }: { stages: Stage[]; currentStage: Stage }) {
  const sorted = [...stages].sort((a, b) => a.position - b.position);
  const currentIdx = sorted.findIndex((s) => s.id === currentStage?.id);

  return (
    <div className="flex items-center w-full mt-2">
      {sorted.map((stage, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isLast = idx === sorted.length - 1;

        return (
          <div key={stage.id} className="flex items-center flex-1 min-w-0 last:flex-none">
            {/* Bubble */}
            <div title={stage.name} className="shrink-0 relative group">
              {isDone ? (
                <div className="w-3 h-3 rounded-full bg-green-500" />
              ) : isCurrent ? (
                <div className="w-3 h-3 rounded-full bg-yellow-400 ring-2 ring-yellow-200" />
              ) : (
                <div className="w-3 h-3 rounded-full border-2 border-dashed border-muted-foreground/30" />
              )}
              {/* Tooltip */}
              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-1.5 py-0.5 rounded text-[10px] bg-popover border text-popover-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 shadow-sm">
                {stage.name}
              </span>
            </div>
            {/* Connector line */}
            {!isLast && (
              <div className={`h-px flex-1 mx-0.5 ${isDone ? "bg-green-400" : "bg-muted-foreground/20"}`} />
            )}
          </div>
        );
      })}
    </div>
  );
}

interface StageField {
  fieldKey: string;
  fieldValue: string | null;
}

interface EntryCardProps {
  id: number;
  company: string;
  title: string;
  priority: string;
  currentStage: Stage;
  stages: Stage[];
  currentStageFields?: StageField[];
}

function isStale(enteredAt: string | null): boolean {
  if (!enteredAt) return false;
  return differenceInDays(new Date(), parseISO(enteredAt)) > 7;
}

function relativeDate(enteredAt: string | null): string | null {
  if (!enteredAt) return null;
  const days = differenceInDays(new Date(), parseISO(enteredAt));
  if (days === 0) return "today";
  return formatDistanceToNowStrict(parseISO(enteredAt), { addSuffix: true });
}

export function EntryCard({ id, company, title, priority, currentStage, stages, currentStageFields = [] }: EntryCardProps) {
  const stale = isStale(currentStage?.enteredAt ?? null);
  const isLast = currentStage?.position === Math.max(...stages.map((s) => s.position));
  const lastUpdated = relativeDate(currentStage?.enteredAt ?? null);

  const scheduledAt = currentStageFields.find((f) => f.fieldKey === "scheduled_at")?.fieldValue ?? null;
  const scheduledLabel = scheduledAt
    ? format(parseISO(scheduledAt), "MMM d 'at' h:mm a")
    : null;

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
            {lastUpdated && (
              <span className="text-xs text-muted-foreground ml-auto">
                {lastUpdated}
              </span>
            )}
          </div>
          {scheduledLabel && (
            <div className="flex items-center gap-1.5 text-xs text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              <span>{scheduledLabel}</span>
            </div>
          )}
          {stages.length > 1 && currentStage && (
            <StageProgress stages={stages} currentStage={currentStage} />
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
