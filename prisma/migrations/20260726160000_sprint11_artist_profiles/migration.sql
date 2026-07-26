-- Sprint 11: editable artist profiles, team roles and draft storage
ALTER TABLE `Artist`
    ADD COLUMN `youtubeProfileUrl` TEXT NULL,
    ADD COLUMN `profileImageUrl` TEXT NULL,
    ADD COLUMN `coverImageUrl` TEXT NULL,
    ADD COLUMN `shortBiography` VARCHAR(500) NULL,
    ADD COLUMN `biography` TEXT NULL,
    ADD COLUMN `country` VARCHAR(100) NULL,
    ADD COLUMN `city` VARCHAR(100) NULL,
    ADD COLUMN `genre` VARCHAR(100) NULL,
    ADD COLUMN `subgenre` VARCHAR(100) NULL,
    ADD COLUMN `language` VARCHAR(50) NULL,
    ADD COLUMN `foundedYear` INTEGER NULL,
    ADD COLUMN `tiktokProfileUrl` TEXT NULL,
    ADD COLUMN `instagramProfileUrl` TEXT NULL,
    ADD COLUMN `xProfileUrl` TEXT NULL,
    ADD COLUMN `facebookProfileUrl` TEXT NULL,
    ADD COLUMN `soundcloudProfileUrl` TEXT NULL,
    ADD COLUMN `deezerProfileUrl` TEXT NULL,
    ADD COLUMN `websiteUrl` TEXT NULL,
    ADD COLUMN `bookingEmail` VARCHAR(320) NULL,
    ADD COLUMN `managementEmail` VARCHAR(320) NULL,
    ADD COLUMN `seoTitle` VARCHAR(160) NULL,
    ADD COLUMN `seoDescription` VARCHAR(320) NULL,
    ADD COLUMN `ogImageUrl` TEXT NULL,
    ADD COLUMN `profilePublishedAt` DATETIME(3) NULL;

CREATE TABLE `ArtistTeamMember` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'MANAGER', 'EDITOR', 'ANALYST', 'FINANCE', 'VIEWER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ArtistTeamMember_artistId_userId_key`(`artistId`, `userId`),
    INDEX `ArtistTeamMember_organizationId_artistId_role_idx`(`organizationId`, `artistId`, `role`),
    INDEX `ArtistTeamMember_userId_role_idx`(`userId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `ArtistProfileDraft` (
    `id` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `data` JSON NOT NULL,
    `updatedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    UNIQUE INDEX `ArtistProfileDraft_artistId_key`(`artistId`),
    INDEX `ArtistProfileDraft_updatedById_idx`(`updatedById`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `ArtistTeamMember` ADD CONSTRAINT `ArtistTeamMember_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistTeamMember` ADD CONSTRAINT `ArtistTeamMember_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistTeamMember` ADD CONSTRAINT `ArtistTeamMember_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistProfileDraft` ADD CONSTRAINT `ArtistProfileDraft_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ArtistProfileDraft` ADD CONSTRAINT `ArtistProfileDraft_updatedById_fkey` FOREIGN KEY (`updatedById`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
