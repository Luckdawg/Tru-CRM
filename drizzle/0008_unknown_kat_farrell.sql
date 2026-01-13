CREATE TABLE `emailDigests` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`digestType` enum('AtRiskDeals','LowEngagement','Combined') NOT NULL,
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`itemCount` int NOT NULL,
	`status` enum('Sent','Failed','Skipped') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `emailDigests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `filterPresets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`presetName` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`filters` json NOT NULL,
	`isSystem` boolean NOT NULL DEFAULT false,
	`isPublic` boolean NOT NULL DEFAULT false,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `filterPresets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `userPreferences` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`dashboardWidgets` json,
	`digestEnabled` boolean NOT NULL DEFAULT true,
	`digestFrequency` enum('None','Daily','Weekly') NOT NULL DEFAULT 'Weekly',
	`digestDay` int,
	`digestTime` varchar(5) DEFAULT '09:00',
	`includeAtRiskDeals` boolean NOT NULL DEFAULT true,
	`includeLowEngagement` boolean NOT NULL DEFAULT true,
	`includeForecastSummary` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `userPreferences_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `emailDigests` ADD CONSTRAINT `emailDigests_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `filterPresets` ADD CONSTRAINT `filterPresets_createdBy_users_id_fk` FOREIGN KEY (`createdBy`) REFERENCES `users`(`id`) ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `userPreferences` ADD CONSTRAINT `userPreferences_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;