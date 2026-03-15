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

  if (lastEnteredIdx.i === 0) {
    return NextResponse.json({ error: "Already at first stage" }, { status: 400 });
  }

  // Clear enteredAt on the current stage to move back
  const [updated] = await db
    .update(stages)
    .set({ enteredAt: null })
    .where(eq(stages.id, lastEnteredIdx.id))
    .returning();

  return NextResponse.json(updated);
}
