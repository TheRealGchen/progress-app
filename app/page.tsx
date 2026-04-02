import { db } from "@/db";
import { entries, stages, stageFields, trackerTypes, entryGroups } from "@/db/schema";
import { eq, isNull, desc, asc } from "drizzle-orm";
import { QuickAddModal } from "./components/QuickAddModal";
import { GroupedDashboard } from "./components/GroupedDashboard";

export const dynamic = "force-dynamic";

async function getEntriesWithStages() {
  const allEntries = await db
    .select()
    .from(entries)
    .where(isNull(entries.archivedAt))
    .orderBy(desc(entries.createdAt));

  return Promise.all(
    allEntries.map(async (entry) => {
      const entryStages = await db
        .select()
        .from(stages)
        .where(eq(stages.entryId, entry.id))
        .orderBy(stages.position);

      const currentStage =
        [...entryStages].reverse().find((s) => s.enteredAt != null) ??
        entryStages[0];

      const currentStageFields = currentStage
        ? await db.select().from(stageFields).where(eq(stageFields.stageId, currentStage.id))
        : [];

      return { ...entry, currentStage, stages: entryStages, currentStageFields };
    })
  );
}

export default async function Dashboard() {
  const [allEntries, types, groups] = await Promise.all([
    getEntriesWithStages(),
    db.select().from(trackerTypes),
    db.select().from(entryGroups).orderBy(asc(entryGroups.position)),
  ]);

  const totalActive = allEntries.length;

  return (
    <div className="p-6 max-w-full mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold">Dashboard</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            {totalActive} active {totalActive === 1 ? "entry" : "entries"}
          </p>
        </div>
        <QuickAddModal trackerTypes={types} />
      </div>

      {totalActive === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground gap-3">
          <p className="text-lg font-medium">Nothing tracked yet</p>
          <p className="text-sm">Add your first entry to get started.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {types
            .filter((type) => allEntries.some((e) => e.trackerTypeId === type.id))
            .map((type) => (
              <GroupedDashboard
                key={type.id}
                trackerTypeLabel={type.name}
                trackerTypeId={type.id}
                entries={allEntries.filter((e) => e.trackerTypeId === type.id)}
                groups={groups}
              />
            ))}
        </div>
      )}
    </div>
  );
}
