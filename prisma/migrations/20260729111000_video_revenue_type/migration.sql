ALTER TABLE `StoreRevenue`
  ADD COLUMN `contentType` VARCHAR(32) NOT NULL DEFAULT 'AUDIO';

CREATE INDEX `StoreRevenue_organizationId_contentType_reportDate_idx`
  ON `StoreRevenue`(`organizationId`, `contentType`, `reportDate`);
