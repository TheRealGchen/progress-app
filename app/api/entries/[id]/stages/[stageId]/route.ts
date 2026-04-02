import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stages } from "@/db/schema";
import { and, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// PATCH /api/entries/[id]/stages/[stageId]
// Body: { name: string }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const { name } = await req.json();

  if (!name?.trim()) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const [stage] = await db
    .select()
    .from(stages)
    .where(and(eq(stages.id, parseInt(stageId)), eq(stages.entryId, parseInt(id))));

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const [updated] = await db
    .update(stages)
    .set({ name: name.trim() })
    .where(eq(stages.id, parseInt(stageId)))
    .returning();

  return NextResponse.json(updated);
}
