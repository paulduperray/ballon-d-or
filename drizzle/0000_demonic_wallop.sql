CREATE TABLE `votes` (
	`user_id` text PRIMARY KEY NOT NULL,
	`voter_name` text NOT NULL,
	`voter_email` text NOT NULL,
	`ranking` text NOT NULL,
	`is_final` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`locked_at` text
);
