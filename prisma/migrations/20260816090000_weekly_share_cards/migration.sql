CREATE TABLE `WeeklyShareCard` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `reviewedByUserId` VARCHAR(191) NULL,
    `weekStart` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `subtitle` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'APPROVED', 'REJECTED') NOT NULL DEFAULT 'DRAFT',
    `cardData` JSON NOT NULL,
    `reviewNote` TEXT NULL,
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `WeeklyShareCard_organizationId_weekStart_key` (`organizationId`, `weekStart`),
    INDEX `WeeklyShareCard_organizationId_status_createdAt_idx` (`organizationId`, `status`, `createdAt`),
    INDEX `WeeklyShareCard_createdByUserId_idx` (`createdByUserId`),
    INDEX `WeeklyShareCard_reviewedByUserId_idx` (`reviewedByUserId`),
    CONSTRAINT `WeeklyShareCard_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `WeeklyShareCard_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `WeeklyShareCard_reviewedByUserId_fkey` FOREIGN KEY (`reviewedByUserId`) REFERENCES `User` (`id`) ON DELETE SET NULL ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `WeeklyShareCardItem` (
    `id` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    PRIMARY KEY (`id`),
    UNIQUE INDEX `WeeklyShareCardItem_cardId_releaseId_key` (`cardId`, `releaseId`),
    UNIQUE INDEX `WeeklyShareCardItem_cardId_rank_key` (`cardId`, `rank`),
    INDEX `WeeklyShareCardItem_releaseId_idx` (`releaseId`),
    CONSTRAINT `WeeklyShareCardItem_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `WeeklyShareCard` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT `WeeklyShareCardItem_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
