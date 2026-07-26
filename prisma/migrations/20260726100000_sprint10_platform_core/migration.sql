-- Sprint 10 platform core incremental migration.
ALTER TABLE Organization ADD COLUMN `legalName` VARCHAR(191) NULL;
ALTER TABLE Organization ADD COLUMN `tenantStatus` ENUM('PENDING_SETUP', 'ACTIVE', 'SUSPENDED', 'MAINTENANCE', 'CANCELLED', 'ARCHIVED') NOT NULL DEFAULT 'PENDING_SETUP';
ALTER TABLE Organization ADD COLUMN `tenantMode` ENUM('SINGLE_TENANT', 'MULTI_TENANT', 'WHITE_LABEL', 'PLATFORM_OWNER') NOT NULL DEFAULT 'SINGLE_TENANT';
ALTER TABLE Organization ADD COLUMN `tenantPlan` ENUM('COMMUNITY', 'STARTER', 'PROFESSIONAL', 'ENTERPRISE', 'SELF_HOSTED') NOT NULL DEFAULT 'COMMUNITY';
ALTER TABLE Organization ADD COLUMN `primaryDomain` VARCHAR(191) NULL;
ALTER TABLE Organization ADD COLUMN `defaultLocale` VARCHAR(191) NOT NULL DEFAULT 'tr-TR';
ALTER TABLE Organization ADD COLUMN `defaultCurrency` VARCHAR(191) NOT NULL DEFAULT 'TRY';
ALTER TABLE Organization ADD COLUMN `defaultTimezone` VARCHAR(191) NOT NULL DEFAULT 'Europe/Istanbul';
ALTER TABLE Organization ADD COLUMN `ownerUserId` VARCHAR(191) NULL;
ALTER TABLE Organization ADD COLUMN `onboardingCompletedAt` DATETIME(3) NULL;
CREATE INDEX `Organization_tenantStatus_idx` ON `Organization`(`tenantStatus`);
CREATE INDEX `Organization_primaryDomain_idx` ON `Organization`(`primaryDomain`);
CREATE INDEX `Organization_ownerUserId_idx` ON `Organization`(`ownerUserId`);
ALTER TABLE OrganizationMembership ADD COLUMN `tenantRole` ENUM('OWNER', 'ADMIN', 'CONTENT_MANAGER', 'DISTRIBUTION_MANAGER', 'FINANCE_MANAGER', 'MODERATOR', 'SUPPORT', 'VIEWER') NOT NULL DEFAULT 'VIEWER';
ALTER TABLE OrganizationMembership ADD COLUMN `permissions` JSON NULL;
ALTER TABLE OrganizationMembership ADD COLUMN `status` ENUM('INVITED', 'ACTIVE', 'SUSPENDED', 'REMOVED') NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE OrganizationMembership ADD COLUMN `invitedAt` DATETIME(3) NULL;
ALTER TABLE OrganizationMembership ADD COLUMN `joinedAt` DATETIME(3) NULL;
ALTER TABLE `Organization` ADD CONSTRAINT `Organization_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
CREATE TABLE `TenantBranding` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `brandName` VARCHAR(191) NOT NULL,
    `legalName` VARCHAR(191) NULL,
    `logoUrl` VARCHAR(191) NULL,
    `faviconUrl` VARCHAR(191) NULL,
    `supportEmail` VARCHAR(191) NULL,
    `primaryDomain` VARCHAR(191) NULL,
    `socialLinks` JSON NULL,
    `seoDefaults` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenantBranding_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ThemeConfig` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `primaryColor` VARCHAR(191) NOT NULL DEFAULT '#E5484D',
    `secondaryColor` VARCHAR(191) NOT NULL DEFAULT '#1B1B1F',
    `accentColor` VARCHAR(191) NOT NULL DEFAULT '#F4B942',
    `backgroundColor` VARCHAR(191) NOT NULL DEFAULT '#0B0B0F',
    `cardColor` VARCHAR(191) NOT NULL DEFAULT '#15151C',
    `textColor` VARCHAR(191) NOT NULL DEFAULT '#F7F7F8',
    `mutedTextColor` VARCHAR(191) NOT NULL DEFAULT '#A1A1AA',
    `borderColor` VARCHAR(191) NOT NULL DEFAULT '#2A2A34',
    `successColor` VARCHAR(191) NOT NULL DEFAULT '#2DBA7C',
    `warningColor` VARCHAR(191) NOT NULL DEFAULT '#F4B942',
    `errorColor` VARCHAR(191) NOT NULL DEFAULT '#E5484D',
    `buttonBackground` VARCHAR(191) NOT NULL DEFAULT '#E5484D',
    `buttonText` VARCHAR(191) NOT NULL DEFAULT '#FFFFFF',
    `linkColor` VARCHAR(191) NOT NULL DEFAULT '#78A9FF',
    `sidebarColor` VARCHAR(191) NOT NULL DEFAULT '#101014',
    `headerColor` VARCHAR(191) NOT NULL DEFAULT '#101014',
    `playerColor` VARCHAR(191) NOT NULL DEFAULT '#111118',
    `discoverColor` VARCHAR(191) NOT NULL DEFAULT '#101014',
    `rankingColor` VARCHAR(191) NOT NULL DEFAULT '#15151C',
    `popupColor` VARCHAR(191) NOT NULL DEFAULT '#15151C',
    `borderRadius` INTEGER NOT NULL DEFAULT 16,
    `shadowIntensity` INTEGER NOT NULL DEFAULT 30,
    `fontFamily` VARCHAR(191) NOT NULL DEFAULT 'Geist',
    `containerWidth` VARCHAR(191) NOT NULL DEFAULT '1200px',
    `density` ENUM('COMPACT', 'COMFORTABLE', 'SPACIOUS') NOT NULL DEFAULT 'COMFORTABLE',
    `colorScheme` ENUM('LIGHT', 'DARK', 'SYSTEM') NOT NULL DEFAULT 'SYSTEM',
    `gradientsEnabled` BOOLEAN NOT NULL DEFAULT false,
    `customVariables` JSON NULL,
    `draft` BOOLEAN NOT NULL DEFAULT true,
    `publishedAt` DATETIME(3) NULL,
    `updatedByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ThemeConfig_organizationId_key`(`organizationId`),
    INDEX `ThemeConfig_organizationId_draft_idx`(`organizationId`, `draft`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ThemeVersion` (
    `id` VARCHAR(191) NOT NULL,
    `themeConfigId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` JSON NOT NULL,
    `publishedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ThemeVersion_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    UNIQUE INDEX `ThemeVersion_themeConfigId_version_key`(`themeConfigId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `TenantDomain` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `domain` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'VERIFYING', 'VERIFIED', 'ACTIVE', 'FAILED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    `verificationToken` VARCHAR(191) NOT NULL,
    `verificationMethod` VARCHAR(191) NOT NULL DEFAULT 'DNS_TXT',
    `sslStatus` ENUM('NOT_CONFIGURED', 'PENDING', 'ACTIVE', 'FAILED') NOT NULL DEFAULT 'NOT_CONFIGURED',
    `verifiedAt` DATETIME(3) NULL,
    `activatedAt` DATETIME(3) NULL,
    `lastCheckedAt` DATETIME(3) NULL,
    `lastError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `TenantDomain_verificationToken_key`(`verificationToken`),
    INDEX `TenantDomain_domain_status_idx`(`domain`, `status`),
    INDEX `TenantDomain_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `TenantDomain_organizationId_domain_key`(`organizationId`, `domain`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `SitePage` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `kind` ENUM('HOMEPAGE', 'DISCOVER', 'CUSTOM') NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `publishedVersion` INTEGER NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SitePage_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `SitePage_organizationId_kind_slug_key`(`organizationId`, `kind`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `SitePageVersion` (
    `id` VARCHAR(191) NOT NULL,
    `sitePageId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `snapshot` JSON NOT NULL,
    `publishedById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SitePageVersion_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    UNIQUE INDEX `SitePageVersion_sitePageId_version_key`(`sitePageId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `SiteSection` (
    `id` VARCHAR(191) NOT NULL,
    `sitePageId` VARCHAR(191) NOT NULL,
    `sectionType` VARCHAR(191) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `title` VARCHAR(191) NULL,
    `subtitle` VARCHAR(191) NULL,
    `description` TEXT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `background` VARCHAR(191) NULL,
    `textAlign` VARCHAR(191) NOT NULL DEFAULT 'left',
    `maxItems` INTEGER NULL,
    `dataSource` ENUM('MANUAL', 'LATEST_RELEASES', 'TRENDING_RELEASES', 'GLOBAL_CHART', 'TURKEY_CHART', 'FEATURED_ARTISTS', 'FEATURED_PLAYLISTS', 'ACTIVE_CAMPAIGN', 'ACTIVE_REWARD_VOTE') NOT NULL DEFAULT 'MANUAL',
    `ctaLabel` VARCHAR(191) NULL,
    `ctaUrl` VARCHAR(191) NULL,
    `responsiveConfig` JSON NULL,
    `content` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `SiteSection_sitePageId_active_sortOrder_idx`(`sitePageId`, `active`, `sortOrder`),
    UNIQUE INDEX `SiteSection_sitePageId_sortOrder_key`(`sitePageId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `DiscoverConfig` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `enabled` BOOLEAN NOT NULL DEFAULT true,
    `swipeEnabled` BOOLEAN NOT NULL DEFAULT true,
    `gridEnabled` BOOLEAN NOT NULL DEFAULT true,
    `listEnabled` BOOLEAN NOT NULL DEFAULT true,
    `defaultView` VARCHAR(191) NOT NULL DEFAULT 'GRID',
    `cardTemplate` VARCHAR(191) NOT NULL DEFAULT 'PREMIUM',
    `backgroundColor` VARCHAR(191) NOT NULL DEFAULT '#0B0B0F',
    `cardColor` VARCHAR(191) NOT NULL DEFAULT '#15151C',
    `buttonColor` VARCHAR(191) NOT NULL DEFAULT '#E5484D',
    `playerVisible` BOOLEAN NOT NULL DEFAULT true,
    `commentsEnabled` BOOLEAN NOT NULL DEFAULT true,
    `likesEnabled` BOOLEAN NOT NULL DEFAULT true,
    `dislikesEnabled` BOOLEAN NOT NULL DEFAULT false,
    `playlistEnabled` BOOLEAN NOT NULL DEFAULT true,
    `sharingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `votingEnabled` BOOLEAN NOT NULL DEFAULT true,
    `rewardCampaignEnabled` BOOLEAN NOT NULL DEFAULT false,
    `turkeyFilterEnabled` BOOLEAN NOT NULL DEFAULT true,
    `globalFilterEnabled` BOOLEAN NOT NULL DEFAULT true,
    `filters` JSON NULL,
    `scoringWeights` JSON NULL,
    `explicitPolicy` VARCHAR(191) NOT NULL DEFAULT 'SHOW',
    `minimumReleaseAgeDays` INTEGER NOT NULL DEFAULT 0,
    `sponsorFrequency` INTEGER NOT NULL DEFAULT 0,
    `popupFrequency` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DiscoverConfig_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ApiClient` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ApiClient_organizationId_active_idx`(`organizationId`, `active`),
    INDEX `ApiClient_ownerUserId_idx`(`ownerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ApiKey` (
    `id` VARCHAR(191) NOT NULL,
    `apiClientId` VARCHAR(191) NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `prefix` VARCHAR(191) NOT NULL,
    `keyHash` VARCHAR(191) NOT NULL,
    `scopes` JSON NOT NULL,
    `rateLimitPerMinute` INTEGER NOT NULL DEFAULT 60,
    `ipAllowlist` JSON NULL,
    `domainAllowlist` JSON NULL,
    `lastUsedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `ApiKey_keyHash_key`(`keyHash`),
    INDEX `ApiKey_organizationId_revokedAt_idx`(`organizationId`, `revokedAt`),
    INDEX `ApiKey_prefix_idx`(`prefix`),
    INDEX `ApiKey_ownerUserId_idx`(`ownerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ApiUsageRecord` (
    `id` VARCHAR(191) NOT NULL,
    `apiKeyId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `responseTimeMs` INTEGER NULL,
    `idempotencyKey` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ApiUsageRecord_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `ApiUsageRecord_requestId_idx`(`requestId`),
    UNIQUE INDEX `ApiUsageRecord_apiKeyId_idempotencyKey_key`(`apiKeyId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `WebhookEndpoint` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `ownerUserId` VARCHAR(191) NOT NULL,
    `url` TEXT NOT NULL,
    `description` VARCHAR(191) NULL,
    `secretEncrypted` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `apiVersion` VARCHAR(191) NOT NULL DEFAULT 'v1',
    `headers` JSON NULL,
    `failurePolicy` ENUM('RETRY', 'DISABLE_AFTER_LIMIT', 'IGNORE') NOT NULL DEFAULT 'RETRY',
    `maxAttempts` INTEGER NOT NULL DEFAULT 8,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebhookEndpoint_organizationId_active_idx`(`organizationId`, `active`),
    INDEX `WebhookEndpoint_ownerUserId_idx`(`ownerUserId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `WebhookSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `webhookEndpointId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WebhookSubscription_eventType_idx`(`eventType`),
    UNIQUE INDEX `WebhookSubscription_webhookEndpointId_eventType_key`(`webhookEndpointId`, `eventType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `WebhookDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `webhookEndpointId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `eventType` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `payload` JSON NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'DELIVERED', 'RETRY_SCHEDULED', 'FAILED', 'DISABLED') NOT NULL DEFAULT 'PENDING',
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `nextAttemptAt` DATETIME(3) NULL,
    `responseStatusCode` INTEGER NULL,
    `responseDurationMs` INTEGER NULL,
    `lastError` TEXT NULL,
    `deliveredAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `WebhookDelivery_organizationId_status_nextAttemptAt_idx`(`organizationId`, `status`, `nextAttemptAt`),
    INDEX `WebhookDelivery_eventType_createdAt_idx`(`eventType`, `createdAt`),
    UNIQUE INDEX `WebhookDelivery_webhookEndpointId_idempotencyKey_key`(`webhookEndpointId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `OnboardingProgress` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `stepKey` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'SKIPPED') NOT NULL DEFAULT 'NOT_STARTED',
    `completedAt` DATETIME(3) NULL,
    `skippedAt` DATETIME(3) NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `OnboardingProgress_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `OnboardingProgress_organizationId_stepKey_key`(`organizationId`, `stepKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `SystemHealthCheck` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `checkKey` VARCHAR(191) NOT NULL,
    `status` ENUM('PASS', 'WARNING', 'FAIL', 'NOT_CONFIGURED') NOT NULL,
    `message` VARCHAR(191) NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `SystemHealthCheck_organizationId_status_checkedAt_idx`(`organizationId`, `status`, `checkedAt`),
    UNIQUE INDEX `SystemHealthCheck_organizationId_checkKey_key`(`organizationId`, `checkKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `License` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `licenseType` VARCHAR(191) NOT NULL,
    `licenseKeyHash` VARCHAR(191) NOT NULL,
    `domainLimit` INTEGER NULL,
    `tenantLimit` INTEGER NULL,
    `userLimit` INTEGER NULL,
    `featureLimits` JSON NULL,
    `validFrom` DATETIME(3) NULL,
    `validUntil` DATETIME(3) NULL,
    `maintenanceUntil` DATETIME(3) NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'INVALID', 'GRACE_PERIOD') NOT NULL DEFAULT 'INVALID',
    `offlineGraceDays` INTEGER NOT NULL DEFAULT 0,
    `lastValidatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `License_organizationId_key`(`organizationId`),
    UNIQUE INDEX `License_licenseKeyHash_key`(`licenseKeyHash`),
    INDEX `License_status_validUntil_idx`(`status`, `validUntil`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `LicenseValidation` (
    `id` VARCHAR(191) NOT NULL,
    `licenseId` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'EXPIRED', 'SUSPENDED', 'REVOKED', 'INVALID', 'GRACE_PERIOD') NOT NULL,
    `message` VARCHAR(191) NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `metadata` JSON NULL,

    INDEX `LicenseValidation_licenseId_checkedAt_idx`(`licenseId`, `checkedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `Chart` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `chartType` ENUM('GLOBAL', 'COUNTRY', 'TURKEY', 'GENRE', 'NEW_RELEASES', 'TRENDING', 'MOST_VOTED', 'MOST_LIKED', 'MOST_PLAYED', 'EDITORIAL', 'REWARDED_CAMPAIGN') NOT NULL,
    `period` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'ALL_TIME', 'CUSTOM') NOT NULL,
    `entityType` ENUM('TRACK', 'RELEASE', 'ARTIST', 'PLAYLIST') NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `genreSlug` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Chart_organizationId_chartType_period_idx`(`organizationId`, `chartType`, `period`),
    UNIQUE INDEX `Chart_organizationId_chartType_period_entityType_countryCode_key`(`organizationId`, `chartType`, `period`, `entityType`, `countryCode`, `genreSlug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ChartRule` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `chartId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL DEFAULT 1,
    `weights` JSON NOT NULL,
    `fraudPenalty` DECIMAL(8, 4) NOT NULL,
    `diversityWeight` DECIMAL(8, 4) NOT NULL,
    `freshnessDays` INTEGER NOT NULL DEFAULT 30,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `createdById` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChartRule_organizationId_active_idx`(`organizationId`, `active`),
    UNIQUE INDEX `ChartRule_chartId_version_key`(`chartId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ChartSnapshot` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `chartId` VARCHAR(191) NOT NULL,
    `ruleVersion` INTEGER NOT NULL,
    `periodStart` DATETIME(3) NOT NULL,
    `periodEnd` DATETIME(3) NOT NULL,
    `calculatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `immutableHash` VARCHAR(191) NOT NULL,

    INDEX `ChartSnapshot_organizationId_calculatedAt_idx`(`organizationId`, `calculatedAt`),
    UNIQUE INDEX `ChartSnapshot_chartId_periodStart_periodEnd_key`(`chartId`, `periodStart`, `periodEnd`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `ChartEntry` (
    `id` VARCHAR(191) NOT NULL,
    `snapshotId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `rank` INTEGER NOT NULL,
    `previousRank` INTEGER NULL,
    `peakRank` INTEGER NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityType` ENUM('TRACK', 'RELEASE', 'ARTIST', 'PLAYLIST') NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `score` DECIMAL(18, 6) NOT NULL,
    `validStreams` BIGINT NOT NULL DEFAULT 0,
    `uniqueListeners` BIGINT NOT NULL DEFAULT 0,
    `votes` BIGINT NOT NULL DEFAULT 0,
    `likes` BIGINT NOT NULL DEFAULT 0,
    `rewardStatus` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ChartEntry_organizationId_entityId_entityType_idx`(`organizationId`, `entityId`, `entityType`),
    INDEX `ChartEntry_countryCode_rank_idx`(`countryCode`, `rank`),
    UNIQUE INDEX `ChartEntry_snapshotId_rank_key`(`snapshotId`, `rank`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `VoteCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `entityType` ENUM('TRACK', 'RELEASE', 'ARTIST', 'PLAYLIST') NOT NULL,
    `voteType` ENUM('LIKE_VOTE', 'ONE_VOTE_PER_USER', 'DAILY_VOTE', 'WEEKLY_VOTE', 'TOKEN_BASED', 'JURY', 'HYBRID') NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `minimumAge` INTEGER NULL,
    `loginRequired` BOOLEAN NOT NULL DEFAULT true,
    `emailVerificationRequired` BOOLEAN NOT NULL DEFAULT false,
    `phoneVerificationRequired` BOOLEAN NOT NULL DEFAULT false,
    `dailyVoteLimit` INTEGER NULL,
    `totalVoteLimit` INTEGER NULL,
    `fraudProtection` BOOLEAN NOT NULL DEFAULT true,
    `rewardCampaignId` VARCHAR(191) NULL,
    `sponsorName` VARCHAR(191) NULL,
    `imageUrl` VARCHAR(191) NULL,
    `rules` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `resultsPublishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `VoteCampaign_organizationId_active_startsAt_endsAt_idx`(`organizationId`, `active`, `startsAt`, `endsAt`),
    UNIQUE INDEX `VoteCampaign_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `Vote` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `entityId` VARCHAR(191) NOT NULL,
    `entityType` ENUM('TRACK', 'RELEASE', 'ARTIST', 'PLAYLIST') NOT NULL,
    `status` ENUM('VALID', 'PENDING_REVIEW', 'INVALID', 'FRAUD_SUSPECTED', 'REVOKED') NOT NULL DEFAULT 'VALID',
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `ipHash` VARCHAR(191) NULL,
    `deviceHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Vote_organizationId_userId_campaignId_createdAt_idx`(`organizationId`, `userId`, `campaignId`, `createdAt`),
    INDEX `Vote_campaignId_entityId_status_idx`(`campaignId`, `entityId`, `status`),
    UNIQUE INDEX `Vote_campaignId_idempotencyKey_key`(`campaignId`, `idempotencyKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `VoteFraudSignal` (
    `id` VARCHAR(191) NOT NULL,
    `voteId` VARCHAR(191) NOT NULL,
    `signal` VARCHAR(191) NOT NULL,
    `score` DECIMAL(8, 4) NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `VoteFraudSignal_voteId_createdAt_idx`(`voteId`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `RewardCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'WINNER_PENDING', 'WINNER_CONFIRMED', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'DRAFT',
    `rulesSnapshot` JSON NOT NULL,
    `tiePolicy` VARCHAR(191) NOT NULL,
    `winnerCount` INTEGER NOT NULL DEFAULT 1,
    `startsAt` DATETIME(3) NOT NULL,
    `endsAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RewardCampaign_organizationId_status_startsAt_endsAt_idx`(`organizationId`, `status`, `startsAt`, `endsAt`),
    UNIQUE INDEX `RewardCampaign_organizationId_slug_key`(`organizationId`, `slug`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `Reward` (
    `id` VARCHAR(191) NOT NULL,
    `rewardCampaignId` VARCHAR(191) NOT NULL,
    `type` ENUM('CASH', 'DISTRIBUTION_CREDIT', 'FREE_PLAN', 'FEATURED_PLACEMENT', 'PROMOTION_PACKAGE', 'STUDIO_SESSION', 'EQUIPMENT', 'CUSTOM') NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `amountMinor` BIGINT NULL,
    `currencyCode` VARCHAR(191) NULL,
    `legalDisclosure` TEXT NULL,
    `paymentMethod` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'WINNER_PENDING', 'WINNER_CONFIRMED', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'DRAFT',
    `fulfillmentNote` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Reward_rewardCampaignId_status_idx`(`rewardCampaignId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `RewardWinner` (
    `id` VARCHAR(191) NOT NULL,
    `rewardCampaignId` VARCHAR(191) NOT NULL,
    `rewardId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'LOCKED', 'WINNER_PENDING', 'WINNER_CONFIRMED', 'FULFILLMENT_PENDING', 'FULFILLED', 'CANCELLED', 'DISPUTED') NOT NULL DEFAULT 'WINNER_PENDING',
    `confirmedAt` DATETIME(3) NULL,
    `fulfilledAt` DATETIME(3) NULL,
    `note` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `RewardWinner_userId_status_idx`(`userId`, `status`),
    UNIQUE INDEX `RewardWinner_rewardCampaignId_rewardId_userId_key`(`rewardCampaignId`, `rewardId`, `userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdCampaign` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `status` ENUM('DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED') NOT NULL DEFAULT 'DRAFT',
    `startsAt` DATETIME(3) NULL,
    `endsAt` DATETIME(3) NULL,
    `targeting` JSON NULL,
    `frequencyCap` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdCampaign_organizationId_status_startsAt_endsAt_idx`(`organizationId`, `status`, `startsAt`, `endsAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdCreative` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `type` ENUM('POPUP', 'MODAL', 'BANNER', 'INLINE', 'DISCOVER_CARD', 'SIDEBAR', 'HEADER', 'FOOTER', 'PLAYER', 'INTERSTITIAL') NOT NULL,
    `imageUrl` VARCHAR(191) NULL,
    `title` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `ctaLabel` VARCHAR(191) NULL,
    `ctaUrl` VARCHAR(191) NULL,
    `closeable` BOOLEAN NOT NULL DEFAULT true,
    `delaySeconds` INTEGER NOT NULL DEFAULT 0,
    `variant` VARCHAR(191) NOT NULL DEFAULT 'A',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AdCreative_campaignId_type_variant_idx`(`campaignId`, `type`, `variant`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdPlacement` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `placement` ENUM('HOME', 'DISCOVER', 'CHARTS', 'ARTIST_PROFILE', 'RELEASE', 'SMART_LINK', 'PRESAVE', 'DASHBOARD', 'MOBILE_HOME', 'MOBILE_DISCOVER') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AdPlacement_campaignId_placement_key`(`campaignId`, `placement`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdImpression` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `creativeId` VARCHAR(191) NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `placement` ENUM('HOME', 'DISCOVER', 'CHARTS', 'ARTIST_PROFILE', 'RELEASE', 'SMART_LINK', 'PRESAVE', 'DASHBOARD', 'MOBILE_HOME', 'MOBILE_DISCOVER') NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `bot` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdImpression_organizationId_placement_createdAt_idx`(`organizationId`, `placement`, `createdAt`),
    UNIQUE INDEX `AdImpression_campaignId_eventKey_key`(`campaignId`, `eventKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `AdClick` (
    `id` VARCHAR(191) NOT NULL,
    `campaignId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `creativeId` VARCHAR(191) NULL,
    `eventKey` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `placement` ENUM('HOME', 'DISCOVER', 'CHARTS', 'ARTIST_PROFILE', 'RELEASE', 'SMART_LINK', 'PRESAVE', 'DASHBOARD', 'MOBILE_HOME', 'MOBILE_DISCOVER') NOT NULL,
    `countryCode` VARCHAR(191) NULL,
    `deviceType` VARCHAR(191) NULL,
    `bot` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AdClick_organizationId_placement_createdAt_idx`(`organizationId`, `placement`, `createdAt`),
    UNIQUE INDEX `AdClick_campaignId_eventKey_key`(`campaignId`, `eventKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `LegalDocument` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `type` ENUM('TERMS_OF_SERVICE', 'PRIVACY_POLICY', 'COOKIE_POLICY', 'KVKK_DISCLOSURE', 'EXPLICIT_CONSENT', 'DISTRIBUTION_AGREEMENT', 'ARTIST_AGREEMENT', 'COMMUNITY_GUIDELINES', 'COPYRIGHT_POLICY', 'DMCA_POLICY', 'REFUND_POLICY', 'CONTEST_RULES', 'MARKETING_CONSENT', 'DATA_PROCESSING_AGREEMENT', 'CUSTOM') NOT NULL,
    `slug` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `locale` VARCHAR(191) NOT NULL DEFAULT 'tr-TR',
    `required` BOOLEAN NOT NULL DEFAULT false,
    `usage` VARCHAR(191) NULL,
    `status` ENUM('DRAFT', 'PUBLISHED', 'ARCHIVED', 'SCHEDULED') NOT NULL DEFAULT 'DRAFT',
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LegalDocument_organizationId_type_status_idx`(`organizationId`, `type`, `status`),
    UNIQUE INDEX `LegalDocument_organizationId_slug_locale_key`(`organizationId`, `slug`, `locale`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `LegalDocumentVersion` (
    `id` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `version` INTEGER NOT NULL,
    `content` TEXT NOT NULL,
    `changeSummary` TEXT NULL,
    `effectiveAt` DATETIME(3) NULL,
    `publishedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `LegalDocumentVersion_organizationId_publishedAt_idx`(`organizationId`, `publishedAt`),
    UNIQUE INDEX `LegalDocumentVersion_documentId_version_key`(`documentId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `UserConsent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `documentId` VARCHAR(191) NOT NULL,
    `versionId` VARCHAR(191) NOT NULL,
    `accepted` BOOLEAN NOT NULL DEFAULT false,
    `acceptedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgentHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserConsent_organizationId_userId_accepted_idx`(`organizationId`, `userId`, `accepted`),
    UNIQUE INDEX `UserConsent_userId_documentId_versionId_key`(`userId`, `documentId`, `versionId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `CookieConsent` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NULL,
    `version` VARCHAR(191) NOT NULL,
    `category` ENUM('NECESSARY', 'ANALYTICS', 'MARKETING', 'PERSONALIZATION') NOT NULL,
    `granted` BOOLEAN NOT NULL DEFAULT false,
    `grantedAt` DATETIME(3) NULL,
    `revokedAt` DATETIME(3) NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgentHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CookieConsent_organizationId_sessionId_version_idx`(`organizationId`, `sessionId`, `version`),
    INDEX `CookieConsent_userId_version_idx`(`userId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `InstallationState` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `status` ENUM('NOT_STARTED', 'IN_PROGRESS', 'COMPLETED', 'LOCKED') NOT NULL DEFAULT 'NOT_STARTED',
    `currentStep` VARCHAR(191) NULL,
    `completedAt` DATETIME(3) NULL,
    `lockedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `InstallationState_organizationId_key`(`organizationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `SystemRequirementCheck` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `checkKey` VARCHAR(191) NOT NULL,
    `status` ENUM('PASS', 'WARNING', 'FAIL', 'NOT_CONFIGURED') NOT NULL,
    `value` VARCHAR(191) NULL,
    `message` VARCHAR(191) NULL,
    `checkedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `SystemRequirementCheck_organizationId_status_idx`(`organizationId`, `status`),
    UNIQUE INDEX `SystemRequirementCheck_organizationId_checkKey_key`(`organizationId`, `checkKey`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `BackupJob` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'EXPIRED', 'DELETED') NOT NULL DEFAULT 'PENDING',
    `storageKey` VARCHAR(191) NULL,
    `encrypted` BOOLEAN NOT NULL DEFAULT true,
    `includesAudio` BOOLEAN NOT NULL DEFAULT false,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NULL,
    `errorMessage` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `BackupJob_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE TABLE `UpdateJob` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `requestedById` VARCHAR(191) NULL,
    `targetVersion` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'CHECKING', 'BACKING_UP', 'MAINTENANCE', 'MIGRATING', 'BUILDING', 'COMPLETED', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `backupJobId` VARCHAR(191) NULL,
    `migrationNames` JSON NULL,
    `releaseNotes` TEXT NULL,
    `errorMessage` TEXT NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UpdateJob_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
ALTER TABLE `TenantBranding` ADD CONSTRAINT `TenantBranding_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ThemeConfig` ADD CONSTRAINT `ThemeConfig_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ThemeVersion` ADD CONSTRAINT `ThemeVersion_themeConfigId_fkey` FOREIGN KEY (`themeConfigId`) REFERENCES `ThemeConfig`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ThemeVersion` ADD CONSTRAINT `ThemeVersion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `TenantDomain` ADD CONSTRAINT `TenantDomain_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SitePage` ADD CONSTRAINT `SitePage_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SitePageVersion` ADD CONSTRAINT `SitePageVersion_sitePageId_fkey` FOREIGN KEY (`sitePageId`) REFERENCES `SitePage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SitePageVersion` ADD CONSTRAINT `SitePageVersion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SiteSection` ADD CONSTRAINT `SiteSection_sitePageId_fkey` FOREIGN KEY (`sitePageId`) REFERENCES `SitePage`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `DiscoverConfig` ADD CONSTRAINT `DiscoverConfig_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiClient` ADD CONSTRAINT `ApiClient_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiClient` ADD CONSTRAINT `ApiClient_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_apiClientId_fkey` FOREIGN KEY (`apiClientId`) REFERENCES `ApiClient`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiKey` ADD CONSTRAINT `ApiKey_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiUsageRecord` ADD CONSTRAINT `ApiUsageRecord_apiKeyId_fkey` FOREIGN KEY (`apiKeyId`) REFERENCES `ApiKey`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ApiUsageRecord` ADD CONSTRAINT `ApiUsageRecord_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WebhookEndpoint` ADD CONSTRAINT `WebhookEndpoint_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WebhookEndpoint` ADD CONSTRAINT `WebhookEndpoint_ownerUserId_fkey` FOREIGN KEY (`ownerUserId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WebhookSubscription` ADD CONSTRAINT `WebhookSubscription_webhookEndpointId_fkey` FOREIGN KEY (`webhookEndpointId`) REFERENCES `WebhookEndpoint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WebhookDelivery` ADD CONSTRAINT `WebhookDelivery_webhookEndpointId_fkey` FOREIGN KEY (`webhookEndpointId`) REFERENCES `WebhookEndpoint`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `WebhookDelivery` ADD CONSTRAINT `WebhookDelivery_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `OnboardingProgress` ADD CONSTRAINT `OnboardingProgress_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SystemHealthCheck` ADD CONSTRAINT `SystemHealthCheck_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `License` ADD CONSTRAINT `License_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LicenseValidation` ADD CONSTRAINT `LicenseValidation_licenseId_fkey` FOREIGN KEY (`licenseId`) REFERENCES `License`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Chart` ADD CONSTRAINT `Chart_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartRule` ADD CONSTRAINT `ChartRule_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartRule` ADD CONSTRAINT `ChartRule_chartId_fkey` FOREIGN KEY (`chartId`) REFERENCES `Chart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartSnapshot` ADD CONSTRAINT `ChartSnapshot_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartSnapshot` ADD CONSTRAINT `ChartSnapshot_chartId_fkey` FOREIGN KEY (`chartId`) REFERENCES `Chart`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartEntry` ADD CONSTRAINT `ChartEntry_snapshotId_fkey` FOREIGN KEY (`snapshotId`) REFERENCES `ChartSnapshot`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `ChartEntry` ADD CONSTRAINT `ChartEntry_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VoteCampaign` ADD CONSTRAINT `VoteCampaign_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `VoteCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Vote` ADD CONSTRAINT `Vote_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `VoteFraudSignal` ADD CONSTRAINT `VoteFraudSignal_voteId_fkey` FOREIGN KEY (`voteId`) REFERENCES `Vote`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RewardCampaign` ADD CONSTRAINT `RewardCampaign_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `Reward` ADD CONSTRAINT `Reward_rewardCampaignId_fkey` FOREIGN KEY (`rewardCampaignId`) REFERENCES `RewardCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RewardWinner` ADD CONSTRAINT `RewardWinner_rewardCampaignId_fkey` FOREIGN KEY (`rewardCampaignId`) REFERENCES `RewardCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RewardWinner` ADD CONSTRAINT `RewardWinner_rewardId_fkey` FOREIGN KEY (`rewardId`) REFERENCES `Reward`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `RewardWinner` ADD CONSTRAINT `RewardWinner_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdCampaign` ADD CONSTRAINT `AdCampaign_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdCreative` ADD CONSTRAINT `AdCreative_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdPlacement` ADD CONSTRAINT `AdPlacement_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdImpression` ADD CONSTRAINT `AdImpression_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdImpression` ADD CONSTRAINT `AdImpression_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdClick` ADD CONSTRAINT `AdClick_campaignId_fkey` FOREIGN KEY (`campaignId`) REFERENCES `AdCampaign`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `AdClick` ADD CONSTRAINT `AdClick_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LegalDocument` ADD CONSTRAINT `LegalDocument_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LegalDocumentVersion` ADD CONSTRAINT `LegalDocumentVersion_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `LegalDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `LegalDocumentVersion` ADD CONSTRAINT `LegalDocumentVersion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserConsent` ADD CONSTRAINT `UserConsent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserConsent` ADD CONSTRAINT `UserConsent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserConsent` ADD CONSTRAINT `UserConsent_documentId_fkey` FOREIGN KEY (`documentId`) REFERENCES `LegalDocument`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UserConsent` ADD CONSTRAINT `UserConsent_versionId_fkey` FOREIGN KEY (`versionId`) REFERENCES `LegalDocumentVersion`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CookieConsent` ADD CONSTRAINT `CookieConsent_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `CookieConsent` ADD CONSTRAINT `CookieConsent_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `InstallationState` ADD CONSTRAINT `InstallationState_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `SystemRequirementCheck` ADD CONSTRAINT `SystemRequirementCheck_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `BackupJob` ADD CONSTRAINT `BackupJob_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `UpdateJob` ADD CONSTRAINT `UpdateJob_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
