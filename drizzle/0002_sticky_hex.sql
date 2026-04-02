CREATE TABLE `entry_groups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer DEFAULT 0 NOT NULL,
	`color` text
);
--> statement-breakpoint
ALTER TABLE `entries` ADD `group_id` integer REFERENCES entry_groups(id);