import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stageFields, stages } from "@/db/schema";
import { eq, and } from "drizzle-orm";

// PUT /api/entries/[id]/stages/[stageId]/fields
// Body: { fields: { [key: string]: string } }
// Upserts all provided key/value pairs for the stage.
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id, stageId } = await params;
  const stageIdNum = parseInt(stageId);

  // Verify stage belongs to this entry
  const [stage] = await db
    .select()
    .from(stages)
    .where(and(eq(stages.id, stageIdNum), eq(stages.entryId, parseInt(id))));

  if (!stage) {
    return NextResponse.json({ error: "Stage not found" }, { status: 404 });
  }

  const { fields }: { fields: Record<string, string> } = await req.json();

  // Upsert each field: delete existing then re-insert (SQLite-friendly)
  for (const [fieldKey, fieldValue] of Object.entries(fields)) {
    const existing = await db
      .select()
      .from(stageFields)
      .where(
        and(eq(stageFields.stageId, stageIdNum), eq(stageFields.fieldKey, fieldKey))
      );

    if (existing.length > 0) {
      await db
        .update(stageFields)
        .set({ fieldValue })
        .where(
          and(eq(stageFields.stageId, stageIdNum), eq(stageFields.fieldKey, fieldKey))
        );
    } else {
      await db.insert(stageFields).values({ stageId: stageIdNum, fieldKey, fieldValue });
    }
  }

  const updated = await db
    .select()
    .from(stageFields)
    .where(eq(stageFields.stageId, stageIdNum));

  return NextResponse.json(updated);
}
