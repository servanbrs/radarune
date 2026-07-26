-- Sprint 11: official external media providers and tenant-scoped import pipeline
CREATE TABLE `ExternalMediaSource` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `provider` ENUM('YOUTUBE', 'SPOTIFY') NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `externalUrl` VARCHAR(1024) NOT NULL,
    `normalizedUrl` VARCHAR(768) NOT NULL,
    `embedUrl` VARCHAR(1024) NULL,
    `title` VARCHAR(191) NOT NULL,
    `artistName` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `thumbnailUrl` VARCHAR(1024) NULL,
    `publishedAt` DATETIME(3) NULL,
    `playable` BOOLEAN NOT NULL DEFAULT false,
    `embeddable` BOOLEAN NOT NULL DEFAULT false,
    `regionRestrictions` JSON NULL,
    `metadataHash` VARCHAR(191) NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'PRIVATE', 'REMOVED_AT_SOURCE', 'UNAVAILABLE', 'BLOCKED') NOT NULL DEFAULT 'ACTIVE',
    `artistId` VARCHAR(191) NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ExternalMediaSource_organizationId_provider_externalId_key`(`organizationId`, `provider`, `externalId`),
    UNIQUE INDEX `ExternalMediaSource_organizationId_normalizedUrl_key`(`organizationId`, `normalizedUrl`),
    INDEX `ExternalMediaSource_organizationId_provider_status_idx`(`organizationId`, `provider`, `status`),
    INDEX `ExternalMediaSource_organizationId_lastCheckedAt_idx`(`organizationId`, `lastCheckedAt`),
    INDEX `ExternalMediaSource_artistId_idx`(`artistId`),
    INDEX `ExternalMediaSource_releaseId_idx`(`releaseId`),
    INDEX `ExternalMediaSource_trackId_idx`(`trackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportSource` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `type` ENUM('YOUTUBE_CHANNEL', 'YOUTUBE_PLAYLIST', 'SPOTIFY_ARTIST', 'SPOTIFY_PLAYLIST', 'SPOTIFY_ALBUM', 'MANUAL_URL') NOT NULL,
    `provider` ENUM('YOUTUBE', 'SPOTIFY') NULL,
    `providerExternalId` VARCHAR(191) NULL,
    `url` VARCHAR(1024) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `autoPublish` BOOLEAN NOT NULL DEFAULT false,
    `ownershipVerified` BOOLEAN NOT NULL DEFAULT false,
    `requiresReview` BOOLEAN NOT NULL DEFAULT true,
    `minDurationMs` INTEGER NULL,
    `maxDurationMs` INTEGER NULL,
    `maxAgeDays` INTEGER NULL,
    `contentFilter` JSON NULL,
    `frequencyMinutes` INTEGER NOT NULL DEFAULT 60,
    `scheduleMode` ENUM('WORKER', 'CRON', 'MANUAL', 'DATABASE_POLLING') NOT NULL DEFAULT 'CRON',
    `status` ENUM('ACTIVE', 'PAUSED', 'CONFIGURATION_REQUIRED', 'RATE_LIMITED', 'FAILED', 'DISABLED') NOT NULL DEFAULT 'CONFIGURATION_REQUIRED',
    `lastCheckedAt` DATETIME(3) NULL,
    `lastSuccessAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `cursor` TEXT NULL,
    `lockToken` VARCHAR(191) NULL,
    `lockExpiresAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ImportSource_lockToken_key`(`lockToken`),
    INDEX `ImportSource_organizationId_status_active_idx`(`organizationId`, `status`, `active`),
    INDEX `ImportSource_organizationId_type_providerExternalId_idx`(`organizationId`, `type`, `providerExternalId`),
    INDEX `ImportSource_artistId_idx`(`artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportRun` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `status` ENUM('RUNNING', 'SUCCEEDED', 'PARTIAL', 'FAILED', 'SKIPPED') NOT NULL DEFAULT 'RUNNING',
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `completedAt` DATETIME(3) NULL,
    `cursorBefore` TEXT NULL,
    `cursorAfter` TEXT NULL,
    `detectedCount` INTEGER NOT NULL DEFAULT 0,
    `importedCount` INTEGER NOT NULL DEFAULT 0,
    `duplicateCount` INTEGER NOT NULL DEFAULT 0,
    `failedCount` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ImportRun_organizationId_sourceId_startedAt_idx`(`organizationId`, `sourceId`, `startedAt`),
    INDEX `ImportRun_status_startedAt_idx`(`status`, `startedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportItem` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `runId` VARCHAR(191) NOT NULL,
    `sourceId` VARCHAR(191) NOT NULL,
    `externalMediaSourceId` VARCHAR(191) NULL,
    `provider` ENUM('YOUTUBE', 'SPOTIFY') NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `status` ENUM('DETECTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'IMPORTED', 'DUPLICATE', 'FAILED', 'REMOVED_AT_SOURCE') NOT NULL DEFAULT 'DETECTED',
    `title` VARCHAR(191) NULL,
    `artistName` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `metadataScore` INTEGER NULL,
    `matchConfidence` ENUM('EXACT', 'HIGH', 'MEDIUM', 'LOW', 'NONE') NOT NULL DEFAULT 'NONE',
    `errorMessage` TEXT NULL,
    `detectedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `ImportItem_organizationId_provider_externalId_idx`(`organizationId`, `provider`, `externalId`),
    INDEX `ImportItem_sourceId_status_createdAt_idx`(`sourceId`, `status`, `createdAt`),
    INDEX `ImportItem_externalMediaSourceId_idx`(`externalMediaSourceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportMatch` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `importItemId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NULL,
    `releaseId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `confidence` ENUM('EXACT', 'HIGH', 'MEDIUM', 'LOW', 'NONE') NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `automatic` BOOLEAN NOT NULL DEFAULT false,
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ImportMatch_organizationId_confidence_createdAt_idx`(`organizationId`, `confidence`, `createdAt`),
    INDEX `ImportMatch_importItemId_idx`(`importItemId`),
    INDEX `ImportMatch_trackId_idx`(`trackId`),
    INDEX `ImportMatch_releaseId_idx`(`releaseId`),
    INDEX `ImportMatch_artistId_idx`(`artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ImportModerationDecision` (
    `id` VARCHAR(191) NOT NULL,
    `importItemId` VARCHAR(191) NOT NULL,
    `actorUserId` VARCHAR(191) NOT NULL,
    `decision` ENUM('DETECTED', 'PENDING_REVIEW', 'APPROVED', 'REJECTED', 'IMPORTED', 'DUPLICATE', 'FAILED', 'REMOVED_AT_SOURCE') NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    INDEX `ImportModerationDecision_importItemId_createdAt_idx`(`importItemId`, `createdAt`),
    INDEX `ImportModerationDecision_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ExternalMediaSource` ADD CONSTRAINT `ExternalMediaSource_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ExternalMediaSource` ADD CONSTRAINT `ExternalMediaSource_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ExternalMediaSource` ADD CONSTRAINT `ExternalMediaSource_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ExternalMediaSource` ADD CONSTRAINT `ExternalMediaSource_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportSource` ADD CONSTRAINT `ImportSource_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportSource` ADD CONSTRAINT `ImportSource_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportSource` ADD CONSTRAINT `ImportSource_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportRun` ADD CONSTRAINT `ImportRun_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportRun` ADD CONSTRAINT `ImportRun_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `ImportSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportItem` ADD CONSTRAINT `ImportItem_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportItem` ADD CONSTRAINT `ImportItem_runId_fkey` FOREIGN KEY (`runId`) REFERENCES `ImportRun`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportItem` ADD CONSTRAINT `ImportItem_sourceId_fkey` FOREIGN KEY (`sourceId`) REFERENCES `ImportSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportItem` ADD CONSTRAINT `ImportItem_externalMediaSourceId_fkey` FOREIGN KEY (`externalMediaSourceId`) REFERENCES `ExternalMediaSource`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportMatch` ADD CONSTRAINT `ImportMatch_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportMatch` ADD CONSTRAINT `ImportMatch_importItemId_fkey` FOREIGN KEY (`importItemId`) REFERENCES `ImportItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportMatch` ADD CONSTRAINT `ImportMatch_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportMatch` ADD CONSTRAINT `ImportMatch_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportMatch` ADD CONSTRAINT `ImportMatch_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ImportModerationDecision` ADD CONSTRAINT `ImportModerationDecision_importItemId_fkey` FOREIGN KEY (`importItemId`) REFERENCES `ImportItem`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ImportModerationDecision` ADD CONSTRAINT `ImportModerationDecision_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
