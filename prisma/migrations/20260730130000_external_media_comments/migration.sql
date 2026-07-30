ALTER TABLE `Comment` ADD COLUMN `externalMediaId` VARCHAR(191) NULL;

CREATE INDEX `Comment_externalMediaId_status_createdAt_idx` ON `Comment`(`externalMediaId`, `status`, `createdAt`);

ALTER TABLE `Comment` ADD CONSTRAINT `Comment_externalMediaId_fkey` FOREIGN KEY (`externalMediaId`) REFERENCES `ExternalMediaSource`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
