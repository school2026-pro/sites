CREATE TABLE `planner_entries` (
	`id` text PRIMARY KEY NOT NULL,
	`owner` text NOT NULL,
	`title` text NOT NULL,
	`kind` text NOT NULL,
	`date` text NOT NULL,
	`start` text,
	`end` text,
	`category` text NOT NULL,
	`priority` integer NOT NULL,
	`notes` text NOT NULL,
	`done` integer DEFAULT 0 NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`deleted_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `planner_entries_owner_date` ON `planner_entries` (`owner`,`date`);--> statement-breakpoint
CREATE TABLE `planner_reflections` (
	`owner` text NOT NULL,
	`date` text NOT NULL,
	`mood` integer NOT NULL,
	`focus` integer NOT NULL,
	`minutes` integer NOT NULL,
	`wins` text NOT NULL,
	`obstacles` text NOT NULL,
	`learned` text NOT NULL,
	`next_action` text NOT NULL,
	`version` integer DEFAULT 1 NOT NULL,
	`updated_at` text NOT NULL,
	PRIMARY KEY(`owner`, `date`)
);
