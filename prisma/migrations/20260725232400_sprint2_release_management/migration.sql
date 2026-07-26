-- CreateTable
CREATE TABLE `User` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `systemRole` ENUM('USER', 'ARTIST', 'MODERATOR', 'ADMIN', 'SUPER_ADMIN') NOT NULL DEFAULT 'USER',
    `accountStatus` ENUM('ACTIVE', 'SUSPENDED', 'BANNED') NOT NULL DEFAULT 'ACTIVE',
    `image` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Session` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `token` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `ipAddress` VARCHAR(191) NULL,
    `userAgent` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Session_token_key`(`token`),
    INDEX `Session_userId_idx`(`userId`),
    INDEX `Session_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Account` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `accountId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `accessToken` TEXT NULL,
    `refreshToken` TEXT NULL,
    `accessTokenExpiresAt` DATETIME(3) NULL,
    `refreshTokenExpiresAt` DATETIME(3) NULL,
    `scope` VARCHAR(191) NULL,
    `idToken` TEXT NULL,
    `password` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Account_userId_idx`(`userId`),
    UNIQUE INDEX `Account_providerId_accountId_key`(`providerId`, `accountId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Verification` (
    `id` VARCHAR(191) NOT NULL,
    `identifier` VARCHAR(191) NOT NULL,
    `value` VARCHAR(191) NOT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Verification_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `Verification_identifier_value_key`(`identifier`, `value`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Organization` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Organization_slug_key`(`slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrganizationMembership` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OrganizationMembership_userId_idx`(`userId`),
    INDEX `OrganizationMembership_organizationId_idx`(`organizationId`),
    UNIQUE INDEX `OrganizationMembership_organizationId_userId_key`(`organizationId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Label` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NULL,
    `status` ENUM('ACTIVE', 'INACTIVE') NOT NULL DEFAULT 'ACTIVE',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Label_organizationId_idx`(`organizationId`),
    INDEX `Label_createdByUserId_idx`(`createdByUserId`),
    UNIQUE INDEX `Label_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Artist` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `ownerUserId` VARCHAR(191) NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `sortName` VARCHAR(191) NULL,
    `type` ENUM('SOLO', 'BAND', 'PRODUCER', 'DJ', 'COMPOSER') NOT NULL,
    `spotifyProfileUrl` VARCHAR(191) NULL,
    `appleMusicProfileUrl` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Artist_organizationId_idx`(`organizationId`),
    INDEX `Artist_createdByUserId_idx`(`createdByUserId`),
    INDEX `Artist_ownerUserId_idx`(`ownerUserId`),
    UNIQUE INDEX `Artist_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabelArtist` (
    `id` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LabelArtist_artistId_idx`(`artistId`),
    UNIQUE INDEX `LabelArtist_labelId_artistId_key`(`labelId`, `artistId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Upload` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NULL,
    `kind` ENUM('AUDIO', 'ARTWORK') NOT NULL,
    `status` ENUM('PENDING', 'READY', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `byteSize` BIGINT NOT NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `checksumSha256` VARCHAR(191) NULL,
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `durationMs` INTEGER NULL,
    `failureReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Upload_organizationId_kind_status_idx`(`organizationId`, `kind`, `status`),
    INDEX `Upload_releaseId_idx`(`releaseId`),
    INDEX `Upload_trackId_idx`(`trackId`),
    UNIQUE INDEX `Upload_storageKey_key`(`storageKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Release` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `submittedByUserId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `versionTitle` VARCHAR(191) NULL,
    `primaryLanguage` VARCHAR(191) NOT NULL,
    `primaryGenre` VARCHAR(191) NOT NULL,
    `secondaryGenre` VARCHAR(191) NULL,
    `type` ENUM('SINGLE', 'EP', 'ALBUM') NOT NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'QUEUED', 'PROCESSING', 'DISTRIBUTED', 'LIVE', 'TAKEDOWN_REQUESTED', 'REMOVED') NOT NULL DEFAULT 'DRAFT',
    `explicit` BOOLEAN NOT NULL DEFAULT false,
    `copyrightP` VARCHAR(191) NOT NULL,
    `copyrightC` VARCHAR(191) NOT NULL,
    `plannedReleaseDate` DATETIME(3) NULL,
    `originalReleaseDate` DATETIME(3) NULL,
    `previouslyReleased` BOOLEAN NOT NULL DEFAULT false,
    `upc` VARCHAR(191) NULL,
    `artworkUploadId` VARCHAR(191) NULL,
    `distributionProvider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NULL,
    `worldwideDistribution` BOOLEAN NOT NULL DEFAULT true,
    `presaveEnabled` BOOLEAN NOT NULL DEFAULT false,
    `dolbyAtmosEnabled` BOOLEAN NOT NULL DEFAULT false,
    `contentIdEnabled` BOOLEAN NOT NULL DEFAULT false,
    `submittedAt` DATETIME(3) NULL,
    `approvedAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `liveAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Release_organizationId_status_updatedAt_idx`(`organizationId`, `status`, `updatedAt`),
    INDEX `Release_createdByUserId_status_idx`(`createdByUserId`, `status`),
    INDEX `Release_labelId_idx`(`labelId`),
    INDEX `Release_upc_idx`(`upc`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Track` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `versionTitle` VARCHAR(191) NULL,
    `trackNumber` INTEGER NOT NULL,
    `discNumber` INTEGER NOT NULL DEFAULT 1,
    `language` VARCHAR(191) NOT NULL,
    `explicit` BOOLEAN NOT NULL DEFAULT false,
    `instrumental` BOOLEAN NOT NULL DEFAULT false,
    `previouslyReleased` BOOLEAN NOT NULL DEFAULT false,
    `isrc` VARCHAR(191) NULL,
    `audioUploadId` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `lyrics` TEXT NULL,
    `previewStartSeconds` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Track_organizationId_idx`(`organizationId`),
    INDEX `Track_isrc_idx`(`isrc`),
    UNIQUE INDEX `Track_releaseId_discNumber_trackNumber_key`(`releaseId`, `discNumber`, `trackNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseArtist` (
    `id` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `role` ENUM('PRIMARY_ARTIST', 'FEATURED_ARTIST', 'REMIXER', 'PRODUCER') NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReleaseArtist_artistId_idx`(`artistId`),
    UNIQUE INDEX `ReleaseArtist_releaseId_artistId_role_key`(`releaseId`, `artistId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrackArtist` (
    `id` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `artistId` VARCHAR(191) NOT NULL,
    `role` ENUM('PRIMARY_ARTIST', 'FEATURED_ARTIST', 'REMIXER', 'PRODUCER') NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrackArtist_artistId_idx`(`artistId`),
    UNIQUE INDEX `TrackArtist_trackId_artistId_role_key`(`trackId`, `artistId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Contributor` (
    `id` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `role` ENUM('COMPOSER', 'LYRICIST', 'PRODUCER', 'MIXING_ENGINEER', 'MASTERING_ENGINEER', 'ARRANGER', 'VOCALIST', 'BACKGROUND_VOCALIST', 'GUITARIST', 'BASSIST', 'PIANIST', 'DRUMMER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Contributor_releaseId_role_idx`(`releaseId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TrackContributor` (
    `id` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `contributorId` VARCHAR(191) NOT NULL,
    `role` ENUM('COMPOSER', 'LYRICIST', 'PRODUCER', 'MIXING_ENGINEER', 'MASTERING_ENGINEER', 'ARRANGER', 'VOCALIST', 'BACKGROUND_VOCALIST', 'GUITARIST', 'BASSIST', 'PIANIST', 'DRUMMER') NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `TrackContributor_contributorId_idx`(`contributorId`),
    UNIQUE INDEX `TrackContributor_trackId_contributorId_role_key`(`trackId`, `contributorId`, `role`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionSelection` (
    `id` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `releaseDate` DATETIME(3) NULL,
    `worldwideDistribution` BOOLEAN NOT NULL DEFAULT true,
    `presaveEnabled` BOOLEAN NOT NULL DEFAULT false,
    `dolbyAtmosEnabled` BOOLEAN NOT NULL DEFAULT false,
    `contentIdEnabled` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DistributionSelection_releaseId_key`(`releaseId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseStore` (
    `id` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `storeCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReleaseStore_releaseId_storeCode_key`(`releaseId`, `storeCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseTerritory` (
    `id` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `territoryCode` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReleaseTerritory_releaseId_territoryCode_key`(`releaseId`, `territoryCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseValidationIssue` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NULL,
    `fieldPath` VARCHAR(191) NOT NULL,
    `step` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'ERROR') NOT NULL DEFAULT 'ERROR',
    `resolvedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReleaseValidationIssue_organizationId_releaseId_idx`(`organizationId`, `releaseId`),
    INDEX `ReleaseValidationIssue_releaseId_severity_resolvedAt_idx`(`releaseId`, `severity`, `resolvedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `previousStatus` ENUM('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'QUEUED', 'PROCESSING', 'DISTRIBUTED', 'LIVE', 'TAKEDOWN_REQUESTED', 'REMOVED') NULL,
    `status` ENUM('DRAFT', 'PENDING_REVIEW', 'REVISION_REQUESTED', 'APPROVED', 'REJECTED', 'QUEUED', 'PROCESSING', 'DISTRIBUTED', 'LIVE', 'TAKEDOWN_REQUESTED', 'REMOVED') NOT NULL,
    `actorUserId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReleaseStatusHistory_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `ReleaseStatusHistory_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionProviderConfiguration` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT false,
    `environment` ENUM('SANDBOX', 'PRODUCTION') NOT NULL DEFAULT 'SANDBOX',
    `priority` INTEGER NOT NULL DEFAULT 100,
    `maxRetryCount` INTEGER NOT NULL DEFAULT 3,
    `timeoutSeconds` INTEGER NOT NULL DEFAULT 30,
    `supportsAutoIsrc` BOOLEAN NOT NULL DEFAULT false,
    `supportsAutoUpc` BOOLEAN NOT NULL DEFAULT false,
    `supportsWebhooks` BOOLEAN NOT NULL DEFAULT false,
    `supportsUpdate` BOOLEAN NOT NULL DEFAULT false,
    `supportsTakedown` BOOLEAN NOT NULL DEFAULT false,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `credentials` JSON NULL,
    `webhookSigningSecret` VARCHAR(191) NULL,
    `credentialsEncrypted` TEXT NULL,
    `webhookSecretEncrypted` TEXT NULL,
    `publicMetadata` JSON NULL,
    `lastValidatedAt` DATETIME(3) NULL,
    `lastValidationStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DistributionProviderConfiguration_provider_idx`(`provider`),
    UNIQUE INDEX `DistributionProviderConfiguration_organizationId_provider_key`(`organizationId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionProviderCapability` (
    `id` VARCHAR(191) NOT NULL,
    `configurationId` VARCHAR(191) NOT NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `capability` ENUM('CREATE_RELEASE', 'UPDATE_RELEASE', 'TAKEDOWN', 'STATUS_SYNC', 'WEBHOOKS', 'ROYALTY_REPORTS', 'AUTO_ISRC', 'AUTO_UPC', 'CONTENT_ID', 'DOLBY_ATMOS', 'PRESAVE') NOT NULL,
    `isEnabled` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DistributionProviderCapability_provider_capability_idx`(`provider`, `capability`),
    UNIQUE INDEX `DistributionProviderCapability_configurationId_capability_key`(`configurationId`, `capability`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AuditLog` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NULL,
    `action` VARCHAR(191) NOT NULL,
    `entityType` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AuditLog_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `AuditLog_actorUserId_createdAt_idx`(`actorUserId`, `createdAt`),
    INDEX `AuditLog_entityType_entityId_idx`(`entityType`, `entityId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExchangeRate` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `effectiveDate` DATETIME(3) NOT NULL,
    `baseCurrency` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `quoteCurrency` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `rate` DECIMAL(18, 8) NOT NULL,
    `source` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ExchangeRate_effectiveDate_idx`(`effectiveDate`),
    UNIQUE INDEX `ExchangeRate_organizationId_effectiveDate_baseCurrency_quote_key`(`organizationId`, `effectiveDate`, `baseCurrency`, `quoteCurrency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RevenueImport` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `importedByUserId` VARCHAR(191) NOT NULL,
    `fileName` VARCHAR(191) NOT NULL,
    `sourceMimeType` VARCHAR(191) NOT NULL,
    `sourceFileSha256` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `reportingCurrency` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `status` ENUM('PROCESSING', 'COMPLETED', 'FAILED') NOT NULL,
    `rowCount` INTEGER NOT NULL,
    `importedRowCount` INTEGER NOT NULL,
    `rejectedRowCount` INTEGER NOT NULL,
    `failureReason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,

    INDEX `RevenueImport_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `RevenueImport_periodStart_periodEnd_idx`(`periodStart`, `periodEnd`),
    UNIQUE INDEX `RevenueImport_organizationId_sourceFileSha256_key`(`organizationId`, `sourceFileSha256`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreRevenue` (
    `id` VARCHAR(191) NOT NULL,
    `revenueImportId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `labelId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `storeName` VARCHAR(191) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `exchangeRate` DECIMAL(18, 8) NOT NULL,
    `releaseTitle` VARCHAR(191) NOT NULL,
    `trackTitle` VARCHAR(191) NOT NULL,
    `trackKey` VARCHAR(191) NOT NULL,
    `isrc` VARCHAR(191) NULL,
    `upc` VARCHAR(191) NULL,
    `streamCount` INTEGER NOT NULL DEFAULT 0,
    `downloadCount` INTEGER NOT NULL DEFAULT 0,
    `playlistAppearances` INTEGER NOT NULL DEFAULT 0,
    `grossRevenueMinor` BIGINT NOT NULL,
    `platformFeeMinor` BIGINT NOT NULL,
    `netRevenueMinor` BIGINT NOT NULL,
    `externalTransactionId` VARCHAR(191) NULL,
    `dedupeKey` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `StoreRevenue_dedupeKey_key`(`dedupeKey`),
    INDEX `StoreRevenue_organizationId_reportDate_idx`(`organizationId`, `reportDate`),
    INDEX `StoreRevenue_labelId_idx`(`labelId`),
    INDEX `StoreRevenue_artistId_idx`(`artistId`),
    INDEX `StoreRevenue_trackKey_idx`(`trackKey`),
    INDEX `StoreRevenue_platformName_countryCode_idx`(`platformName`, `countryCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlatformRevenue` (
    `id` VARCHAR(191) NOT NULL,
    `revenueImportId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `reportDate` DATETIME(3) NOT NULL,
    `platformName` VARCHAR(191) NOT NULL,
    `storeName` VARCHAR(191) NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `totalStreams` INTEGER NOT NULL DEFAULT 0,
    `totalDownloads` INTEGER NOT NULL DEFAULT 0,
    `grossRevenueMinor` BIGINT NOT NULL,
    `netRevenueMinor` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlatformRevenue_organizationId_reportDate_idx`(`organizationId`, `reportDate`),
    INDEX `PlatformRevenue_platformName_idx`(`platformName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RevenueReport` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `generatedByUserId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `reportingCurrency` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `totalStreams` INTEGER NOT NULL DEFAULT 0,
    `totalDownloads` INTEGER NOT NULL DEFAULT 0,
    `grossRevenueMinor` BIGINT NOT NULL,
    `platformFeeMinor` BIGINT NOT NULL,
    `netRevenueMinor` BIGINT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RevenueReport_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    UNIQUE INDEX `RevenueReport_organizationId_periodStart_periodEnd_reporting_key`(`organizationId`, `periodStart`, `periodEnd`, `reportingCurrency`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoyaltySplit` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `beneficiaryUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `trackKey` VARCHAR(191) NOT NULL,
    `trackTitle` VARCHAR(191) NOT NULL,
    `releaseTitle` VARCHAR(191) NULL,
    `role` ENUM('LABEL', 'ARTIST', 'PRODUCER', 'COMPOSER', 'LYRICIST', 'MANAGER') NOT NULL,
    `participantName` VARCHAR(191) NOT NULL,
    `percentageBps` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoyaltySplit_organizationId_trackKey_idx`(`organizationId`, `trackKey`),
    INDEX `RoyaltySplit_artistId_idx`(`artistId`),
    INDEX `RoyaltySplit_labelId_idx`(`labelId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoyaltyReport` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `generatedByUserId` VARCHAR(191) NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `reportingCurrency` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `status` ENUM('FINALIZED') NOT NULL,
    `grossRevenueMinor` BIGINT NOT NULL,
    `platformFeeMinor` BIGINT NOT NULL,
    `commissionMinor` BIGINT NOT NULL,
    `netRevenueMinor` BIGINT NOT NULL,
    `immutableAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoyaltyReport_organizationId_periodStart_periodEnd_idx`(`organizationId`, `periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoyaltyLine` (
    `id` VARCHAR(191) NOT NULL,
    `royaltyReportId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `subjectType` ENUM('ARTIST', 'LABEL') NOT NULL,
    `beneficiaryUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `sourceStoreRevenueId` VARCHAR(191) NULL,
    `participantName` VARCHAR(191) NOT NULL,
    `splitRole` ENUM('LABEL', 'ARTIST', 'PRODUCER', 'COMPOSER', 'LYRICIST', 'MANAGER') NOT NULL,
    `platformName` VARCHAR(191) NOT NULL,
    `storeName` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `trackKey` VARCHAR(191) NOT NULL,
    `trackTitle` VARCHAR(191) NOT NULL,
    `releaseTitle` VARCHAR(191) NOT NULL,
    `grossRevenueMinor` BIGINT NOT NULL,
    `platformFeeMinor` BIGINT NOT NULL,
    `commissionMinor` BIGINT NOT NULL,
    `distributableMinor` BIGINT NOT NULL,
    `beneficiaryAmountMinor` BIGINT NOT NULL,
    `shareBps` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoyaltyLine_royaltyReportId_idx`(`royaltyReportId`),
    INDEX `RoyaltyLine_organizationId_subjectType_idx`(`organizationId`, `subjectType`),
    INDEX `RoyaltyLine_beneficiaryUserId_idx`(`beneficiaryUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialAdjustment` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NOT NULL,
    `subjectType` ENUM('ARTIST', 'LABEL') NOT NULL,
    `beneficiaryUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `statementId` VARCHAR(191) NULL,
    `direction` ENUM('CREDIT', 'DEBIT') NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `reason` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinancialAdjustment_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `FinancialAdjustment_statementId_idx`(`statementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FinancialStatement` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `royaltyReportId` VARCHAR(191) NULL,
    `subjectType` ENUM('ARTIST', 'LABEL') NOT NULL,
    `beneficiaryUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `openingBalanceMinor` BIGINT NOT NULL,
    `totalRevenueMinor` BIGINT NOT NULL,
    `adjustmentsMinor` BIGINT NOT NULL,
    `withdrawalsMinor` BIGINT NOT NULL,
    `closingBalanceMinor` BIGINT NOT NULL,
    `status` ENUM('OPEN', 'LOCKED') NOT NULL,
    `generatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `FinancialStatement_organizationId_periodStart_periodEnd_idx`(`organizationId`, `periodStart`, `periodEnd`),
    INDEX `FinancialStatement_beneficiaryUserId_idx`(`beneficiaryUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PayoutMethod` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `type` ENUM('PAYONEER', 'WISE', 'IBAN', 'STRIPE_CONNECT') NOT NULL,
    `accountHolderName` VARCHAR(191) NOT NULL,
    `bankName` VARCHAR(191) NULL,
    `iban` VARCHAR(191) NULL,
    `payoneerEmail` VARCHAR(191) NULL,
    `wiseRecipientId` VARCHAR(191) NULL,
    `stripeConnectAccountId` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PayoutMethod_organizationId_idx`(`organizationId`),
    INDEX `PayoutMethod_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payout` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requestedByUserId` VARCHAR(191) NOT NULL,
    `approvedByUserId` VARCHAR(191) NULL,
    `statementId` VARCHAR(191) NOT NULL,
    `payoutMethodId` VARCHAR(191) NOT NULL,
    `subjectType` ENUM('ARTIST', 'LABEL') NOT NULL,
    `beneficiaryUserId` VARCHAR(191) NULL,
    `artistId` VARCHAR(191) NULL,
    `labelId` VARCHAR(191) NULL,
    `amountMinor` BIGINT NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'PROCESSING', 'PAID', 'FAILED', 'CANCELLED') NOT NULL,
    `failureReason` VARCHAR(191) NULL,
    `externalReference` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `requestedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `approvedAt` DATETIME(3) NULL,
    `processingAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Payout_idempotencyKey_key`(`idempotencyKey`),
    INDEX `Payout_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `Payout_statementId_idx`(`statementId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionJob` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `providerConfigurationId` VARCHAR(191) NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `status` ENUM('PENDING', 'VALIDATING', 'QUEUED', 'PROCESSING', 'WAITING_PROVIDER', 'RETRY_SCHEDULED', 'SUCCEEDED', 'PARTIALLY_SUCCEEDED', 'FAILED', 'CANCELLED', 'MANUAL_REVIEW') NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `releaseVersion` INTEGER NOT NULL DEFAULT 1,
    `releaseTitle` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `payloadHash` VARCHAR(191) NOT NULL,
    `canonicalPayload` JSON NOT NULL,
    `validationIssues` JSON NULL,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxRetryCount` INTEGER NOT NULL DEFAULT 3,
    `nextAttemptAt` DATETIME(3) NULL,
    `lastAttemptAt` DATETIME(3) NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `lastErrorCode` VARCHAR(191) NULL,
    `lastErrorMessage` VARCHAR(191) NULL,
    `queuedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DistributionJob_idempotencyKey_key`(`idempotencyKey`),
    INDEX `DistributionJob_organizationId_status_nextAttemptAt_idx`(`organizationId`, `status`, `nextAttemptAt`),
    INDEX `DistributionJob_provider_status_nextAttemptAt_idx`(`provider`, `status`, `nextAttemptAt`),
    UNIQUE INDEX `DistributionJob_organizationId_releaseId_provider_releaseVer_key`(`organizationId`, `releaseId`, `provider`, `releaseVersion`, `payloadHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `attemptNumber` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'VALIDATING', 'QUEUED', 'PROCESSING', 'WAITING_PROVIDER', 'RETRY_SCHEDULED', 'SUCCEEDED', 'PARTIALLY_SUCCEEDED', 'FAILED', 'CANCELLED', 'MANUAL_REVIEW') NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `retryable` BOOLEAN NOT NULL DEFAULT false,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DistributionAttempt_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    UNIQUE INDEX `DistributionAttempt_jobId_attemptNumber_key`(`jobId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `providerConfigurationId` VARCHAR(191) NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `releaseVersion` INTEGER NOT NULL DEFAULT 1,
    `status` ENUM('NOT_SENT', 'QUEUED', 'SUBMITTED', 'ACCEPTED', 'PROCESSING', 'DELIVERED', 'LIVE', 'REJECTED', 'FAILED', 'TAKEDOWN_PENDING', 'TAKEN_DOWN') NOT NULL DEFAULT 'NOT_SENT',
    `externalReleaseId` VARCHAR(191) NULL,
    `externalReleaseUrl` VARCHAR(191) NULL,
    `lastSyncedAt` DATETIME(3) NULL,
    `submittedAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `liveAt` DATETIME(3) NULL,
    `rejectedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `takenDownAt` DATETIME(3) NULL,
    `failureReason` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ReleaseDelivery_organizationId_status_updatedAt_idx`(`organizationId`, `status`, `updatedAt`),
    INDEX `ReleaseDelivery_provider_externalReleaseId_idx`(`provider`, `externalReleaseId`),
    UNIQUE INDEX `ReleaseDelivery_organizationId_releaseId_provider_key`(`organizationId`, `releaseId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `StoreDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `releaseDeliveryId` VARCHAR(191) NOT NULL,
    `storeCode` VARCHAR(191) NOT NULL,
    `territoryCode` VARCHAR(191) NULL,
    `status` ENUM('NOT_SENT', 'QUEUED', 'SUBMITTED', 'ACCEPTED', 'PROCESSING', 'DELIVERED', 'LIVE', 'REJECTED', 'FAILED', 'TAKEDOWN_PENDING', 'TAKEN_DOWN') NOT NULL DEFAULT 'NOT_SENT',
    `externalStoreReference` VARCHAR(191) NULL,
    `liveUrl` VARCHAR(191) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `liveAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `StoreDelivery_status_updatedAt_idx`(`status`, `updatedAt`),
    UNIQUE INDEX `StoreDelivery_releaseDeliveryId_storeCode_territoryCode_key`(`releaseDeliveryId`, `storeCode`, `territoryCode`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderWebhookEvent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `providerConfigurationId` VARCHAR(191) NULL,
    `releaseDeliveryId` VARCHAR(191) NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `externalEventId` VARCHAR(191) NOT NULL,
    `processingStatus` ENUM('PENDING', 'PROCESSED', 'FAILED', 'DUPLICATE', 'INVALID_SIGNATURE') NOT NULL DEFAULT 'PENDING',
    `signatureVerified` BOOLEAN NOT NULL DEFAULT false,
    `payload` JSON NOT NULL,
    `headers` JSON NULL,
    `normalizedPayload` JSON NULL,
    `errorMessage` VARCHAR(191) NULL,
    `receivedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `processedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderWebhookEvent_organizationId_processingStatus_receive_idx`(`organizationId`, `processingStatus`, `receivedAt`),
    UNIQUE INDEX `ProviderWebhookEvent_provider_externalEventId_key`(`provider`, `externalEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderExternalReference` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `referenceType` VARCHAR(191) NOT NULL,
    `externalId` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderExternalReference_organizationId_releaseId_provider_idx`(`organizationId`, `releaseId`, `provider`),
    UNIQUE INDEX `ProviderExternalReference_provider_externalId_key`(`provider`, `externalId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DistributionStatusHistory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `releaseDeliveryId` VARCHAR(191) NULL,
    `storeDeliveryId` VARCHAR(191) NULL,
    `previousStatus` VARCHAR(191) NULL,
    `status` VARCHAR(191) NOT NULL,
    `message` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `DistributionStatusHistory_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `DistributionStatusHistory_jobId_createdAt_idx`(`jobId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderHealthCheck` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `providerConfigurationId` VARCHAR(191) NULL,
    `provider` ENUM('ONE_RPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'INTERNAL') NOT NULL,
    `environment` ENUM('SANDBOX', 'PRODUCTION') NOT NULL,
    `success` BOOLEAN NOT NULL,
    `responseTimeMs` INTEGER NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ProviderHealthCheck_organizationId_provider_checkedAt_idx`(`organizationId`, `provider`, `checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionPlan` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `public` BOOLEAN NOT NULL DEFAULT true,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `trialDays` INTEGER NOT NULL DEFAULT 0,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionPlan_code_key`(`code`),
    INDEX `SubscriptionPlan_active_sortOrder_idx`(`active`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanPrice` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `interval` ENUM('MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL,
    `intervalCount` INTEGER NOT NULL DEFAULT 1,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `externalPriceId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlanPrice_planId_active_idx`(`planId`, `active`),
    UNIQUE INDEX `PlanPrice_planId_currencyCode_interval_intervalCount_provide_key`(`planId`, `currencyCode`, `interval`, `intervalCount`, `provider`),
    UNIQUE INDEX `PlanPrice_provider_externalPriceId_key`(`provider`, `externalPriceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlanFeature` (
    `id` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `valueType` ENUM('BOOLEAN', 'INTEGER', 'STRING', 'JSON') NOT NULL,
    `booleanValue` BOOLEAN NULL,
    `integerValue` INTEGER NULL,
    `stringValue` VARCHAR(191) NULL,
    `jsonValue` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PlanFeature_featureKey_idx`(`featureKey`),
    UNIQUE INDEX `PlanFeature_planId_featureKey_key`(`planId`, `featureKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingCustomer` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `externalCustomerId` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BillingCustomer_organizationId_isActive_idx`(`organizationId`, `isActive`),
    INDEX `BillingCustomer_userId_isActive_idx`(`userId`, `isActive`),
    UNIQUE INDEX `BillingCustomer_provider_externalCustomerId_key`(`provider`, `externalCustomerId`),
    UNIQUE INDEX `BillingCustomer_organizationId_provider_key`(`organizationId`, `provider`),
    UNIQUE INDEX `BillingCustomer_userId_provider_key`(`userId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentProviderConfig` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `displayName` VARCHAR(191) NULL,
    `credentialsEncrypted` TEXT NULL,
    `publicMetadata` JSON NULL,
    `webhookSecretEncrypted` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentProviderConfig_provider_active_idx`(`provider`, `active`),
    UNIQUE INDEX `PaymentProviderConfig_organizationId_provider_key`(`organizationId`, `provider`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Subscription` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `planId` VARCHAR(191) NOT NULL,
    `priceId` VARCHAR(191) NULL,
    `billingCustomerId` VARCHAR(191) NULL,
    `scopeKey` VARCHAR(191) NOT NULL,
    `activeScopeKey` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `status` ENUM('INCOMPLETE', 'TRIALING', 'ACTIVE', 'PAST_DUE', 'PAYMENT_FAILED', 'PAUSED', 'CANCEL_AT_PERIOD_END', 'CANCELLED', 'EXPIRED') NOT NULL,
    `billingInterval` ENUM('MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `externalSubscriptionId` VARCHAR(191) NULL,
    `externalStatus` VARCHAR(191) NULL,
    `cancelAtPeriodEnd` BOOLEAN NOT NULL DEFAULT false,
    `startedAt` DATETIME(3) NOT NULL,
    `trialStartsAt` DATETIME(3) NULL,
    `trialEndsAt` DATETIME(3) NULL,
    `currentPeriodStartsAt` DATETIME(3) NULL,
    `currentPeriodEndsAt` DATETIME(3) NULL,
    `cancelAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `endedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Subscription_activeScopeKey_key`(`activeScopeKey`),
    INDEX `Subscription_organizationId_status_idx`(`organizationId`, `status`),
    INDEX `Subscription_userId_status_idx`(`userId`, `status`),
    INDEX `Subscription_scopeKey_status_idx`(`scopeKey`, `status`),
    UNIQUE INDEX `Subscription_provider_externalSubscriptionId_key`(`provider`, `externalSubscriptionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionItem` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `planPriceId` VARCHAR(191) NOT NULL,
    `externalItemId` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `featureSnapshot` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `SubscriptionItem_externalItemId_key`(`externalItemId`),
    INDEX `SubscriptionItem_subscriptionId_active_idx`(`subscriptionId`, `active`),
    UNIQUE INDEX `SubscriptionItem_subscriptionId_planPriceId_key`(`subscriptionId`, `planPriceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `SubscriptionUsage` (
    `id` VARCHAR(191) NOT NULL,
    `subscriptionId` VARCHAR(191) NOT NULL,
    `featureKey` VARCHAR(191) NOT NULL,
    `usageCount` BIGINT NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SubscriptionUsage_featureKey_periodStart_periodEnd_idx`(`featureKey`, `periodStart`, `periodEnd`),
    UNIQUE INDEX `SubscriptionUsage_subscriptionId_featureKey_periodStart_peri_key`(`subscriptionId`, `featureKey`, `periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Invoice` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `billingCustomerId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `status` ENUM('DRAFT', 'OPEN', 'PAID', 'VOID', 'UNCOLLECTIBLE', 'REFUNDED') NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `externalInvoiceId` VARCHAR(191) NULL,
    `invoiceNumber` VARCHAR(191) NULL,
    `subtotalMinor` BIGINT NOT NULL,
    `discountMinor` BIGINT NOT NULL DEFAULT 0,
    `taxMinor` BIGINT NOT NULL DEFAULT 0,
    `totalMinor` BIGINT NOT NULL,
    `amountDueMinor` BIGINT NOT NULL,
    `amountPaidMinor` BIGINT NOT NULL DEFAULT 0,
    `hostedInvoiceUrl` VARCHAR(191) NULL,
    `pdfUrl` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `issuedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `dueAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `voidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Invoice_organizationId_status_issuedAt_idx`(`organizationId`, `status`, `issuedAt`),
    INDEX `Invoice_userId_status_issuedAt_idx`(`userId`, `status`, `issuedAt`),
    UNIQUE INDEX `Invoice_provider_externalInvoiceId_key`(`provider`, `externalInvoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceLine` (
    `id` VARCHAR(191) NOT NULL,
    `invoiceId` VARCHAR(191) NOT NULL,
    `planId` VARCHAR(191) NULL,
    `planPriceId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NOT NULL,
    `quantity` INTEGER NOT NULL DEFAULT 1,
    `unitAmountMinor` BIGINT NOT NULL,
    `subtotalMinor` BIGINT NOT NULL,
    `discountMinor` BIGINT NOT NULL DEFAULT 0,
    `taxMinor` BIGINT NOT NULL DEFAULT 0,
    `totalMinor` BIGINT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `InvoiceLine_invoiceId_idx`(`invoiceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Coupon` (
    `id` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `percentageOffBps` INTEGER NULL,
    `amountOffMinor` BIGINT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NULL,
    `duration` ENUM('ONCE', 'REPEATING', 'FOREVER') NOT NULL,
    `durationInMonths` INTEGER NULL,
    `maxRedemptions` INTEGER NULL,
    `redeemedCount` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `startsAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `planId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NULL,
    `externalCouponId` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Coupon_active_startsAt_expiresAt_idx`(`active`, `startsAt`, `expiresAt`),
    UNIQUE INDEX `Coupon_provider_externalCouponId_key`(`provider`, `externalCouponId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PromotionCode` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NULL,
    `externalPromotionCodeId` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `maxRedemptions` INTEGER NULL,
    `redeemedCount` INTEGER NOT NULL DEFAULT 0,
    `expiresAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PromotionCode_code_key`(`code`),
    INDEX `PromotionCode_code_active_idx`(`code`, `active`),
    UNIQUE INDEX `PromotionCode_provider_externalPromotionCodeId_key`(`provider`, `externalPromotionCodeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CouponRedemption` (
    `id` VARCHAR(191) NOT NULL,
    `couponId` VARCHAR(191) NOT NULL,
    `promotionCodeId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `redeemedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `CouponRedemption_couponId_redeemedAt_idx`(`couponId`, `redeemedAt`),
    INDEX `CouponRedemption_organizationId_redeemedAt_idx`(`organizationId`, `redeemedAt`),
    INDEX `CouponRedemption_userId_redeemedAt_idx`(`userId`, `redeemedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentTransaction` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `billingCustomerId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `status` ENUM('REQUIRES_ACTION', 'PENDING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `authorizedAmountMinor` BIGINT NOT NULL DEFAULT 0,
    `capturedAmountMinor` BIGINT NOT NULL DEFAULT 0,
    `refundedAmountMinor` BIGINT NOT NULL DEFAULT 0,
    `externalPaymentId` VARCHAR(191) NULL,
    `externalCheckoutId` VARCHAR(191) NULL,
    `externalInvoiceId` VARCHAR(191) NULL,
    `externalSubscriptionId` VARCHAR(191) NULL,
    `description` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `authorizedAt` DATETIME(3) NULL,
    `paidAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,

    UNIQUE INDEX `PaymentTransaction_idempotencyKey_key`(`idempotencyKey`),
    INDEX `PaymentTransaction_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `PaymentTransaction_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    INDEX `PaymentTransaction_subscriptionId_createdAt_idx`(`subscriptionId`, `createdAt`),
    UNIQUE INDEX `PaymentTransaction_provider_externalPaymentId_key`(`provider`, `externalPaymentId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PaymentAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `transactionId` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `status` ENUM('REQUIRES_ACTION', 'PENDING', 'AUTHORIZED', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED', 'PARTIALLY_REFUNDED') NOT NULL,
    `externalAttemptId` VARCHAR(191) NULL,
    `failureCode` VARCHAR(191) NULL,
    `failureMessage` VARCHAR(191) NULL,
    `requestPayload` JSON NULL,
    `responsePayload` JSON NULL,
    `attemptedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PaymentAttempt_transactionId_attemptedAt_idx`(`transactionId`, `attemptedAt`),
    UNIQUE INDEX `PaymentAttempt_provider_externalAttemptId_key`(`provider`, `externalAttemptId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Refund` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `paymentTransactionId` VARCHAR(191) NOT NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `status` ENUM('PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED') NOT NULL,
    `amountMinor` BIGINT NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `externalRefundId` VARCHAR(191) NULL,
    `reason` VARCHAR(191) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,

    INDEX `Refund_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `Refund_userId_createdAt_idx`(`userId`, `createdAt`),
    UNIQUE INDEX `Refund_provider_externalRefundId_key`(`provider`, `externalRefundId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `TaxRate` (
    `id` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `percentageBps` INTEGER NOT NULL,
    `inclusive` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TaxRate_code_key`(`code`),
    INDEX `TaxRate_countryCode_active_idx`(`countryCode`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingAddress` (
    `id` VARCHAR(191) NOT NULL,
    `billingCustomerId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `fullName` VARCHAR(191) NOT NULL,
    `companyName` VARCHAR(191) NULL,
    `line1` VARCHAR(191) NOT NULL,
    `line2` VARCHAR(191) NULL,
    `city` VARCHAR(191) NOT NULL,
    `state` VARCHAR(191) NULL,
    `postalCode` VARCHAR(191) NOT NULL,
    `countryCode` VARCHAR(191) NOT NULL,
    `taxId` VARCHAR(191) NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BillingAddress_organizationId_isDefault_idx`(`organizationId`, `isDefault`),
    INDEX `BillingAddress_userId_isDefault_idx`(`userId`, `isDefault`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BillingEvent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `billingCustomerId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `paymentTransactionId` VARCHAR(191) NULL,
    `provider` ENUM('STRIPE', 'IYZICO', 'PAYTR', 'MANUAL_BANK_TRANSFER') NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `normalizedType` VARCHAR(191) NULL,
    `externalEventId` VARCHAR(191) NOT NULL,
    `processingStatus` ENUM('PENDING', 'PROCESSED', 'FAILED', 'IGNORED') NOT NULL DEFAULT 'PENDING',
    `payload` JSON NOT NULL,
    `errorMessage` VARCHAR(191) NULL,
    `occurredAt` DATETIME(3) NOT NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BillingEvent_organizationId_processingStatus_occurredAt_idx`(`organizationId`, `processingStatus`, `occurredAt`),
    INDEX `BillingEvent_userId_processingStatus_occurredAt_idx`(`userId`, `processingStatus`, `occurredAt`),
    UNIQUE INDEX `BillingEvent_provider_externalEventId_key`(`provider`, `externalEventId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ManualPaymentRequest` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `subscriptionId` VARCHAR(191) NULL,
    `invoiceId` VARCHAR(191) NULL,
    `processedByUserId` VARCHAR(191) NULL,
    `amountMinor` BIGINT NOT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NOT NULL,
    `referenceCode` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPROVED', 'REJECTED', 'CONFIRMED', 'CANCELLED') NOT NULL,
    `paymentInstructions` VARCHAR(191) NULL,
    `submittedProofUrl` VARCHAR(191) NULL,
    `notes` VARCHAR(191) NULL,
    `expiresAt` DATETIME(3) NULL,
    `processedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ManualPaymentRequest_referenceCode_key`(`referenceCode`),
    INDEX `ManualPaymentRequest_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `ManualPaymentRequest_userId_status_createdAt_idx`(`userId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Session` ADD CONSTRAINT `Session_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Account` ADD CONSTRAINT `Account_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMembership` ADD CONSTRAINT `OrganizationMembership_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrganizationMembership` ADD CONSTRAINT `OrganizationMembership_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Label` ADD CONSTRAINT `Label_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Label` ADD CONSTRAINT `Label_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Artist` ADD CONSTRAINT `Artist_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabelArtist` ADD CONSTRAINT `LabelArtist_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabelArtist` ADD CONSTRAINT `LabelArtist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Upload` ADD CONSTRAINT `Upload_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Release` ADD CONSTRAINT `Release_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Release` ADD CONSTRAINT `Release_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Release` ADD CONSTRAINT `Release_submittedByUserId_fkey` FOREIGN KEY (`submittedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Release` ADD CONSTRAINT `Release_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Track` ADD CONSTRAINT `Track_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Track` ADD CONSTRAINT `Track_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseArtist` ADD CONSTRAINT `ReleaseArtist_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseArtist` ADD CONSTRAINT `ReleaseArtist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackArtist` ADD CONSTRAINT `TrackArtist_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackArtist` ADD CONSTRAINT `TrackArtist_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Contributor` ADD CONSTRAINT `Contributor_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackContributor` ADD CONSTRAINT `TrackContributor_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `TrackContributor` ADD CONSTRAINT `TrackContributor_contributorId_fkey` FOREIGN KEY (`contributorId`) REFERENCES `Contributor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionSelection` ADD CONSTRAINT `DistributionSelection_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseStore` ADD CONSTRAINT `ReleaseStore_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseTerritory` ADD CONSTRAINT `ReleaseTerritory_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseValidationIssue` ADD CONSTRAINT `ReleaseValidationIssue_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseValidationIssue` ADD CONSTRAINT `ReleaseValidationIssue_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseValidationIssue` ADD CONSTRAINT `ReleaseValidationIssue_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseStatusHistory` ADD CONSTRAINT `ReleaseStatusHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseStatusHistory` ADD CONSTRAINT `ReleaseStatusHistory_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionProviderConfiguration` ADD CONSTRAINT `DistributionProviderConfiguration_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionProviderCapability` ADD CONSTRAINT `DistributionProviderCapability_configurationId_fkey` FOREIGN KEY (`configurationId`) REFERENCES `DistributionProviderConfiguration`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AuditLog` ADD CONSTRAINT `AuditLog_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExchangeRate` ADD CONSTRAINT `ExchangeRate_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevenueImport` ADD CONSTRAINT `RevenueImport_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevenueImport` ADD CONSTRAINT `RevenueImport_importedByUserId_fkey` FOREIGN KEY (`importedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreRevenue` ADD CONSTRAINT `StoreRevenue_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreRevenue` ADD CONSTRAINT `StoreRevenue_revenueImportId_fkey` FOREIGN KEY (`revenueImportId`) REFERENCES `RevenueImport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreRevenue` ADD CONSTRAINT `StoreRevenue_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreRevenue` ADD CONSTRAINT `StoreRevenue_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformRevenue` ADD CONSTRAINT `PlatformRevenue_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlatformRevenue` ADD CONSTRAINT `PlatformRevenue_revenueImportId_fkey` FOREIGN KEY (`revenueImportId`) REFERENCES `RevenueImport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevenueReport` ADD CONSTRAINT `RevenueReport_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RevenueReport` ADD CONSTRAINT `RevenueReport_generatedByUserId_fkey` FOREIGN KEY (`generatedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltySplit` ADD CONSTRAINT `RoyaltySplit_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltySplit` ADD CONSTRAINT `RoyaltySplit_beneficiaryUserId_fkey` FOREIGN KEY (`beneficiaryUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltySplit` ADD CONSTRAINT `RoyaltySplit_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltySplit` ADD CONSTRAINT `RoyaltySplit_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyReport` ADD CONSTRAINT `RoyaltyReport_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyReport` ADD CONSTRAINT `RoyaltyReport_generatedByUserId_fkey` FOREIGN KEY (`generatedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_royaltyReportId_fkey` FOREIGN KEY (`royaltyReportId`) REFERENCES `RoyaltyReport`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_beneficiaryUserId_fkey` FOREIGN KEY (`beneficiaryUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RoyaltyLine` ADD CONSTRAINT `RoyaltyLine_sourceStoreRevenueId_fkey` FOREIGN KEY (`sourceStoreRevenueId`) REFERENCES `StoreRevenue`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_beneficiaryUserId_fkey` FOREIGN KEY (`beneficiaryUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialAdjustment` ADD CONSTRAINT `FinancialAdjustment_statementId_fkey` FOREIGN KEY (`statementId`) REFERENCES `FinancialStatement`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialStatement` ADD CONSTRAINT `FinancialStatement_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialStatement` ADD CONSTRAINT `FinancialStatement_royaltyReportId_fkey` FOREIGN KEY (`royaltyReportId`) REFERENCES `RoyaltyReport`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialStatement` ADD CONSTRAINT `FinancialStatement_beneficiaryUserId_fkey` FOREIGN KEY (`beneficiaryUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialStatement` ADD CONSTRAINT `FinancialStatement_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `FinancialStatement` ADD CONSTRAINT `FinancialStatement_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutMethod` ADD CONSTRAINT `PayoutMethod_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutMethod` ADD CONSTRAINT `PayoutMethod_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutMethod` ADD CONSTRAINT `PayoutMethod_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PayoutMethod` ADD CONSTRAINT `PayoutMethod_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_approvedByUserId_fkey` FOREIGN KEY (`approvedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_statementId_fkey` FOREIGN KEY (`statementId`) REFERENCES `FinancialStatement`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_payoutMethodId_fkey` FOREIGN KEY (`payoutMethodId`) REFERENCES `PayoutMethod`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_beneficiaryUserId_fkey` FOREIGN KEY (`beneficiaryUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_artistId_fkey` FOREIGN KEY (`artistId`) REFERENCES `Artist`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Payout` ADD CONSTRAINT `Payout_labelId_fkey` FOREIGN KEY (`labelId`) REFERENCES `Label`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionJob` ADD CONSTRAINT `DistributionJob_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionJob` ADD CONSTRAINT `DistributionJob_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionJob` ADD CONSTRAINT `DistributionJob_providerConfigurationId_fkey` FOREIGN KEY (`providerConfigurationId`) REFERENCES `DistributionProviderConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionAttempt` ADD CONSTRAINT `DistributionAttempt_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionAttempt` ADD CONSTRAINT `DistributionAttempt_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `DistributionJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseDelivery` ADD CONSTRAINT `ReleaseDelivery_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseDelivery` ADD CONSTRAINT `ReleaseDelivery_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `DistributionJob`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseDelivery` ADD CONSTRAINT `ReleaseDelivery_providerConfigurationId_fkey` FOREIGN KEY (`providerConfigurationId`) REFERENCES `DistributionProviderConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `StoreDelivery` ADD CONSTRAINT `StoreDelivery_releaseDeliveryId_fkey` FOREIGN KEY (`releaseDeliveryId`) REFERENCES `ReleaseDelivery`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderWebhookEvent` ADD CONSTRAINT `ProviderWebhookEvent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderWebhookEvent` ADD CONSTRAINT `ProviderWebhookEvent_providerConfigurationId_fkey` FOREIGN KEY (`providerConfigurationId`) REFERENCES `DistributionProviderConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderWebhookEvent` ADD CONSTRAINT `ProviderWebhookEvent_releaseDeliveryId_fkey` FOREIGN KEY (`releaseDeliveryId`) REFERENCES `ReleaseDelivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderExternalReference` ADD CONSTRAINT `ProviderExternalReference_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionStatusHistory` ADD CONSTRAINT `DistributionStatusHistory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionStatusHistory` ADD CONSTRAINT `DistributionStatusHistory_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `DistributionJob`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionStatusHistory` ADD CONSTRAINT `DistributionStatusHistory_releaseDeliveryId_fkey` FOREIGN KEY (`releaseDeliveryId`) REFERENCES `ReleaseDelivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DistributionStatusHistory` ADD CONSTRAINT `DistributionStatusHistory_storeDeliveryId_fkey` FOREIGN KEY (`storeDeliveryId`) REFERENCES `StoreDelivery`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderHealthCheck` ADD CONSTRAINT `ProviderHealthCheck_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderHealthCheck` ADD CONSTRAINT `ProviderHealthCheck_providerConfigurationId_fkey` FOREIGN KEY (`providerConfigurationId`) REFERENCES `DistributionProviderConfiguration`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanPrice` ADD CONSTRAINT `PlanPrice_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlanFeature` ADD CONSTRAINT `PlanFeature_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingCustomer` ADD CONSTRAINT `BillingCustomer_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingCustomer` ADD CONSTRAINT `BillingCustomer_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentProviderConfig` ADD CONSTRAINT `PaymentProviderConfig_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_priceId_fkey` FOREIGN KEY (`priceId`) REFERENCES `PlanPrice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Subscription` ADD CONSTRAINT `Subscription_billingCustomerId_fkey` FOREIGN KEY (`billingCustomerId`) REFERENCES `BillingCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubscriptionItem` ADD CONSTRAINT `SubscriptionItem_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubscriptionItem` ADD CONSTRAINT `SubscriptionItem_planPriceId_fkey` FOREIGN KEY (`planPriceId`) REFERENCES `PlanPrice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `SubscriptionUsage` ADD CONSTRAINT `SubscriptionUsage_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Invoice` ADD CONSTRAINT `Invoice_billingCustomerId_fkey` FOREIGN KEY (`billingCustomerId`) REFERENCES `BillingCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `InvoiceLine_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `InvoiceLine_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `InvoiceLine` ADD CONSTRAINT `InvoiceLine_planPriceId_fkey` FOREIGN KEY (`planPriceId`) REFERENCES `PlanPrice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Coupon` ADD CONSTRAINT `Coupon_planId_fkey` FOREIGN KEY (`planId`) REFERENCES `SubscriptionPlan`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PromotionCode` ADD CONSTRAINT `PromotionCode_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_couponId_fkey` FOREIGN KEY (`couponId`) REFERENCES `Coupon`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_promotionCodeId_fkey` FOREIGN KEY (`promotionCodeId`) REFERENCES `PromotionCode`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CouponRedemption` ADD CONSTRAINT `CouponRedemption_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_billingCustomerId_fkey` FOREIGN KEY (`billingCustomerId`) REFERENCES `BillingCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentTransaction` ADD CONSTRAINT `PaymentTransaction_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PaymentAttempt` ADD CONSTRAINT `PaymentAttempt_transactionId_fkey` FOREIGN KEY (`transactionId`) REFERENCES `PaymentTransaction`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Refund` ADD CONSTRAINT `Refund_paymentTransactionId_fkey` FOREIGN KEY (`paymentTransactionId`) REFERENCES `PaymentTransaction`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_billingCustomerId_fkey` FOREIGN KEY (`billingCustomerId`) REFERENCES `BillingCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingAddress` ADD CONSTRAINT `BillingAddress_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_billingCustomerId_fkey` FOREIGN KEY (`billingCustomerId`) REFERENCES `BillingCustomer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `BillingEvent` ADD CONSTRAINT `BillingEvent_paymentTransactionId_fkey` FOREIGN KEY (`paymentTransactionId`) REFERENCES `PaymentTransaction`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPaymentRequest` ADD CONSTRAINT `ManualPaymentRequest_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPaymentRequest` ADD CONSTRAINT `ManualPaymentRequest_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPaymentRequest` ADD CONSTRAINT `ManualPaymentRequest_subscriptionId_fkey` FOREIGN KEY (`subscriptionId`) REFERENCES `Subscription`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPaymentRequest` ADD CONSTRAINT `ManualPaymentRequest_invoiceId_fkey` FOREIGN KEY (`invoiceId`) REFERENCES `Invoice`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ManualPaymentRequest` ADD CONSTRAINT `ManualPaymentRequest_processedByUserId_fkey` FOREIGN KEY (`processedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
