CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`accountName` varchar(255) NOT NULL,
	`industry` enum('Utilities','Manufacturing','Public Sector','Healthcare','Financial Services','Telecommunications','Energy','Transportation','Other'),
	`size` int,
	`region` enum('North America','South America','Europe','Asia Pacific','Middle East','Africa'),
	`vertical` enum('Enterprise','Mid-Market','SMB','Government','Defense'),
	`securityPosture` enum('Immature','Developing','Mature','Advanced'),
	`installedTechnologies` text,
	`parentAccountId` int,
	`website` varchar(255),
	`phone` varchar(50),
	`billingAddress` text,
	`shippingAddress` text,
	`description` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`subject` varchar(255) NOT NULL,
	`type` enum('Call','Email','Meeting','Demo','PoC Milestone','Task','Note') NOT NULL,
	`activityDate` timestamp NOT NULL,
	`duration` int,
	`relatedToType` enum('Account','Contact','Lead','Opportunity') NOT NULL,
	`relatedToId` int NOT NULL,
	`notes` text,
	`outcome` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `cases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`caseNumber` varchar(50) NOT NULL,
	`subject` varchar(255) NOT NULL,
	`accountId` int NOT NULL,
	`contactId` int,
	`status` enum('Open','In Progress','Waiting on Customer','Resolved','Closed') NOT NULL DEFAULT 'Open',
	`priority` enum('Low','Medium','High','Critical') NOT NULL DEFAULT 'Medium',
	`type` enum('Technical Issue','Feature Request','Question','Bug Report'),
	`description` text,
	`resolution` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `cases_id` PRIMARY KEY(`id`),
	CONSTRAINT `cases_caseNumber_unique` UNIQUE(`caseNumber`)
);
--> statement-breakpoint
CREATE TABLE `contacts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`role` enum('CISO','CIO','CTO','Security Architect','OT Engineer','IT Manager','Procurement','Executive','Partner Rep','Other'),
	`accountId` int NOT NULL,
	`title` varchar(200),
	`department` varchar(100),
	`isPrimary` boolean DEFAULT false,
	`linkedInUrl` varchar(500),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` int AUTO_INCREMENT NOT NULL,
	`firstName` varchar(100) NOT NULL,
	`lastName` varchar(100) NOT NULL,
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`company` varchar(255) NOT NULL,
	`title` varchar(200),
	`leadSource` enum('Website','Trade Show','Partner Referral','Cold Outreach','Webinar','Content Download','Social Media','Other') NOT NULL,
	`campaignId` int,
	`score` int DEFAULT 0,
	`segment` enum('Enterprise','Mid-Market','SMB'),
	`status` enum('New','Working','Qualified','Disqualified','Converted') NOT NULL DEFAULT 'New',
	`industry` varchar(100),
	`region` varchar(100),
	`estimatedBudget` decimal(15,2),
	`timeline` varchar(100),
	`painPoints` text,
	`assignedTo` int,
	`disqualificationReason` text,
	`convertedAccountId` int,
	`convertedContactId` int,
	`convertedOpportunityId` int,
	`convertedAt` timestamp,
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lineItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`unitPrice` decimal(15,2) NOT NULL,
	`discount` decimal(5,2) DEFAULT '0',
	`totalPrice` decimal(15,2) NOT NULL,
	`description` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `lineItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `opportunities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`opportunityName` varchar(255) NOT NULL,
	`accountId` int NOT NULL,
	`stage` enum('Discovery','Solution Fit','PoC/Trial','Security Review','Procurement','Verbal Commit','Closed Won','Closed Lost') NOT NULL DEFAULT 'Discovery',
	`amount` decimal(15,2) NOT NULL,
	`closeDate` timestamp NOT NULL,
	`probability` int DEFAULT 10,
	`type` enum('New Business','Expansion','Renewal') DEFAULT 'New Business',
	`metrics` text,
	`economicBuyerId` int,
	`decisionProcess` text,
	`decisionCriteria` text,
	`identifiedPain` text,
	`championId` int,
	`competition` text,
	`nextSteps` text,
	`lossReason` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`closedAt` timestamp,
	CONSTRAINT `opportunities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`productName` varchar(255) NOT NULL,
	`productCode` varchar(100),
	`description` text,
	`category` enum('Platform License','Professional Services','Training','Support','Custom Development'),
	`listPrice` decimal(15,2),
	`isActive` boolean DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_productCode_unique` UNIQUE(`productCode`)
);
--> statement-breakpoint
CREATE TABLE `projects` (
	`id` int AUTO_INCREMENT NOT NULL,
	`projectName` varchar(255) NOT NULL,
	`accountId` int NOT NULL,
	`opportunityId` int,
	`status` enum('Planning','In Progress','On Hold','Completed','Cancelled') NOT NULL DEFAULT 'Planning',
	`goLiveDate` timestamp,
	`actualGoLiveDate` timestamp,
	`healthStatus` enum('Healthy','At Risk','Critical') DEFAULT 'Healthy',
	`adoptionLevel` enum('Low','Medium','High'),
	`activeUsers` int,
	`customerSentiment` enum('Positive','Neutral','Negative'),
	`notes` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` MODIFY COLUMN `role` enum('user','admin','sales_rep','sales_manager','marketing','customer_success','executive','partner') NOT NULL DEFAULT 'sales_rep';--> statement-breakpoint
CREATE INDEX `owner_idx` ON `accounts` (`ownerId`);--> statement-breakpoint
CREATE INDEX `parent_idx` ON `accounts` (`parentAccountId`);--> statement-breakpoint
CREATE INDEX `related_idx` ON `activities` (`relatedToType`,`relatedToId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `activities` (`ownerId`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `cases` (`accountId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `cases` (`ownerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `cases` (`status`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `contacts` (`accountId`);--> statement-breakpoint
CREATE INDEX `assigned_idx` ON `leads` (`assignedTo`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `leads` (`status`);--> statement-breakpoint
CREATE INDEX `opportunity_idx` ON `lineItems` (`opportunityId`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `opportunities` (`accountId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `opportunities` (`ownerId`);--> statement-breakpoint
CREATE INDEX `stage_idx` ON `opportunities` (`stage`);--> statement-breakpoint
CREATE INDEX `account_idx` ON `projects` (`accountId`);--> statement-breakpoint
CREATE INDEX `owner_idx` ON `projects` (`ownerId`);