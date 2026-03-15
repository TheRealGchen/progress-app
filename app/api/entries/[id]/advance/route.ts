import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { stages } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const entryId = parseInt(id);

  const entryStages = await db
    .select()
    .from(stages)
    .where(eq(stages.entryId, entryId))
    .orderBy(stages.position);

  // Find the last entered stage
  const lastEnteredIdx = [...entryStages]
    .map((s, i) => ({ ...s, i }))
    .filter((s) => s.enteredAt != null)
    .sort((a, b) => b.i - a.i)[0];

  if (!lastEnteredIdx) {
    return NextResponse.json({ error: "No active stage found" }, { status: 400 });
  }

  const nextStage = entryStages[lastEnteredIdx.i + 1];
  if (!nextStage) {
    return NextResponse.json({ error: "Already at last stage" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const [updated] = await db
    .update(stages)
    .set({ enteredAt: now })
    .where(eq(stages.id, nextStage.id))
    .returning();

  return NextResponse.json(updated);
}
