import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { entries, stages, stageFields, notes, trackerTypes } from "@/db/schema";
import { eq } from "drizzle-orm";
import { StageTimeline } from "@/app/components/StageTimeline";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { ArchiveButton } from "@/app/components/ArchiveButton";

async function getEntry(id: number) {
  const [entry] = await db.select().from(entries).where(eq(entries.id, id));
  if (!entry) return null;

  const entryStages = await db
    .select()
    .from(stages)
    .where(eq(stages.entryId, id))
    .orderBy(stages.position);

  const enrichedStages = await Promise.all(
    entryStages.map(async (stage) => {
      const fields = await db
        .select()
        .from(stageFields)
        .where(eq(stageFields.stageId, stage.id));
      return { ...stage, fields };
    })
  );

  const entryNotes = await db
    .select()
    .from(notes)
    .where(eq(notes.entryId, id))
    .orderBy(notes.createdAt);

  const [type] = await db
    .select()
    .from(trackerTypes)
    .where(eq(trackerTypes.id, entry.trackerTypeId));

  return { ...entry, stages: enrichedStages, notes: entryNotes, trackerType: type };
}

const priorityColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-orange-100 text-orange-700",
  low: "bg-slate-100 text-slate-600",
};

export default async function EntryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const entry = await getEntry(parseInt(id));
  if (!entry) notFound();

  return (
    <div className="p-6 max-w-2xl mx-auto">
      {/* Back */}
      <Link
        href="/"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft size={14} />
        Dashboard
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-xl font-semibold">{entry.company}</h1>
            <span
              className={`text-xs px-2 py-0.5 rounded-full font-medium ${priorityColors[entry.priority] ?? priorityColors.medium}`}
            >
              {entry.priority}
            </span>
            {entry.archivedAt && (
              <Badge variant="outline" className="text-muted-foreground">
                Archived
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm mt-0.5">{entry.title}</p>
          <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
            <span>{entry.trackerType?.name}</span>
            {entry.source && <span>via {entry.source}</span>}
            {entry.url && (
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-0.5 hover:text-foreground"
              >
                <ExternalLink size={10} />
                Link
              </a>
            )}
          </div>
        </div>
        <ArchiveButton entryId={entry.id} isArchived={!!entry.archivedAt} />
      </div>

      {/* Timeline */}
      <StageTimeline
        entryId={entry.id}
        stages={entry.stages}
        notes={entry.notes}
        isArchived={!!entry.archivedAt}
      />
    </div>
  );
}
