import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { entries, stages, trackerTypes } from "@/db/schema";

export const dynamic = "force-dynamic";
import { eq, isNull, desc } from "drizzle-orm";

export async function GET() {
  const allEntries = await db
    .select()
    .from(entries)
    .where(isNull(entries.archivedAt))
    .orderBy(desc(entries.createdAt));

  // Attach current stage to each entry
  const enriched = await Promise.all(
    allEntries.map(async (entry) => {
      const entryStages = await db
        .select()
        .from(stages)
        .where(eq(stages.entryId, entry.id))
        .orderBy(stages.position);

      // Current stage = last stage with enteredAt set, or first stage
      const currentStage =
        [...entryStages].reverse().find((s) => s.enteredAt != null) ??
        entryStages[0];

      return { ...entry, currentStage, stages: entryStages };
    })
  );

  return NextResponse.json(enriched);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { trackerTypeId, title, company, url, priority, source } = body;

  if (!trackerTypeId || !title || !company) {
    return NextResponse.json(
      { error: "trackerTypeId, title, and company are required" },
      { status: 400 }
    );
  }

  // Get default stages for this tracker type
  const [type] = await db
    .select()
    .from(trackerTypes)
    .where(eq(trackerTypes.id, trackerTypeId));

  if (!type) {
    return NextResponse.json({ error: "Tracker type not found" }, { status: 404 });
  }

  const defaultStageNames: string[] = JSON.parse(type.defaultStages);

  const [newEntry] = await db
    .insert(entries)
    .values({ trackerTypeId, title, company, url, priority, source })
    .returning();

  // Create all stages, mark first one as entered
  const now = new Date().toISOString();
  const stageRows = defaultStageNames.map((name, i) => ({
    entryId: newEntry.id,
    name,
    position: i,
    enteredAt: i === 0 ? now : null,
    custom: false,
  }));

  const createdStages = await db.insert(stages).values(stageRows).returning();

  return NextResponse.json(
    { ...newEntry, stages: createdStages, currentStage: createdStages[0] },
    { status: 201 }
  );
}
