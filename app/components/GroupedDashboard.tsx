"use client";

import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  useDroppable,
  useDraggable,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { EntryCard } from "./EntryCard";
import { Input } from "@/components/ui/input";
import { Check, ChevronDown, ChevronRight, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";

interface Stage {
  id: number;
  name: string;
  position: number;
  enteredAt: string | null;
}

interface StageField {
  fieldKey: string;
  fieldValue: string | null;
}

interface Entry {
  id: number;
  company: string;
  title: string;
  priority: string;
  groupId: number | null;
  currentStage: Stage;
  stages: Stage[];
  currentStageFields: StageField[];
}

interface Group {
  id: number;
  name: string;
  position: number;
}

interface GroupedDashboardProps {
  entries: Entry[];
  groups: Group[];
  trackerTypeLabel: string;
  trackerTypeId: number;
}

// ── Draggable card wrapper ─────────────────────────────────────────────────────
function DraggableCard({ entry }: { entry: Entry }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `entry-${entry.id}`,
    data: { entryId: entry.id, groupId: entry.groupId },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.3 : 1 }
    : undefined;

  return (
    // listeners go on the outer div — whole card is the drag surface.
    // activationConstraint distance:8 means short taps still navigate (Link inside).
    <div
      ref={setNodeRef}
      style={style}
      className="relative group/drag touch-none"
      {...listeners}
      {...attributes}
    >
      {/* Visual drag-handle hint only */}
      <span className="absolute top-2 right-2 z-10 opacity-0 group-hover/drag:opacity-60 transition-opacity text-muted-foreground pointer-events-none">
        <GripVertical size={13} />
      </span>
      <EntryCard
        id={entry.id}
        company={entry.company}
        title={entry.title}
        priority={entry.priority}
        currentStage={entry.currentStage}
        stages={entry.stages}
        currentStageFields={entry.currentStageFields}
      />
    </div>
  );
}

