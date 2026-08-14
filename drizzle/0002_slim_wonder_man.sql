CREATE TABLE `savedItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` enum('portfolio','blog','docs','social') NOT NULL,
	`itemId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `savedItems_id` PRIMARY KEY(`id`),
	CONSTRAINT `savedItems_user_item_unique` UNIQUE(`userId`,`itemType`,`itemId`)
);
--> statement-breakpoint
CREATE INDEX `savedItems_user_created_idx` ON `savedItems` (`userId`,`createdAt`);