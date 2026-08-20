CREATE TABLE `sessions` (
	`token_hash` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`last_seen_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `idx_sessions_user` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE INDEX `idx_sessions_expires` ON `sessions` (`expires_at`);--> statement-breakpoint
CREATE TABLE `user_snapshots` (
	`user_id` text PRIMARY KEY NOT NULL,
	`state_json` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
ALTER TABLE `users` ADD `google_sub` text;--> statement-breakpoint
ALTER TABLE `users` ADD `avatar_url` text;--> statement-breakpoint
ALTER TABLE `users` ADD `role` text DEFAULT 'user' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `last_login_at` text;--> statement-breakpoint
CREATE UNIQUE INDEX `idx_users_google_sub` ON `users` (`google_sub`);--> statement-breakpoint
CREATE INDEX `idx_users_role_created` ON `users` (`role`,`created_at`);--> statement-breakpoint
PRAGMA optimize;
