ALTER TABLE `Track`
  ADD COLUMN `sourceUrl` VARCHAR(1024) NULL;

CREATE INDEX `Track_sourceUrl_idx` ON `Track`(`sourceUrl`(191));
