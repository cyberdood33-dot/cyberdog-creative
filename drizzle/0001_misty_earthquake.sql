CREATE TABLE `accountPreferences` (
	`userId` int NOT NULL,
	`showEmail` boolean NOT NULL DEFAULT false,
	`allowDirectMessages` boolean NOT NULL DEFAULT true,
	`digestOptIn` boolean NOT NULL DEFAULT true,
	`aiAssistOptIn` boolean NOT NULL DEFAULT false,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountPreferences_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE TABLE `blogPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`slug` varchar(180) NOT NULL,
	`title` varchar(220) NOT NULL,
	`excerpt` text NOT NULL,
	`body` text NOT NULL,
	`coverImageUrl` varchar(2048),
	`status` enum('draft','published') NOT NULL DEFAULT 'draft',
	`publishedAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `blogPosts_id` PRIMARY KEY(`id`),
	CONSTRAINT `blogPosts_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `conversations` (
	`id` varchar(64) NOT NULL,
	`memberAId` int NOT NULL,
	`memberBId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `conversations_id` PRIMARY KEY(`id`),
	CONSTRAINT `conversations_pair_unique` UNIQUE(`memberAId`,`memberBId`)
);
--> statement-breakpoint
CREATE TABLE `docsPages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`slug` varchar(220) NOT NULL,
	`title` varchar(220) NOT NULL,
	`summary` text NOT NULL,
	`body` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`sortOrder` int NOT NULL DEFAULT 0,
	`published` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `docsPages_id` PRIMARY KEY(`id`),
	CONSTRAINT `docsPages_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `encryptedMessages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`conversationId` varchar(64) NOT NULL,
	`senderId` int NOT NULL,
	`ciphertext` text NOT NULL,
	`initializationVector` varchar(128) NOT NULL,
	`algorithm` varchar(64) NOT NULL DEFAULT 'ECDH-P256/HKDF-SHA256/AES-256-GCM',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `encryptedMessages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follows` (
	`followerId` int NOT NULL,
	`followingId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `follows_pk` PRIMARY KEY(`followerId`,`followingId`)
);
--> statement-breakpoint
CREATE TABLE `friendships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int NOT NULL,
	`recipientId` int NOT NULL,
	`status` enum('pending','accepted','declined') NOT NULL DEFAULT 'pending',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `friendships_id` PRIMARY KEY(`id`),
	CONSTRAINT `friendships_pair_unique` UNIQUE(`requesterId`,`recipientId`)
);
--> statement-breakpoint
CREATE TABLE `portfolioItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(180) NOT NULL,
	`summary` text NOT NULL,
	`kind` varchar(80) NOT NULL,
	`linkUrl` varchar(2048),
	`imageUrl` varchar(2048),
	`featured` boolean NOT NULL DEFAULT false,
	`sortOrder` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `portfolioItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`postId` int NOT NULL,
	`authorId` int NOT NULL,
	`parentId` int,
	`body` text NOT NULL,
	`hidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialComments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialPosts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`authorId` int NOT NULL,
	`body` text NOT NULL,
	`visibility` enum('public','followers') NOT NULL DEFAULT 'public',
	`hidden` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `socialPosts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `socialReactions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`postId` int NOT NULL,
	`reaction` enum('appreciate','insightful','signal') NOT NULL DEFAULT 'appreciate',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `socialReactions_id` PRIMARY KEY(`id`),
	CONSTRAINT `socialReactions_user_post_unique` UNIQUE(`userId`,`postId`)
);
--> statement-breakpoint
CREATE TABLE `supportTickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`requesterId` int,
	`externalSubmissionId` varchar(128),
	`subject` varchar(220) NOT NULL,
	`status` enum('open','in_progress','resolved') NOT NULL DEFAULT 'open',
	`priority` enum('low','normal','high') NOT NULL DEFAULT 'normal',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `supportTickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userProfiles` (
	`userId` int NOT NULL,
	`displayName` varchar(160),
	`avatarUrl` varchar(2048),
	`headline` varchar(220),
	`bio` text,
	`websiteUrl` varchar(2048),
	`publicEncryptionKey` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userProfiles_userId` PRIMARY KEY(`userId`)
);
--> statement-breakpoint
CREATE INDEX `blogPosts_status_published_idx` ON `blogPosts` (`status`,`publishedAt`);--> statement-breakpoint
CREATE INDEX `encryptedMessages_conversation_idx` ON `encryptedMessages` (`conversationId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `socialComments_post_idx` ON `socialComments` (`postId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `socialPosts_created_idx` ON `socialPosts` (`createdAt`);--> statement-breakpoint
CREATE INDEX `supportTickets_status_idx` ON `supportTickets` (`status`,`updatedAt`);