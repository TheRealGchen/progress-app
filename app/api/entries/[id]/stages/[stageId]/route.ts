import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stages } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH /api/entries/[id]/stages/[stageId]
// Body: { name?: string; templateKey?: string | null }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const body = await req.json();
  const { name, templateKey } = body;

  if (name !== undefined && !name?.trim()) {
    return NextResponse.json({ error: "name cannot be empty" }, { status: 400 });
  }

  const [stage] = await db
    .select()
    .from(stages)
    .where(and(eq(stages.id, parseInt(stageId)), eq(stages.entryId, parseInt(id))));

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name.trim();
  if ("templateKey" in body) updates.templateKey = templateKey ?? null;

  const [updated] = await db
    .update(stages)
    .set(updates)
    .where(eq(stages.id, parseInt(stageId)))
    .returning();

  return NextResponse.json(updated);
}
