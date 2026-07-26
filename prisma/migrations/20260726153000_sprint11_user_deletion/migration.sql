-- Sprint 11: auditable user deletion requests and retention-safe anonymization
CREATE TABLE `UserDeletionRequest` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NOT NULL,
    `reviewedById` VARCHAR(191) NULL,
    `status` ENUM('REQUESTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'REQUESTED',
    `reason` TEXT NOT NULL,
    `reviewNote` TEXT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `reviewedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    INDEX `UserDeletionRequest_organizationId_status_requestedAt_idx`(`organizationId`, `status`, `requestedAt`),
    INDEX `UserDeletionRequest_userId_status_idx`(`userId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `UserDeletionRequest` ADD CONSTRAINT `UserDeletionRequest_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserDeletionRequest` ADD CONSTRAINT `UserDeletionRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserDeletionRequest` ADD CONSTRAINT `UserDeletionRequest_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `UserDeletionRequest` ADD CONSTRAINT `UserDeletionRequest_reviewedById_fkey` FOREIGN KEY (`reviewedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
