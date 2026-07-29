ALTER TABLE `Label` ADD COLUMN `parentLabelId` VARCHAR(191) NULL;
CREATE INDEX `Label_parentLabelId_idx` ON `Label`(`parentLabelId`);
ALTER TABLE `Label` ADD CONSTRAINT `Label_parentLabelId_fkey` FOREIGN KEY (`parentLabelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
