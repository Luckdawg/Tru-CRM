CREATE TABLE `forecastSnapshotOpportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotId` int NOT NULL,
	`opportunityId` int NOT NULL,
	`opportunityName` varchar(255) NOT NULL,
	`stage` varchar(100) NOT NULL,
	`amount` decimal(15,2) NOT NULL,
	`probability` int NOT NULL,
	`weightedAmount` decimal(15,2) NOT NULL,
	`closeDate` timestamp NOT NULL,
	`accountName` varchar(255),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forecastSnapshotOpportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `forecastSnapshots` (
	`id` int AUTO_INCREMENT NOT NULL,
	`snapshotDate` timestamp NOT NULL,
	`periodType` enum('Month','Quarter','Year') NOT NULL,
	`periodStart` timestamp NOT NULL,
	`periodEnd` timestamp NOT NULL,
	`forecastAmount` decimal(15,2) NOT NULL,
	`weightedAmount` decimal(15,2) NOT NULL,
	`opportunityCount` int NOT NULL,
	`ownerId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `forecastSnapshots_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `reportExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportId` int NOT NULL,
	`executedBy` int NOT NULL,
	`executedAt` timestamp NOT NULL DEFAULT (now()),
	`rowCount` int,
	`executionTimeMs` int,
	`parameters` json,
	`status` enum('Success','Failed','Timeout') NOT NULL,
	`errorMessage` text,
	CONSTRAINT `reportExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `savedReports` (
	`id` int AUTO_INCREMENT NOT NULL,
	`reportName` varchar(255) NOT NULL,
	`reportType` enum('PreBuilt','Custom') NOT NULL,
	`category` varchar(100),
	`description` text,
	`queryConfig` json,
	`columns` json,
	`filters` json,
	`sorting` json,
	`grouping` json,
	`isPublic` boolean DEFAULT false,
	`isFavorite` boolean DEFAULT false,
	`scheduleFrequency` enum('None','Daily','Weekly','Monthly'),
	`scheduleDay` int,
	`scheduleTime` varchar(10),
	`lastRunAt` timestamp,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `savedReports_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `snapshot_idx` ON `forecastSnapshotOpportunities` (`snapshotId`);--> statement-breakpoint
CREATE INDEX `opportunity_idx` ON `forecastSnapshotOpportunities` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `period_idx` ON `forecastSnapshots` (`periodStart`,`periodEnd`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `forecastSnapshots` (`ownerId`);--> statement-breakpoint
CREATE INDEX `report_idx` ON `reportExecutions` (`reportId`);--> statement-breakpoint
CREATE INDEX `executed_by_idx` ON `reportExecutions` (`executedBy`);--> statement-breakpoint
CREATE INDEX `created_by_idx` ON `savedReports` (`createdBy`);--> statement-breakpoint
CREATE INDEX `type_idx` ON `savedReports` (`reportType`);