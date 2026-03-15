"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { ChevronRight, ChevronLeft, Circle, CheckCircle2 } from "lucide-react";
import { StageFieldsEditor } from "./StageFieldsEditor";

interface StageField {
  id: number;
  fieldKey: string;
  fieldValue: string | null;
}

interface Stage {
  id: number;
  name: string;
  position: number;
  enteredAt: string | null;
  custom: boolean;
  fields: StageField[];
}

interface Note {
  id: number;
  body: string;
  createdAt: string;
}

interface StageTimelineProps {
  entryId: number;
  stages: Stage[];
  notes: Note[];
  isArchived: boolean;
}

export function StageTimeline({ entryId, stages, notes, isArchived }: StageTimelineProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const [retreating, setRetreating] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);

  const currentStageIdx = [...stages]
    .map((s, i) => ({ ...s, i }))
    .filter((s) => s.enteredAt != null)
    .sort((a, b) => b.i - a.i)[0]?.i ?? 0;

  const isLastStage = currentStageIdx === stages.length - 1;

  async function handleRetreat() {
    setRetreating(true);
    await fetch(`/api/entries/${entryId}/retreat`, { method: "POST" });
    setRetreating(false);
    router.refresh();
  }

  async function handleAdvance() {
    setAdvancing(true);
    await fetch(`/api/entries/${entryId}/advance`, { method: "POST" });
    setAdvancing(false);
    router.refresh();
  }

  async function handleAddNote(e: React.FormEvent) {
    e.preventDefault();
    if (!noteBody.trim()) return;
    setAddingNote(true);
    await fetch(`/api/entries/${entryId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body: noteBody }),
    });
    setNoteBody("");
    setAddingNote(false);
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Stage navigation buttons */}
      {!isArchived && (
        <div className="flex items-center gap-2">
          {currentStageIdx > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetreat}
              disabled={retreating}
              className="gap-1.5"
            >
              <ChevronLeft size={14} />
              {retreating ? "Going back..." : `Back to ${stages[currentStageIdx - 1]?.name}`}
            </Button>
          )}
          {!isLastStage && (
            <Button
              onClick={handleAdvance}
              disabled={advancing}
              className="gap-1.5"
              size="sm"
            >
              <ChevronRight size={14} />
              {advancing ? "Moving..." : `Move to ${stages[currentStageIdx + 1]?.name}`}
            </Button>
          )}
        </div>
      )}

      {/* Timeline */}
      <div className="relative flex flex-col gap-0">
        {stages.map((stage, idx) => {
          const entered = stage.enteredAt != null;
          const isCurrent = idx === currentStageIdx;

          return (
            <div key={stage.id} className="flex gap-4">
              {/* Icon + line */}
              <div className="flex flex-col items-center">
                <div className="mt-1">
                  {entered ? (
                    <CheckCircle2 size={18} className="text-primary" />
                  ) : (
                    <Circle size={18} className="text-muted-foreground/40" />
                  )}
                </div>
                {idx < stages.length - 1 && (
                  <div className="w-px flex-1 my-1 bg-border" />
                )}
              </div>

              {/* Content */}
              <div className={`pb-6 flex-1 min-w-0 ${idx === stages.length - 1 ? "pb-0" : ""}`}>
                <div className="flex items-baseline gap-3">
                  <span
                    className={`text-sm font-medium ${
                      entered ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {stage.name}
                    {stage.custom && (
                      <span className="ml-1.5 text-xs text-muted-foreground font-normal">(custom)</span>
                    )}
                  </span>
                  {stage.enteredAt && (
                    <span className="text-xs text-muted-foreground">
                      {format(parseISO(stage.enteredAt), "MMM d, yyyy")}
                    </span>
                  )}
                  {isCurrent && !isArchived && (
                    <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                      current
                    </span>
                  )}
                </div>

                {/* Stage fields editor */}
                <StageFieldsEditor
                  entryId={entryId}
                  stageId={stage.id}
                  stageName={stage.name}
                  existingFields={stage.fields}
                  isEntered={entered}
                />
              </div>
            </div>
          );
        })}
      </div>

      <Separator />

      {/* Notes log */}
      <div>
        <h3 className="text-sm font-semibold mb-3">Activity Log</h3>

        <form onSubmit={handleAddNote} className="flex gap-2 mb-4">
          <Textarea
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            placeholder="Add a note..."
            rows={2}
            className="resize-none text-sm"
          />
          <Button type="submit" size="sm" disabled={addingNote || !noteBody.trim()} className="shrink-0">
            Add
          </Button>
        </form>

        {notes.length === 0 ? (
          <p className="text-sm text-muted-foreground">No notes yet.</p>
        ) : (
          <div className="flex flex-col gap-3">
            {[...notes].reverse().map((note) => (
              <div key={note.id} className="text-sm">
                <p className="text-xs text-muted-foreground mb-0.5">
                  {format(parseISO(note.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
                <p className="whitespace-pre-wrap">{note.body}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
