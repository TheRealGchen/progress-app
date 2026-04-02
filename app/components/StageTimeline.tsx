"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { format, parseISO } from "date-fns";
import { ChevronRight, ChevronLeft, Circle, CheckCircle2, Plus, Pencil, Check, X } from "lucide-react";
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

// ── Inline rename ──────────────────────────────────────────────────────────────
function RenameStage({
  entryId,
  stage,
  onDone,
}: {
  entryId: number;
  stage: Stage;
  onDone: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(stage.name);
  const [saving, setSaving] = useState(false);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed || trimmed === stage.name) { onDone(); return; }
    setSaving(true);
    await fetch(`/api/entries/${entryId}/stages/${stage.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    setSaving(false);
    router.refresh();
    onDone();
  }

  return (
    <form
      className="flex items-center gap-1"
      onSubmit={(e) => { e.preventDefault(); save(); }}
    >
      <Input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        className="h-6 text-sm py-0 px-1.5 w-40"
        disabled={saving}
      />
      <button type="submit" disabled={saving} className="text-primary hover:opacity-80">
        <Check size={14} />
      </button>
      <button type="button" onClick={onDone} className="text-muted-foreground hover:opacity-80">
        <X size={14} />
      </button>
    </form>
  );
}

// ── Insert stage between two positions ────────────────────────────────────────
function InsertStage({
  entryId,
  afterPosition,
  onDone,
}: {
  entryId: number;
  afterPosition: number;
  onDone: () => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  async function save() {
    const trimmed = value.trim();
    if (!trimmed) { onDone(); return; }
    setSaving(true);
    await fetch(`/api/entries/${entryId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed, afterPosition }),
    });
    setSaving(false);
    router.refresh();
    onDone();
  }

  return (
    <form
      className="flex items-center gap-1 py-1"
      onSubmit={(e) => { e.preventDefault(); save(); }}
    >
      <Input
        ref={inputRef}
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => e.key === "Escape" && onDone()}
        placeholder="New stage name…"
        className="h-6 text-sm py-0 px-1.5 w-44"
        disabled={saving}
      />
      <button type="submit" disabled={saving || !value.trim()} className="text-primary hover:opacity-80 disabled:opacity-30">
        <Check size={14} />
      </button>
      <button type="button" onClick={onDone} className="text-muted-foreground hover:opacity-80">
        <X size={14} />
      </button>
    </form>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function StageTimeline({ entryId, stages, notes, isArchived }: StageTimelineProps) {
  const router = useRouter();
  const [advancing, setAdvancing] = useState(false);
  const [retreating, setRetreating] = useState(false);
  const [noteBody, setNoteBody] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [renamingId, setRenamingId] = useState<number | null>(null);
  const [insertingAfter, setInsertingAfter] = useState<number | null>(null);

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
      {/* Stage navigation */}
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
          const isRenaming = renamingId === stage.id;
          const isInsertingAfter = insertingAfter === stage.position;

          return (
            <div key={stage.id}>
              <div className="flex gap-4 group">
                {/* Icon + line */}
                <div className="flex flex-col items-center">
                  <div className="mt-1">
                    {entered ? (
                      <CheckCircle2 size={18} className="text-primary" />
                    ) : (
                      <Circle size={18} className="text-muted-foreground/40" />
                    )}
                  </div>
                  {(idx < stages.length - 1 || isInsertingAfter) && (
                    <div className="w-px flex-1 my-1 bg-border" />
                  )}
                </div>

                {/* Content */}
                <div className={`pb-4 flex-1 min-w-0 ${idx === stages.length - 1 && !isInsertingAfter ? "pb-0" : ""}`}>
                  <div className="flex items-baseline gap-2">
                    {isRenaming ? (
                      <RenameStage
                        entryId={entryId}
                        stage={stage}
                        onDone={() => setRenamingId(null)}
                      />
                    ) : (
                      <>
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
                        {!isArchived && (
                          <button
                            onClick={() => setRenamingId(stage.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            title="Rename stage"
                          >
                            <Pencil size={11} />
                          </button>
                        )}
                      </>
                    )}
                    {stage.enteredAt && !isRenaming && (
                      <span className="text-xs text-muted-foreground">
                        {format(parseISO(stage.enteredAt), "MMM d, yyyy")}
                      </span>
                    )}
                    {isCurrent && !isArchived && !isRenaming && (
                      <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded font-medium">
                        current
                      </span>
                    )}
                  </div>

                  <StageFieldsEditor
                    entryId={entryId}
                    stageId={stage.id}
                    stageName={stage.name}
                    existingFields={stage.fields}
                    isEntered={entered}
                  />
                </div>
              </div>

              {/* Insert between stages */}
              {!isArchived && idx < stages.length - 1 && (
                <div className="flex gap-4 items-start pl-[22px]">
                  <div className="flex-1 pb-1">
                    {isInsertingAfter ? (
                      <InsertStage
                        entryId={entryId}
                        afterPosition={stage.position}
                        onDone={() => setInsertingAfter(null)}
                      />
                    ) : (
                      <button
                        onClick={() => setInsertingAfter(stage.position)}
                        className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                        title="Insert stage here"
                      >
                        <Plus size={11} />
                        <span>insert stage</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {/* Add stage at end */}
        {!isArchived && (
          <div className="flex gap-4 items-start mt-2 pl-[22px]">
            <div className="flex-1">
              {insertingAfter === stages[stages.length - 1]?.position ? (
                <InsertStage
                  entryId={entryId}
                  afterPosition={stages[stages.length - 1].position}
                  onDone={() => setInsertingAfter(null)}
                />
              ) : (
                <button
                  onClick={() => setInsertingAfter(stages[stages.length - 1]?.position)}
                  className="flex items-center gap-1 text-xs text-muted-foreground/40 hover:text-muted-foreground transition-colors"
                  title="Add stage at end"
                >
                  <Plus size={11} />
                  <span>add stage</span>
                </button>
              )}
            </div>
          </div>
        )}
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
