CREATE TABLE `winLossAnalysis` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`outcome` enum('Won','Lost') NOT NULL,
	`primaryReason` varchar(100) NOT NULL,
	`competitorName` varchar(255),
	`dealSize` decimal(15,2),
	`customerFeedback` text,
	`lessonsLearned` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `winLossAnalysis_id` PRIMARY KEY(`id`),
	CONSTRAINT `winLossAnalysis_opportunityId_unique` UNIQUE(`opportunityId`)
);
--> statement-breakpoint
CREATE INDEX `opportunity_idx` ON `winLossAnalysis` (`opportunityId`);