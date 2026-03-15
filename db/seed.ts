import { db } from "./index";
import { trackerTypes } from "./schema";

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

async function seed() {
  console.log("Seeding tracker types...");
  for (const t of defaults) {
    await db.insert(trackerTypes).values(t).onConflictDoNothing();
  }
  console.log("Done.");
}

seed().catch(console.error);
