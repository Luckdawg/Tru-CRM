CREATE TABLE `emailConnections` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` enum('Gmail','Outlook') NOT NULL,
	`email` varchar(320) NOT NULL,
	`accessToken` text NOT NULL,
	`refreshToken` text,
	`tokenExpiry` timestamp,
	`scope` text,
	`isActive` int NOT NULL DEFAULT 1,
	`lastSyncAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailConnections_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `activities` ADD `emailMessageId` varchar(255);--> statement-breakpoint
ALTER TABLE `activities` ADD `emailThreadId` varchar(255);--> statement-breakpoint
ALTER TABLE `activities` ADD `emailProvider` enum('Gmail','Outlook');--> statement-breakpoint
ALTER TABLE `activities` ADD `emailFrom` varchar(320);--> statement-breakpoint
ALTER TABLE `activities` ADD `emailTo` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `emailBody` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `emailHtml` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `emailAttachments` text;--> statement-breakpoint
ALTER TABLE `activities` ADD `isInbound` int DEFAULT 0;--> statement-breakpoint
CREATE INDEX `user_idx` ON `emailConnections` (`userId`);--> statement-breakpoint
CREATE INDEX `email_idx` ON `emailConnections` (`email`);--> statement-breakpoint
CREATE INDEX `email_message_idx` ON `activities` (`emailMessageId`);