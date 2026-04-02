import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, stages, stageFields, notes } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id);

  const [entry] = await db.select().from(entries).where(eq(entries.id, entryId));
  if (!entry) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const entryStages = await db
    .select()
    .from(stages)
    .where(eq(stages.entryId, entryId))
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
    .where(eq(notes.entryId, entryId))
    .orderBy(notes.createdAt);

  const currentStage =
    [...enrichedStages].reverse().find((s) => s.enteredAt != null) ??
    enrichedStages[0];

  return NextResponse.json({
    ...entry,
    stages: enrichedStages,
    currentStage,
    notes: entryNotes,
  });
}

// PATCH — partial update (e.g. groupId reassignment from drag-and-drop)
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();
  const allowed: Record<string, unknown> = {};
  if ("groupId" in body) allowed.groupId = body.groupId ?? null;
  if ("priority" in body) allowed.priority = body.priority;
  if ("title" in body) allowed.title = body.title;
  if ("company" in body) allowed.company = body.company;

  const [updated] = await db
    .update(entries)
    .set(allowed)
    .where(eq(entries.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json();

  const [updated] = await db
    .update(entries)
    .set(body)
    .where(eq(entries.id, parseInt(id)))
    .returning();

  return NextResponse.json(updated);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  await db.delete(entries).where(eq(entries.id, parseInt(id)));
  return NextResponse.json({ ok: true });
}
