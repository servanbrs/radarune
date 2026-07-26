CREATE TABLE `ArtistApplication` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NULL,
  `stageName` VARCHAR(191) NOT NULL,
  `legalName` VARCHAR(191) NOT NULL,
  `biography` TEXT NOT NULL,
  `profileImageUrl` VARCHAR(191) NULL,
  `socialLinks` JSON NULL,
  `spotifyArtistUrl` VARCHAR(191) NULL,
  `appleMusicArtistUrl` VARCHAR(191) NULL,
  `youtubeChannelUrl` VARCHAR(191) NULL,
  `documentReference` VARCHAR(191) NULL,
  `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED') NOT NULL DEFAULT 'PENDING',
  `adminNotes` TEXT NULL,
  `reviewedByUserId` VARCHAR(191) NULL,
  `reviewedAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ArtistApplication_organizationId_status_createdAt_idx` ON `ArtistApplication`(`organizationId`, `status`, `createdAt`);
CREATE INDEX `ArtistApplication_userId_status_idx` ON `ArtistApplication`(`userId`, `status`);
CREATE INDEX `ArtistApplication_artistId_idx` ON `ArtistApplication`(`artistId`);

CREATE TABLE `ArtistApplicationStatusHistory` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `applicationId` VARCHAR(191) NOT NULL,
  `previousStatus` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED') NULL,
  `status` ENUM('PENDING', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED') NOT NULL,
  `actorUserId` VARCHAR(191) NULL,
  `reason` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `ArtistApplicationStatusHistory_organizationId_createdAt_idx` ON `ArtistApplicationStatusHistory`(`organizationId`, `createdAt`);
CREATE INDEX `ArtistApplicationStatusHistory_applicationId_createdAt_idx` ON `ArtistApplicationStatusHistory`(`applicationId`, `createdAt`);

CREATE TABLE `Notification` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NULL,
  `userId` VARCHAR(191) NOT NULL,
  `type` VARCHAR(191) NOT NULL,
  `title` VARCHAR(191) NOT NULL,
  `message` TEXT NOT NULL,
  `entityType` VARCHAR(191) NULL,
  `entityId` VARCHAR(191) NULL,
  `readAt` DATETIME(3) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `Notification_organizationId_createdAt_idx` ON `Notification`(`organizationId`, `createdAt`);
CREATE INDEX `Notification_userId_readAt_createdAt_idx` ON `Notification`(`userId`, `readAt`, `createdAt`);

CREATE TABLE `SystemLog` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NULL,
  `level` ENUM('DEBUG', 'INFO', 'WARN', 'ERROR', 'CRITICAL') NOT NULL,
  `source` ENUM('APPLICATION', 'API', 'DISTRIBUTION_WORKER', 'WEBHOOK', 'VALIDATION', 'PROVIDER_CONNECTION') NOT NULL,
  `message` TEXT NOT NULL,
  `entityType` VARCHAR(191) NULL,
  `entityId` VARCHAR(191) NULL,
  `metadata` JSON NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE INDEX `SystemLog_organizationId_level_createdAt_idx` ON `SystemLog`(`organizationId`, `level`, `createdAt`);
CREATE INDEX `SystemLog_source_createdAt_idx` ON `SystemLog`(`source`, `createdAt`);

CREATE TABLE `AdminSetting` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NULL,
  `key` ENUM('PLATFORM_NAME', 'LOGO_URL', 'SUPPORT_EMAIL', 'DEFAULT_DISTRIBUTION_PROVIDER', 'AUTO_DISTRIBUTION_ENABLED', 'MAX_AUDIO_FILE_SIZE_BYTES', 'MAX_ARTWORK_FILE_SIZE_BYTES', 'MIN_ARTWORK_RESOLUTION', 'USER_REGISTRATION_ENABLED', 'ARTIST_APPLICATIONS_ENABLED', 'EMAIL_VERIFICATION_REQUIRED', 'MAINTENANCE_MODE_ENABLED', 'MAINTENANCE_MESSAGE') NOT NULL,
  `value` JSON NOT NULL,
  `updatedByUserId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE UNIQUE INDEX `AdminSetting_organizationId_key_key` ON `AdminSetting`(`organizationId`, `key`);
CREATE INDEX `AdminSetting_key_idx` ON `AdminSetting`(`key`);

ALTER TABLE `ArtistApplication` ADD CONSTRAINT `ArtistApplication_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistApplication` ADD CONSTRAINT `ArtistApplication_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistApplication` ADD CONSTRAINT `ArtistApplication_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ArtistApplication` ADD CONSTRAINT `ArtistApplication_reviewedByUserId_fkey` FOREIGN KEY (`reviewedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ArtistApplicationStatusHistory` ADD CONSTRAINT `ArtistApplicationStatusHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistApplicationStatusHistory` ADD CONSTRAINT `ArtistApplicationStatusHistory_applicationId_fkey` FOREIGN KEY (`applicationId`) REFERENCES `ArtistApplication`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistApplicationStatusHistory` ADD CONSTRAINT `ArtistApplicationStatusHistory_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SystemLog` ADD CONSTRAINT `SystemLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdminSetting` ADD CONSTRAINT `AdminSetting_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
