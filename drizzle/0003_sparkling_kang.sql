CREATE TABLE `memberNotifications` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`type` enum('system','comment','follow','friend','support','release') NOT NULL DEFAULT 'system',
	`title` varchar(180) NOT NULL,
	`body` text NOT NULL,
	`href` varchar(2048),
	`readAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `memberNotifications_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `memberNotifications_user_read_created_idx` ON `memberNotifications` (`userId`,`readAt`,`createdAt`);