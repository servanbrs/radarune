-- Sprint 11: storage provider metadata and user identity URLs
ALTER TABLE `User` ADD COLUMN `username` VARCHAR(191) NULL,
    ADD COLUMN `usernameUpdatedAt` DATETIME(3) NULL,
    ADD COLUMN `usernameChangeAvailableAt` DATETIME(3) NULL;
CREATE UNIQUE INDEX `User_username_key` ON `User`(`username`);

ALTER TABLE `Upload` ADD COLUMN `storageProviderId` VARCHAR(191) NULL;

CREATE TABLE `UserUsernameHistory` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `oldUsername` VARCHAR(191) NOT NULL,
    `newUsername` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    UNIQUE INDEX `UserUsernameHistory_oldUsername_key`(`oldUsername`),
    INDEX `UserUsernameHistory_userId_createdAt_idx`(`userId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StorageProvider` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `type` ENUM('LOCAL', 'S3', 'S3_COMPATIBLE', 'CLOUDFLARE_R2', 'DIGITALOCEAN_SPACES', 'MINIO', 'SUPABASE_STORAGE', 'AZURE_BLOB', 'GOOGLE_CLOUD_STORAGE') NOT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'CONFIGURATION_REQUIRED', 'FAILED') NOT NULL DEFAULT 'CONFIGURATION_REQUIRED',
    `active` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `configurationEncrypted` TEXT NOT NULL,
    `localBasePath` VARCHAR(191) NULL,
    `publicBaseUrl` VARCHAR(191) NULL,
    `maxFileSizeBytes` BIGINT NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastError` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `StorageProvider_organizationId_active_idx`(`organizationId`, `active`),
    INDEX `StorageProvider_organizationId_type_status_idx`(`organizationId`, `type`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `StorageMigration` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `sourceProviderId` VARCHAR(191) NOT NULL,
    `targetProviderId` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'PARTIALLY_COMPLETED', 'FAILED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `requestedById` VARCHAR(191) NULL,
    `totalObjects` INTEGER NOT NULL DEFAULT 0,
    `processedObjects` INTEGER NOT NULL DEFAULT 0,
    `failedObjects` INTEGER NOT NULL DEFAULT 0,
    `errorMessage` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    INDEX `StorageMigration_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `StorageMigration_sourceProviderId_idx`(`sourceProviderId`),
    INDEX `StorageMigration_targetProviderId_idx`(`targetProviderId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserUsernameHistory` ADD CONSTRAINT `UserUsernameHistory_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `StorageProvider` ADD CONSTRAINT `StorageProvider_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `StorageMigration` ADD CONSTRAINT `StorageMigration_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `StorageMigration` ADD CONSTRAINT `StorageMigration_sourceProviderId_fkey` FOREIGN KEY (`sourceProviderId`) REFERENCES `StorageProvider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `StorageMigration` ADD CONSTRAINT `StorageMigration_targetProviderId_fkey` FOREIGN KEY (`targetProviderId`) REFERENCES `StorageProvider`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_storageProviderId_fkey` FOREIGN KEY (`storageProviderId`) REFERENCES `StorageProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
