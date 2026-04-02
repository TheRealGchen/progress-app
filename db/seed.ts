import { db } from "./index";
import { trackerTypes, entryGroups } from "./schema";

const defaults = [
  {
    name: "Job Hunt",
    defaultStages: JSON.stringify([
      "Saved",
      "Applied",
      "Phone Screen",
      "Interview",
      "Offer",
      "Closed",
    ]),
  },
  {
    name: "Apartment Hunt",
    defaultStages: JSON.stringify([
      "Saved",
      "Toured",
      "Applied",
      "Approved",
      "Closed",
    ]),
  },
];

const defaultGroups = [
  { name: "Active", position: 0 },
  { name: "Paused", position: 1 },
  { name: "Not Moving Forward", position: 2 },
];

async function seed() {
  console.log("Seeding tracker types...");
  for (const t of defaults) {
    await db.insert(trackerTypes).values(t).onConflictDoNothing();
  }
  console.log("Seeding entry groups...");
  for (const g of defaultGroups) {
    await db.insert(entryGroups).values(g).onConflictDoNothing();
  }
  console.log("Done.");
}

seed().catch(console.error);
