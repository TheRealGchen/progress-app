import { db } from "@/db";
import { entries, stages, trackerTypes } from "@/db/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { EntryCard } from "./components/EntryCard";
import { QuickAddModal } from "./components/QuickAddModal";

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

      return { ...entry, currentStage, stages: entryStages };
    })
  );
}

export default async function Dashboard() {
  const [allEntries, types] = await Promise.all([
    getEntriesWithStages(),
    db.select().from(trackerTypes),
  ]);

  // Group by tracker type
  const grouped = types.map((type) => ({
    type,
    entries: allEntries.filter((e) => e.trackerTypeId === type.id),
  }));

  const totalActive = allEntries.length;

  return (
    <div className="p-6 max-w-6xl mx-auto">
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
        <div className="flex flex-col gap-8">
          {grouped
            .filter((g) => g.entries.length > 0)
            .map(({ type, entries: groupEntries }) => (
              <section key={type.id}>
                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
                  {type.name}
                  <span className="ml-2 normal-case font-normal">
                    ({groupEntries.length})
                  </span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {groupEntries.map((entry) => (
                    <EntryCard
                      key={entry.id}
                      id={entry.id}
                      company={entry.company}
                      title={entry.title}
                      priority={entry.priority}
                      currentStage={entry.currentStage}
                      stages={entry.stages}
                    />
                  ))}
                </div>
              </section>
            ))}
        </div>
      )}
    </div>
  );
}
