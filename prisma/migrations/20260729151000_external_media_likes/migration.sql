CREATE TABLE `ExternalMediaLike` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191) NOT NULL,
  `externalMediaId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  UNIQUE INDEX `ExternalMediaLike_userId_externalMediaId_key`(`userId`, `externalMediaId`),
  INDEX `ExternalMediaLike_organizationId_externalMediaId_createdAt_idx`(`organizationId`, `externalMediaId`, `createdAt`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ExternalMediaLike` ADD CONSTRAINT `ExternalMediaLike_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ExternalMediaLike` ADD CONSTRAINT `ExternalMediaLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ExternalMediaLike` ADD CONSTRAINT `ExternalMediaLike_externalMediaId_fkey` FOREIGN KEY (`externalMediaId`) REFERENCES `ExternalMediaSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
