import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stages } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq } from "drizzle-orm";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { name, afterPosition, templateKey } = await req.json();

  if (!name) {
    return NextResponse.json({ error: "name is required" }, { status: 400 });
  }

  const entryStages = await db
    .select()
    .from(stages)
    .where(eq(stages.entryId, parseInt(id)))
    .orderBy(stages.position);

  const insertAt = afterPosition != null ? afterPosition + 1 : entryStages.length;

  // Shift positions of subsequent stages
  for (const stage of entryStages) {
    if (stage.position >= insertAt) {
      await db
        .update(stages)
        .set({ position: stage.position + 1 })
        .where(eq(stages.id, stage.id));
    }
  }

  const [newStage] = await db
    .insert(stages)
    .values({ entryId: parseInt(id), name, position: insertAt, custom: true, templateKey: templateKey ?? null })
    .returning();

  return NextResponse.json(newStage, { status: 201 });
}
