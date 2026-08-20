CREATE TABLE `chapter_completions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`cycle_id` integer NOT NULL,
	`book_code` text NOT NULL,
	`chapter_number` integer NOT NULL,
	`completed_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`cycle_id`) REFERENCES `reading_cycles`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_chapter_completions_cycle_chapter` ON `chapter_completions` (`cycle_id`,`book_code`,`chapter_number`);--> statement-breakpoint
CREATE INDEX `idx_chapter_completions_user` ON `chapter_completions` (`user_id`);--> statement-breakpoint
CREATE TABLE `favorites` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`version_code` text NOT NULL,
	`book_code` text NOT NULL,
	`chapter_number` integer NOT NULL,
	`verse_start` integer NOT NULL,
	`verse_end` integer NOT NULL,
	`text_snapshot` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_favorites_user_created` ON `favorites` (`user_id`,`created_at`);--> statement-breakpoint
CREATE TABLE `insights` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`version_code` text NOT NULL,
	`book_code` text NOT NULL,
	`chapter_number` integer NOT NULL,
	`verse_start` integer NOT NULL,
	`verse_end` integer NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_insights_user_updated` ON `insights` (`user_id`,`updated_at`);--> statement-breakpoint
CREATE TABLE `quiz_attempts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`template_code` text NOT NULL,
	`score` integer,
	`total_questions` integer NOT NULL,
	`status` text DEFAULT 'in_progress' NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`submitted_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_quiz_attempts_user_started` ON `quiz_attempts` (`user_id`,`started_at`);--> statement-breakpoint
CREATE TABLE `reading_cycles` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`cycle_number` integer DEFAULT 1 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`completed_at` text,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reading_cycles_user_number` ON `reading_cycles` (`user_id`,`cycle_number`);--> statement-breakpoint
CREATE TABLE `reward_ledger` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` text NOT NULL,
	`asset_type` text NOT NULL,
	`amount` integer NOT NULL,
	`reason` text NOT NULL,
	`idempotency_key` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_reward_ledger_idempotency` ON `reward_ledger` (`idempotency_key`,`asset_type`);--> statement-breakpoint
CREATE INDEX `idx_reward_ledger_user_asset` ON `reward_ledger` (`user_id`,`asset_type`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`display_name` text,
	`timezone` text DEFAULT 'Asia/Taipei' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_email` ON `users` (`email`);
--> statement-breakpoint
PRAGMA optimize;