// ── Droppable group column ─────────────────────────────────────────────────────
function GroupColumn({
  group,
  entries,
  isOver,
  onRename,
  onDelete,
}: {
  group: Group;
  entries: Entry[];
  isOver: boolean;
  onRename: (id: number, name: string) => void;
  onDelete: (id: number) => void;
}) {
  const { setNodeRef } = useDroppable({ id: `group-${group.id}` });
  const [editing, setEditing] = useState(false);
  const [nameVal, setNameVal] = useState(group.name);
  const [collapsed, setCollapsed] = useState(false);

  function handleRenameSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = nameVal.trim();
    if (trimmed && trimmed !== group.name) onRename(group.id, trimmed);
    setEditing(false);
  }

  return (
    <div className="w-full">
      {/* Group header */}
      <div className="flex items-center gap-1.5 mb-2 group/header">
        <button
          onClick={() => setCollapsed((c) => !c)}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        </button>

        {editing ? (
          <form onSubmit={handleRenameSubmit} className="flex items-center gap-1 flex-1">
            <Input
              autoFocus
              value={nameVal}
              onChange={(e) => setNameVal(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setNameVal(group.name); setEditing(false); } }}
              className="h-6 text-xs px-1.5 py-0 font-semibold"
            />
            <button type="submit" className="text-primary hover:opacity-80"><Check size={13} /></button>
            <button type="button" onClick={() => { setNameVal(group.name); setEditing(false); }} className="text-muted-foreground hover:opacity-80"><X size={13} /></button>
          </form>
        ) : (
          <>
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide flex-1 truncate">
              {group.name}
              <span className="ml-1.5 normal-case font-normal">({entries.length})</span>
            </span>
            <button onClick={() => setEditing(true)} className="opacity-0 group-hover/header:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"><Pencil size={11} /></button>
            <button onClick={() => onDelete(group.id)} className="opacity-0 group-hover/header:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"><Trash2 size={11} /></button>
          </>
        )}
      </div>

      {/* Drop zone — hidden when collapsed but still mounted so DnD works */}
      <div
        ref={setNodeRef}
        className={`rounded-lg p-2 transition-colors ${
          isOver ? "bg-primary/5 ring-2 ring-primary/20" : "bg-muted/30"
        } ${collapsed ? "hidden" : ""}`}
      >
        {entries.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {entries.map((entry) => (
              <DraggableCard key={entry.id} entry={entry} />
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground/50 text-center py-4 select-none">
            Drop here
          </p>
        )}
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────
export function GroupedDashboard({
  entries: initialEntries,
  groups: initialGroups,
  trackerTypeLabel,
  trackerTypeId,
}: GroupedDashboardProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [groups, setGroups] = useState(initialGroups);
  const [activeEntryId, setActiveEntryId] = useState<number | null>(null);
  const [overGroupId, setOverGroupId] = useState<number | null>(null);
  const [addingGroup, setAddingGroup] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } })
  );

  const activeEntry = activeEntryId != null ? entries.find((e) => e.id === activeEntryId) : null;

  function handleDragStart(event: DragStartEvent) {
    const entryId = (event.active.data.current as { entryId: number }).entryId;
    setActiveEntryId(entryId);
  }

  function handleDragOver(event: { over: { id: string | number } | null }) {
    if (!event.over) { setOverGroupId(null); return; }
    const overId = String(event.over.id);
    if (overId.startsWith("group-")) {
      setOverGroupId(parseInt(overId.replace("group-", "")));
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveEntryId(null);
    setOverGroupId(null);
    const { active, over } = event;
    if (!over) return;

    const entryId = (active.data.current as { entryId: number }).entryId;
    const overId = String(over.id);
    if (!overId.startsWith("group-")) return;

    const rawId = overId.replace("group-", "");
    const newGroupId = rawId === "-1" ? null : parseInt(rawId);
    const entry = entries.find((e) => e.id === entryId);
    if (!entry || entry.groupId === newGroupId) return;

    // Optimistic update
    setEntries((prev) =>
      prev.map((e) => e.id === entryId ? { ...e, groupId: newGroupId } : e)
    );

    const res = await fetch(`/api/entries/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ groupId: newGroupId }),
    });

    if (!res.ok) {
      // Revert on failure
      setEntries((prev) =>
        prev.map((e) => e.id === entryId ? { ...e, groupId: entry.groupId } : e)
      );
    }
  }

  async function handleRename(groupId: number, newName: string) {
    setGroups((prev) => prev.map((g) => g.id === groupId ? { ...g, name: newName } : g));
    await fetch(`/api/groups/${groupId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName }),
    });
  }

  async function handleDelete(groupId: number) {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
    setEntries((prev) => prev.map((e) => e.groupId === groupId ? { ...e, groupId: null } : e));
    await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
  }

  async function handleAddGroup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed) { setAddingGroup(false); return; }
    const res = await fetch("/api/groups", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: trimmed }),
    });
    const group = await res.json();
    setGroups((prev) => [...prev, group]);
    setNewGroupName("");
    setAddingGroup(false);
  }

  // Ungrouped entries get their own implicit bucket using null
  const ungroupedEntries = entries.filter((e) => e.groupId == null);
  const allGroups = groups;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
          {trackerTypeLabel}
          <span className="ml-2 normal-case font-normal">({entries.length})</span>
        </h3>
        {!addingGroup ? (
          <button
            onClick={() => setAddingGroup(true)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            <Plus size={12} />
            Add group
          </button>
        ) : (
          <form onSubmit={handleAddGroup} className="flex items-center gap-1">
            <Input
              autoFocus
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Escape") { setAddingGroup(false); setNewGroupName(""); } }}
              placeholder="Group name…"
              className="h-6 text-xs px-1.5 py-0 w-32"
            />
            <button type="submit" className="text-primary hover:opacity-80"><Check size={13} /></button>
            <button type="button" onClick={() => { setAddingGroup(false); setNewGroupName(""); }} className="text-muted-foreground hover:opacity-80"><X size={13} /></button>
          </form>
        )}
      </div>

      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col gap-4">
          {allGroups.map((group) => (
            <GroupColumn
              key={group.id}
              group={group}
              entries={entries.filter((e) => e.groupId === group.id)}
              isOver={overGroupId === group.id}
              onRename={handleRename}
              onDelete={handleDelete}
            />
          ))}

          {/* Ungrouped section — shown only if there are ungrouped entries */}
          {ungroupedEntries.length > 0 && (
            <GroupColumn
              key="ungrouped"
              group={{ id: -1, name: "Ungrouped", position: 9999 }}
              entries={ungroupedEntries}
              isOver={overGroupId === -1}
              onRename={() => {}}
              onDelete={() => {}}
            />
          )}
        </div>

        {/* Drag overlay — ghost card while dragging */}
        <DragOverlay>
          {activeEntry && (
            <div className="rotate-1 opacity-90 shadow-xl w-[280px]">
              <EntryCard
                id={activeEntry.id}
                company={activeEntry.company}
                title={activeEntry.title}
                priority={activeEntry.priority}
                currentStage={activeEntry.currentStage}
                stages={activeEntry.stages}
                currentStageFields={activeEntry.currentStageFields}
              />
            </div>
          )}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
