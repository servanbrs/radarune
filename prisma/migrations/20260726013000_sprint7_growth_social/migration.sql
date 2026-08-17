-- CreateTable
CREATE TABLE `SmartLink` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `backgroundType` ENUM('COLOR', 'GRADIENT', 'IMAGE') NOT NULL DEFAULT 'GRADIENT',
    `backgroundImageUrl` VARCHAR(191) NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'RADARUNE',
    `ctaText` VARCHAR(191) NOT NULL DEFAULT 'Dinle',
    `releaseDate` DATETIME(3) NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `seoTitle` VARCHAR(191) NULL,
    `seoDescription` VARCHAR(191) NULL,
    `ogImageUrl` VARCHAR(191) NULL,
    `customPixelSettings` JSON NULL,
    `utmDefaults` JSON NULL,
    `featuredForArtistId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SmartLink_slug_key`(`slug`),
    INDEX `SmartLink_organizationId_artistId_createdAt_idx`(`organizationId`, `artistId`, `createdAt`),
    INDEX `SmartLink_releaseId_idx`(`releaseId`),
    INDEX `SmartLink_active_slug_idx`(`active`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmartLinkPlatform` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `smartLinkId` VARCHAR(191) NOT NULL,
    `platform` ENUM('SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE_MUSIC', 'YOUTUBE', 'DEEZER', 'AMAZON_MUSIC', 'TIDAL', 'SOUNDCLOUD', 'TIKTOK', 'INSTAGRAM', 'FACEBOOK', 'PANDORA', 'SHAZAM', 'BANDCAMP', 'CUSTOM') NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `buttonText` VARCHAR(191) NULL,
    `countryRestriction` JSON NULL,
    `deviceRestriction` JSON NULL,
    `clickCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SmartLinkPlatform_organizationId_platform_idx`(`organizationId`, `platform`),
    INDEX `SmartLinkPlatform_smartLinkId_sortOrder_idx`(`smartLinkId`, `sortOrder`),
    UNIQUE INDEX `SmartLinkPlatform_smartLinkId_platform_url_key`(`smartLinkId`, `platform`, `url`(512)),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmartLinkView` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `smartLinkId` VARCHAR(191) NOT NULL,
    `visitorHash` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `city` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `browser` VARCHAR(191) NULL,
    `referrer` VARCHAR(2048) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `isBot` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmartLinkView_organizationId_smartLinkId_createdAt_idx`(`organizationId`, `smartLinkId`, `createdAt`),
    INDEX `SmartLinkView_smartLinkId_country_createdAt_idx`(`smartLinkId`, `country`, `createdAt`),
    UNIQUE INDEX `SmartLinkView_smartLinkId_visitorHash_createdAt_key`(`smartLinkId`, `visitorHash`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SmartLinkClick` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `smartLinkId` VARCHAR(191) NOT NULL,
    `platformId` VARCHAR(191) NOT NULL,
    `visitorHash` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NULL,
    `device` VARCHAR(191) NULL,
    `referrer` VARCHAR(2048) NULL,
    `utmSource` VARCHAR(191) NULL,
    `utmMedium` VARCHAR(191) NULL,
    `utmCampaign` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SmartLinkClick_organizationId_smartLinkId_createdAt_idx`(`organizationId`, `smartLinkId`, `createdAt`),
    INDEX `SmartLinkClick_platformId_createdAt_idx`(`platformId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PreSaveCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `releaseDate` DATETIME(3) NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `spotifyEnabled` BOOLEAN NOT NULL DEFAULT false,
    `appleMusicEnabled` BOOLEAN NOT NULL DEFAULT false,
    `emailCaptureEnabled` BOOLEAN NOT NULL DEFAULT true,
    `marketingConsentText` TEXT NULL,
    `successMessage` VARCHAR(191) NOT NULL,
    `redirectUrl` VARCHAR(2048) NULL,
    `theme` VARCHAR(191) NOT NULL DEFAULT 'RADARUNE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PreSaveCampaign_slug_key`(`slug`),
    INDEX `PreSaveCampaign_organizationId_artistId_createdAt_idx`(`organizationId`, `artistId`, `createdAt`),
    INDEX `PreSaveCampaign_releaseId_idx`(`releaseId`),
    INDEX `PreSaveCampaign_active_slug_idx`(`active`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PreSaveProvider` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `provider` ENUM('SPOTIFY', 'APPLE_MUSIC', 'EMAIL_REMINDER') NOT NULL,
    `capabilities` JSON NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `configurationStatus` VARCHAR(191) NOT NULL DEFAULT 'CONFIGURATION_REQUIRED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PreSaveProvider_organizationId_provider_idx`(`organizationId`, `provider`),
    UNIQUE INDEX `PreSaveProvider_campaignId_provider_key`(`campaignId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PreSaveConversion` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `provider` ENUM('SPOTIFY', 'APPLE_MUSIC', 'EMAIL_REMINDER') NOT NULL,
    `providerUserId` VARCHAR(191) NULL,
    `emailHash` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CONFIGURATION_REQUIRED') NOT NULL,
    `consentAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PreSaveConversion_organizationId_campaignId_createdAt_idx`(`organizationId`, `campaignId`, `createdAt`),
    INDEX `PreSaveConversion_provider_status_idx`(`provider`, `status`),
    UNIQUE INDEX `PreSaveConversion_campaignId_provider_providerUserId_key`(`campaignId`, `provider`, `providerUserId`),
    UNIQUE INDEX `PreSaveConversion_campaignId_emailHash_key`(`campaignId`, `emailHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PreSaveSubscriber` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `emailNormalized` VARCHAR(191) NOT NULL,
    `emailHash` VARCHAR(191) NOT NULL,
    `marketingConsent` BOOLEAN NOT NULL DEFAULT false,
    `consentText` TEXT NULL,
    `unsubscribeToken` VARCHAR(191) NOT NULL,
    `unsubscribedAt` DATETIME(3) NULL,
    `reminderQueuedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `PreSaveSubscriber_unsubscribeToken_key`(`unsubscribeToken`),
    INDEX `PreSaveSubscriber_organizationId_campaignId_createdAt_idx`(`organizationId`, `campaignId`, `createdAt`),
    UNIQUE INDEX `PreSaveSubscriber_campaignId_emailHash_key`(`campaignId`, `emailHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OAuthConnection` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `provider` ENUM('SPOTIFY', 'APPLE_MUSIC', 'EMAIL_REMINDER') NOT NULL,
    `stateHash` VARCHAR(191) NOT NULL,
    `codeVerifierEncrypted` VARCHAR(191) NULL,
    `accessTokenEncrypted` VARCHAR(191) NULL,
    `refreshTokenEncrypted` VARCHAR(191) NULL,
    `providerUserId` VARCHAR(191) NULL,
    `scopes` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'ACTIVE', 'FAILED', 'REVOKED') NOT NULL DEFAULT 'PENDING',
    `consentAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `usedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `OAuthConnection_stateHash_key`(`stateHash`),
    INDEX `OAuthConnection_organizationId_campaignId_provider_idx`(`organizationId`, `campaignId`, `provider`),
    INDEX `OAuthConnection_status_expiresAt_idx`(`status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtistProfileLink` (
    `id` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `url` VARCHAR(2048) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ArtistProfileLink_artistId_sortOrder_idx`(`artistId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtistSlugHistory` (
    `id` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `oldSlug` VARCHAR(191) NOT NULL,
    `newSlug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ArtistSlugHistory_oldSlug_key`(`oldSlug`),
    INDEX `ArtistSlugHistory_artistId_createdAt_idx`(`artistId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Follow` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Follow_organizationId_artistId_createdAt_idx`(`organizationId`, `artistId`, `createdAt`),
    UNIQUE INDEX `Follow_userId_artistId_key`(`userId`, `artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseLike` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReleaseLike_organizationId_releaseId_createdAt_idx`(`organizationId`, `releaseId`, `createdAt`),
    UNIQUE INDEX `ReleaseLike_userId_releaseId_key`(`userId`, `releaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrackLike` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrackLike_organizationId_trackId_createdAt_idx`(`organizationId`, `trackId`, `createdAt`),
    UNIQUE INDEX `TrackLike_userId_trackId_key`(`userId`, `trackId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Playlist` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `coverImageUrl` VARCHAR(191) NULL,
    `public` BOOLEAN NOT NULL DEFAULT false,
    `collaborative` BOOLEAN NOT NULL DEFAULT false,
    `featured` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Playlist_slug_key`(`slug`),
    INDEX `Playlist_ownerUserId_createdAt_idx`(`ownerUserId`, `createdAt`),
    INDEX `Playlist_organizationId_public_createdAt_idx`(`organizationId`, `public`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaylistTrack` (
    `id` VARCHAR(191) NOT NULL,
    `playlistId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL,
    `addedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlaylistTrack_trackId_idx`(`trackId`),
    UNIQUE INDEX `PlaylistTrack_playlistId_trackId_key`(`playlistId`, `trackId`),
    UNIQUE INDEX `PlaylistTrack_playlistId_sortOrder_key`(`playlistId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaylistCollaborator` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `playlistId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'EDITOR',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlaylistCollaborator_userId_idx`(`userId`),
    UNIQUE INDEX `PlaylistCollaborator_playlistId_userId_key`(`playlistId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaylistLike` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `playlistId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PlaylistLike_playlistId_createdAt_idx`(`playlistId`, `createdAt`),
    UNIQUE INDEX `PlaylistLike_userId_playlistId_key`(`userId`, `playlistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Comment` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `authorUserId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NULL,
    `playlistId` VARCHAR(191) NULL,
    `storyId` VARCHAR(191) NULL,
    `parentCommentId` VARCHAR(191) NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('VISIBLE', 'HIDDEN', 'PENDING_REVIEW', 'REMOVED', 'SPAM') NOT NULL DEFAULT 'VISIBLE',
    `editedAt` DATETIME(3) NULL,
    `deletedAt` DATETIME(3) NULL,
    `moderationReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Comment_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `Comment_releaseId_status_createdAt_idx`(`releaseId`, `status`, `createdAt`),
    INDEX `Comment_trackId_status_createdAt_idx`(`trackId`, `status`, `createdAt`),
    INDEX `Comment_playlistId_status_createdAt_idx`(`playlistId`, `status`, `createdAt`),
    INDEX `Comment_storyId_status_createdAt_idx`(`storyId`, `status`, `createdAt`),
    INDEX `Comment_authorUserId_createdAt_idx`(`authorUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CommentLike` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `commentId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CommentLike_commentId_createdAt_idx`(`commentId`, `createdAt`),
    UNIQUE INDEX `CommentLike_userId_commentId_key`(`userId`, `commentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Story` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `ownerUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `releaseId` VARCHAR(191) NULL,
    `smartLinkId` VARCHAR(191) NULL,
    `type` ENUM('IMAGE', 'VIDEO', 'TEXT', 'RELEASE_SHARE', 'SMART_LINK_SHARE') NOT NULL,
    `mediaUrl` VARCHAR(2048) NULL,
    `text` TEXT NULL,
    `linkUrl` VARCHAR(2048) NULL,
    `publishedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `pinned` BOOLEAN NOT NULL DEFAULT false,
    `viewCount` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('DRAFT', 'ACTIVE', 'EXPIRED', 'REMOVED') NOT NULL DEFAULT 'DRAFT',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Story_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `Story_artistId_status_expiresAt_idx`(`artistId`, `status`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoryView` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `storyId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `visitorHash` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `StoryView_storyId_createdAt_idx`(`storyId`, `createdAt`),
    UNIQUE INDEX `StoryView_storyId_visitorHash_key`(`storyId`, `visitorHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DiscoverEvent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `visitorHash` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NULL,
    `eventType` ENUM('IMPRESSION', 'PLAY', 'PAUSE', 'SKIP', 'LIKE', 'DISLIKE', 'COMPLETE', 'PROFILE_OPEN', 'ADD_TO_PLAYLIST', 'SHARE') NOT NULL,
    `score` DECIMAL(10, 4) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DiscoverEvent_eventType_createdAt_idx`(`eventType`, `createdAt`),
    INDEX `DiscoverEvent_userId_eventType_createdAt_idx`(`userId`, `eventType`, `createdAt`),
    INDEX `DiscoverEvent_trackId_eventType_createdAt_idx`(`trackId`, `eventType`, `createdAt`),
    UNIQUE INDEX `DiscoverEvent_userId_trackId_eventType_createdAt_key`(`userId`, `trackId`, `eventType`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserMusicPreference` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `genre` VARCHAR(191) NOT NULL,
    `weight` INTEGER NOT NULL DEFAULT 1,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserMusicPreference_genre_idx`(`genre`),
    UNIQUE INDEX `UserMusicPreference_userId_genre_key`(`userId`, `genre`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ContentReport` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `reporterUserId` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `reason` ENUM('SPAM', 'HARASSMENT', 'COPYRIGHT', 'INAPPROPRIATE_CONTENT', 'IMPERSONATION', 'MISLEADING', 'OTHER') NOT NULL,
    `details` TEXT NULL,
    `status` ENUM('OPEN', 'UNDER_REVIEW', 'RESOLVED', 'REJECTED') NOT NULL DEFAULT 'OPEN',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ContentReport_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `ContentReport_entityType_entityId_idx`(`entityType`, `entityId`),
    INDEX `ContentReport_reporterUserId_createdAt_idx`(`reporterUserId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ModerationAction` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `reportId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NOT NULL,
    `action` ENUM('HIDE', 'RESTORE', 'REMOVE', 'WARN_USER', 'SUSPEND_USER', 'RESOLVE_REPORT', 'REJECT_REPORT') NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `reason` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ModerationAction_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `ModerationAction_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `SmartLink` ADD CONSTRAINT `SmartLink_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLink` ADD CONSTRAINT `SmartLink_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLink` ADD CONSTRAINT `SmartLink_featuredForArtistId_fkey` FOREIGN KEY (`featuredForArtistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLink` ADD CONSTRAINT `SmartLink_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkPlatform` ADD CONSTRAINT `SmartLinkPlatform_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkPlatform` ADD CONSTRAINT `SmartLinkPlatform_smartLinkId_fkey` FOREIGN KEY (`smartLinkId`) REFERENCES `SmartLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkView` ADD CONSTRAINT `SmartLinkView_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkView` ADD CONSTRAINT `SmartLinkView_smartLinkId_fkey` FOREIGN KEY (`smartLinkId`) REFERENCES `SmartLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkClick` ADD CONSTRAINT `SmartLinkClick_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkClick` ADD CONSTRAINT `SmartLinkClick_smartLinkId_fkey` FOREIGN KEY (`smartLinkId`) REFERENCES `SmartLink`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SmartLinkClick` ADD CONSTRAINT `SmartLinkClick_platformId_fkey` FOREIGN KEY (`platformId`) REFERENCES `SmartLinkPlatform`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveCampaign` ADD CONSTRAINT `PreSaveCampaign_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveCampaign` ADD CONSTRAINT `PreSaveCampaign_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveCampaign` ADD CONSTRAINT `PreSaveCampaign_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveProvider` ADD CONSTRAINT `PreSaveProvider_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveProvider` ADD CONSTRAINT `PreSaveProvider_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `PreSaveCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveConversion` ADD CONSTRAINT `PreSaveConversion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveConversion` ADD CONSTRAINT `PreSaveConversion_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `PreSaveCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveConversion` ADD CONSTRAINT `PreSaveConversion_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveSubscriber` ADD CONSTRAINT `PreSaveSubscriber_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveSubscriber` ADD CONSTRAINT `PreSaveSubscriber_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `PreSaveCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PreSaveSubscriber` ADD CONSTRAINT `PreSaveSubscriber_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthConnection` ADD CONSTRAINT `OAuthConnection_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthConnection` ADD CONSTRAINT `OAuthConnection_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `PreSaveCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OAuthConnection` ADD CONSTRAINT `OAuthConnection_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistProfileLink` ADD CONSTRAINT `ArtistProfileLink_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtistSlugHistory` ADD CONSTRAINT `ArtistSlugHistory_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Follow` ADD CONSTRAINT `Follow_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseLike` ADD CONSTRAINT `ReleaseLike_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseLike` ADD CONSTRAINT `ReleaseLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseLike` ADD CONSTRAINT `ReleaseLike_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackLike` ADD CONSTRAINT `TrackLike_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackLike` ADD CONSTRAINT `TrackLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackLike` ADD CONSTRAINT `TrackLike_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Playlist` ADD CONSTRAINT `Playlist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `PlaylistTrack_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `PlaylistTrack_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistTrack` ADD CONSTRAINT `PlaylistTrack_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistCollaborator` ADD CONSTRAINT `PlaylistCollaborator_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistCollaborator` ADD CONSTRAINT `PlaylistCollaborator_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistCollaborator` ADD CONSTRAINT `PlaylistCollaborator_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistLike` ADD CONSTRAINT `PlaylistLike_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistLike` ADD CONSTRAINT `PlaylistLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaylistLike` ADD CONSTRAINT `PlaylistLike_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_authorUserId_fkey` FOREIGN KEY (`authorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_playlistId_fkey` FOREIGN KEY (`playlistId`) REFERENCES `Playlist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `Story`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Comment` ADD CONSTRAINT `Comment_parentCommentId_fkey` FOREIGN KEY (`parentCommentId`) REFERENCES `Comment`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentLike` ADD CONSTRAINT `CommentLike_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CommentLike` ADD CONSTRAINT `CommentLike_commentId_fkey` FOREIGN KEY (`commentId`) REFERENCES `Comment`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Story` ADD CONSTRAINT `Story_smartLinkId_fkey` FOREIGN KEY (`smartLinkId`) REFERENCES `SmartLink`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryView` ADD CONSTRAINT `StoryView_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryView` ADD CONSTRAINT `StoryView_storyId_fkey` FOREIGN KEY (`storyId`) REFERENCES `Story`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoryView` ADD CONSTRAINT `StoryView_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoverEvent` ADD CONSTRAINT `DiscoverEvent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoverEvent` ADD CONSTRAINT `DiscoverEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoverEvent` ADD CONSTRAINT `DiscoverEvent_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoverEvent` ADD CONSTRAINT `DiscoverEvent_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DiscoverEvent` ADD CONSTRAINT `DiscoverEvent_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserMusicPreference` ADD CONSTRAINT `UserMusicPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentReport` ADD CONSTRAINT `ContentReport_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ContentReport` ADD CONSTRAINT `ContentReport_reporterUserId_fkey` FOREIGN KEY (`reporterUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationAction` ADD CONSTRAINT `ModerationAction_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationAction` ADD CONSTRAINT `ModerationAction_reportId_fkey` FOREIGN KEY (`reportId`) REFERENCES `ContentReport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ModerationAction` ADD CONSTRAINT `ModerationAction_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
