import { sqliteTable, integer, text, real } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

export const trackerTypes = sqliteTable("tracker_types", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  defaultStages: text("default_stages").notNull(), // JSON array of stage names
});

export const entries = sqliteTable("entries", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  trackerTypeId: integer("tracker_type_id")
    .notNull()
    .references(() => trackerTypes.id),
  title: text("title").notNull(),
  company: text("company").notNull(),
  url: text("url"),
  priority: text("priority", { enum: ["low", "medium", "high"] })
    .notNull()
    .default("medium"),
  source: text("source"),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
  archivedAt: text("archived_at"),
});

export const stages = sqliteTable("stages", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  position: integer("position").notNull(),
  enteredAt: text("entered_at"),
  custom: integer("custom", { mode: "boolean" }).notNull().default(false),
});

export const stageFields = sqliteTable("stage_fields", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stageId: integer("stage_id")
    .notNull()
    .references(() => stages.id, { onDelete: "cascade" }),
  fieldKey: text("field_key").notNull(),
  fieldValue: text("field_value"),
});

export const notes = sqliteTable("notes", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  entryId: integer("entry_id")
    .notNull()
    .references(() => entries.id, { onDelete: "cascade" }),
  body: text("body").notNull(),
  createdAt: text("created_at")
    .notNull()
    .default(sql`(datetime('now'))`),
});

export const reminders = sqliteTable("reminders", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  stageId: integer("stage_id")
    .notNull()
    .references(() => stages.id, { onDelete: "cascade" }),
  remindAt: text("remind_at").notNull(),
  dismissedAt: text("dismissed_at"),
});

// Types
export type TrackerType = typeof trackerTypes.$inferSelect;
export type Entry = typeof entries.$inferSelect;
export type Stage = typeof stages.$inferSelect;
export type StageField = typeof stageFields.$inferSelect;
export type Note = typeof notes.$inferSelect;
export type Reminder = typeof reminders.$inferSelect;

export type NewEntry = typeof entries.$inferInsert;
export type NewNote = typeof notes.$inferInsert;
export type NewStage = typeof stages.$inferInsert;
