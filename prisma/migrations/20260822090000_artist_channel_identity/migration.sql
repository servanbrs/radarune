ALTER TABLE `Comment`
  ADD COLUMN `authorArtistId` VARCHAR(191) NULL;

CREATE INDEX `Comment_authorArtistId_createdAt_idx`
  ON `Comment`(`authorArtistId`, `createdAt`);

ALTER TABLE `Comment`
  ADD CONSTRAINT `Comment_authorArtistId_fkey`
  FOREIGN KEY (`authorArtistId`) REFERENCES `Artist`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE `ArtistChannelLike` (
  `id` VARCHAR(191) NOT NULL,
  `organizationId` VARCHAR(191) NOT NULL,
  `artistId` VARCHAR(191) NOT NULL,
  `performedByUserId` VARCHAR(191) NOT NULL,
  `releaseId` VARCHAR(191) NULL,
  `trackId` VARCHAR(191) NULL,
  `externalMediaId` VARCHAR(191) NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ArtistChannelLike_artistId_releaseId_key` (`artistId`, `releaseId`),
  UNIQUE INDEX `ArtistChannelLike_artistId_trackId_key` (`artistId`, `trackId`),
  UNIQUE INDEX `ArtistChannelLike_artistId_externalMediaId_key` (`artistId`, `externalMediaId`),
  INDEX `ArtistChannelLike_organizationId_artistId_createdAt_idx` (`organizationId`, `artistId`, `createdAt`),
  INDEX `ArtistChannelLike_performedByUserId_idx` (`performedByUserId`),
  INDEX `ArtistChannelLike_releaseId_idx` (`releaseId`),
  INDEX `ArtistChannelLike_trackId_idx` (`trackId`),
  INDEX `ArtistChannelLike_externalMediaId_idx` (`externalMediaId`),
  CONSTRAINT `ArtistChannelLike_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistChannelLike_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistChannelLike_performedByUserId_fkey` FOREIGN KEY (`performedByUserId`) REFERENCES `User` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistChannelLike_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistChannelLike_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `ArtistChannelLike_externalMediaId_fkey` FOREIGN KEY (`externalMediaId`) REFERENCES `ExternalMediaSource` (`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
