-- Sprint 8: AI Metadata Assistant, Quality Control and Release Intelligence

-- Extend ReleaseValidationIssue for intelligence sources and CRITICAL severity
ALTER TABLE `ReleaseValidationIssue` MODIFY `severity` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL DEFAULT 'ERROR';
ALTER TABLE `ReleaseValidationIssue` ADD COLUMN `category` ENUM('METADATA', 'AUDIO', 'ARTWORK', 'RIGHTS', 'PROVIDER_COMPATIBILITY', 'CONTRIBUTOR', 'DUPLICATE', 'LYRICS') NOT NULL DEFAULT 'METADATA', ADD COLUMN `title` VARCHAR(191) NULL, ADD COLUMN `suggestedAction` TEXT NULL, ADD COLUMN `blocking` BOOLEAN NOT NULL DEFAULT true, ADD COLUMN `source` ENUM('RULE_ENGINE', 'AI', 'AUDIO_ANALYZER', 'ARTWORK_ANALYZER', 'PROVIDER_RULE') NOT NULL DEFAULT 'RULE_ENGINE', ADD COLUMN `metadata` JSON NULL;

CREATE TABLE `AiProvider` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `code` ENUM('OPENAI', 'ANTHROPIC', 'GOOGLE', 'INTERNAL_RULE_ENGINE') NOT NULL,
    `displayName` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `lastHealthStatus` VARCHAR(191) NULL,
    `lastHealthMessage` VARCHAR(191) NULL,
    `lastHealthCheckedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AiProvider_code_active_idx`(`code`, `active`),
    UNIQUE INDEX `AiProvider_organizationId_code_key`(`organizationId`, `code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiProviderCredential` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `keyName` VARCHAR(191) NOT NULL,
    `encryptedValue` TEXT NOT NULL,
    `maskedValue` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiProviderCredential_providerId_keyName_key`(`providerId`, `keyName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiCapability` (
    `id` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NOT NULL,
    `capability` ENUM('TEXT_ANALYSIS', 'STRUCTURED_OUTPUT', 'IMAGE_ANALYSIS', 'EMBEDDINGS', 'MODERATION', 'LANGUAGE_DETECTION', 'GENRE_SUGGESTION', 'METADATA_REWRITE') NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiCapability_capability_active_idx`(`capability`, `active`),
    UNIQUE INDEX `AiCapability_providerId_capability_key`(`providerId`, `capability`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAnalysisJob` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NULL,
    `trackId` VARCHAR(191) NULL,
    `uploadId` VARCHAR(191) NULL,
    `requestedByUserId` VARCHAR(191) NULL,
    `providerId` VARCHAR(191) NULL,
    `jobType` ENUM('METADATA_ANALYSIS', 'ARTWORK_ANALYSIS', 'AUDIO_ANALYSIS', 'AUDIO_FINGERPRINT', 'DUPLICATE_DETECTION', 'LYRICS_ANALYSIS', 'READINESS_SCORE', 'PROVIDER_COMPATIBILITY') NOT NULL,
    `status` ENUM('PENDING', 'QUEUED', 'PROCESSING', 'RETRY_SCHEDULED', 'COMPLETED', 'FAILED', 'CANCELLED', 'CONFIGURATION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `inputHash` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `attemptCount` INTEGER NOT NULL DEFAULT 0,
    `maxRetryCount` INTEGER NOT NULL DEFAULT 3,
    `nextAttemptAt` DATETIME(3) NULL,
    `lockedAt` DATETIME(3) NULL,
    `lockedBy` VARCHAR(191) NULL,
    `lastErrorCode` VARCHAR(191) NULL,
    `lastErrorMessage` VARCHAR(191) NULL,
    `queuedAt` DATETIME(3) NULL,
    `startedAt` DATETIME(3) NULL,
    `completedAt` DATETIME(3) NULL,
    `cancelledAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiAnalysisJob_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AiAnalysisJob_organizationId_status_nextAttemptAt_idx`(`organizationId`, `status`, `nextAttemptAt`),
    INDEX `AiAnalysisJob_releaseId_jobType_createdAt_idx`(`releaseId`, `jobType`, `createdAt`),
    INDEX `AiAnalysisJob_trackId_jobType_createdAt_idx`(`trackId`, `jobType`, `createdAt`),
    INDEX `AiAnalysisJob_uploadId_jobType_createdAt_idx`(`uploadId`, `jobType`, `createdAt`),
    UNIQUE INDEX `AiAnalysisJob_organizationId_jobType_inputHash_key`(`organizationId`, `jobType`, `inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiAnalysisAttempt` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NOT NULL,
    `providerId` VARCHAR(191) NULL,
    `actorUserId` VARCHAR(191) NULL,
    `attemptNumber` INTEGER NOT NULL,
    `status` ENUM('PENDING', 'QUEUED', 'PROCESSING', 'RETRY_SCHEDULED', 'COMPLETED', 'FAILED', 'CANCELLED', 'CONFIGURATION_REQUIRED') NOT NULL,
    `retryable` BOOLEAN NOT NULL DEFAULT false,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` VARCHAR(191) NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `finishedAt` DATETIME(3) NULL,
    `durationMs` INTEGER NULL,
    `usageMetadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AiAnalysisAttempt_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    UNIQUE INDEX `AiAnalysisAttempt_jobId_attemptNumber_key`(`jobId`, `attemptNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiUsageRecord` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `providerId` VARCHAR(191) NULL,
    `jobId` VARCHAR(191) NULL,
    `usageType` ENUM('METADATA_ANALYSIS', 'ARTWORK_ANALYSIS', 'AUDIO_ANALYSIS', 'AUDIO_FINGERPRINT', 'DUPLICATE_DETECTION', 'LYRICS_ANALYSIS', 'READINESS_SCORE', 'PROVIDER_COMPATIBILITY') NOT NULL,
    `unitCount` INTEGER NOT NULL DEFAULT 1,
    `costMinor` BIGINT NULL,
    `currencyCode` ENUM('TRY', 'USD', 'EUR') NULL,
    `usageDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `metadata` JSON NULL,

    UNIQUE INDEX `AiUsageRecord_idempotencyKey_key`(`idempotencyKey`),
    INDEX `AiUsageRecord_organizationId_usageType_usageDate_idx`(`organizationId`, `usageType`, `usageDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ValidationRun` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED', 'STALE', 'CONFIGURATION_REQUIRED') NOT NULL DEFAULT 'COMPLETED',
    `issueCount` INTEGER NOT NULL DEFAULT 0,
    `blockingCount` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ValidationRun_organizationId_releaseId_createdAt_idx`(`organizationId`, `releaseId`, `createdAt`),
    INDEX `ValidationRun_inputHash_idx`(`inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetadataAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `jobId` VARCHAR(191) NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED', 'STALE', 'CONFIGURATION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `providerCode` ENUM('OPENAI', 'ANTHROPIC', 'GOOGLE', 'INTERNAL_RULE_ENGINE') NULL,
    `structuredResult` JSON NULL,
    `rawResponse` JSON NULL,
    `promptVersionId` VARCHAR(191) NULL,
    `staleAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MetadataAnalysis_releaseId_status_createdAt_idx`(`releaseId`, `status`, `createdAt`),
    UNIQUE INDEX `MetadataAnalysis_organizationId_releaseId_inputHash_key`(`organizationId`, `releaseId`, `inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MetadataSuggestion` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `analysisId` VARCHAR(191) NOT NULL,
    `fieldPath` VARCHAR(191) NOT NULL,
    `originalValue` JSON NULL,
    `suggestedValue` JSON NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `explanation` TEXT NOT NULL,
    `confidence` ENUM('LOW', 'MEDIUM', 'HIGH') NOT NULL,
    `status` ENUM('PENDING', 'ACCEPTED', 'REJECTED', 'STALE') NOT NULL DEFAULT 'PENDING',
    `acceptedByUserId` VARCHAR(191) NULL,
    `rejectedByUserId` VARCHAR(191) NULL,
    `decidedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MetadataSuggestion_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `MetadataSuggestion_analysisId_status_idx`(`analysisId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtworkAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED', 'STALE', 'CONFIGURATION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `width` INTEGER NULL,
    `height` INTEGER NULL,
    `aspectRatio` DECIMAL(10, 6) NULL,
    `fileSizeBytes` BIGINT NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `actualSignature` VARCHAR(191) NULL,
    `colorSpace` VARCHAR(191) NULL,
    `hasAlphaChannel` BOOLEAN NULL,
    `blurScore` DECIMAL(10, 4) NULL,
    `compressionScore` DECIMAL(10, 4) NULL,
    `brightness` DECIMAL(10, 4) NULL,
    `contrast` DECIMAL(10, 4) NULL,
    `riskSignal` ENUM('POSSIBLE_RISK', 'NEEDS_REVIEW', 'NO_OBVIOUS_RISK') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ArtworkAnalysis_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `ArtworkAnalysis_releaseId_createdAt_idx`(`releaseId`, `createdAt`),
    UNIQUE INDEX `ArtworkAnalysis_uploadId_inputHash_key`(`uploadId`, `inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ArtworkAnalysisIssue` (
    `id` VARCHAR(191) NOT NULL,
    `analysisId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    `blocking` BOOLEAN NOT NULL DEFAULT false,
    `message` TEXT NOT NULL,
    `boundingBox` JSON NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ArtworkAnalysisIssue_analysisId_severity_blocking_idx`(`analysisId`, `severity`, `blocking`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AudioAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED') NOT NULL DEFAULT 'PENDING',
    `codec` VARCHAR(191) NULL,
    `container` VARCHAR(191) NULL,
    `durationMs` INTEGER NULL,
    `sampleRate` INTEGER NULL,
    `bitDepth` INTEGER NULL,
    `bitrate` INTEGER NULL,
    `channels` INTEGER NULL,
    `channelLayout` VARCHAR(191) NULL,
    `fileSizeBytes` BIGINT NOT NULL,
    `peakLevel` DECIMAL(10, 4) NULL,
    `truePeak` DECIMAL(10, 4) NULL,
    `integratedLoudness` DECIMAL(10, 4) NULL,
    `dynamicRange` DECIMAL(10, 4) NULL,
    `silenceStartMs` INTEGER NULL,
    `silenceEndMs` INTEGER NULL,
    `clippingLikely` BOOLEAN NULL,
    `corruptFile` BOOLEAN NOT NULL DEFAULT false,
    `decodeError` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `AudioAnalysis_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `AudioAnalysis_releaseId_trackId_createdAt_idx`(`releaseId`, `trackId`, `createdAt`),
    UNIQUE INDEX `AudioAnalysis_uploadId_inputHash_key`(`uploadId`, `inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AudioAnalysisIssue` (
    `id` VARCHAR(191) NOT NULL,
    `analysisId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `severity` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    `blocking` BOOLEAN NOT NULL DEFAULT false,
    `message` TEXT NOT NULL,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AudioAnalysisIssue_analysisId_severity_blocking_idx`(`analysisId`, `severity`, `blocking`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AudioFingerprint` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NOT NULL,
    `fileHash` VARCHAR(191) NOT NULL,
    `fingerprintHash` VARCHAR(191) NULL,
    `normalizedHash` VARCHAR(191) NULL,
    `algorithm` VARCHAR(191) NOT NULL DEFAULT 'SHA256',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `AudioFingerprint_organizationId_fileHash_idx`(`organizationId`, `fileHash`),
    INDEX `AudioFingerprint_fingerprintHash_idx`(`fingerprintHash`),
    UNIQUE INDEX `AudioFingerprint_uploadId_algorithm_key`(`uploadId`, `algorithm`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DuplicateAudioMatch` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `sourceFingerprintId` VARCHAR(191) NOT NULL,
    `matchedOrganizationId` VARCHAR(191) NOT NULL,
    `matchedFingerprintId` VARCHAR(191) NOT NULL,
    `exactHashMatch` BOOLEAN NOT NULL DEFAULT false,
    `similarityScore` DECIMAL(10, 6) NULL,
    `status` ENUM('POSSIBLE', 'CONFIRMED', 'DISMISSED', 'MANUAL_REVIEW') NOT NULL DEFAULT 'POSSIBLE',
    `crossTenant` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `DuplicateAudioMatch_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `DuplicateAudioMatch_trackId_status_idx`(`trackId`, `status`),
    UNIQUE INDEX `DuplicateAudioMatch_sourceFingerprintId_matchedFingerprintId_key`(`sourceFingerprintId`, `matchedFingerprintId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LyricsAnalysis` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED', 'STALE', 'CONFIGURATION_REQUIRED') NOT NULL DEFAULT 'PENDING',
    `language` VARCHAR(191) NULL,
    `explicitRisk` ENUM('LOW', 'MEDIUM', 'HIGH') NULL,
    `riskSummary` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `LyricsAnalysis_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    UNIQUE INDEX `LyricsAnalysis_trackId_inputHash_key`(`trackId`, `inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderRuleProfile` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `code` ENUM('RADARUNE_BASE', 'ONERPM', 'FUGA', 'SYMPHONIC', 'REVELATOR', 'SPOTIFY', 'APPLE_MUSIC', 'YOUTUBE_MUSIC', 'AMAZON_MUSIC', 'TIKTOK', 'META') NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `version` VARCHAR(191) NOT NULL DEFAULT '1',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderRuleProfile_code_active_idx`(`code`, `active`),
    UNIQUE INDEX `ProviderRuleProfile_organizationId_code_version_key`(`organizationId`, `code`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ProviderRule` (
    `id` VARCHAR(191) NOT NULL,
    `profileId` VARCHAR(191) NOT NULL,
    `code` VARCHAR(191) NOT NULL,
    `category` ENUM('METADATA', 'AUDIO', 'ARTWORK', 'RIGHTS', 'PROVIDER_COMPATIBILITY', 'CONTRIBUTOR', 'DUPLICATE', 'LYRICS') NOT NULL,
    `fieldPath` VARCHAR(191) NOT NULL,
    `operator` ENUM('REQUIRED', 'EQUALS', 'NOT_EQUALS', 'MIN', 'MAX', 'REGEX', 'IN', 'NOT_IN') NOT NULL,
    `expectedValue` JSON NULL,
    `severity` ENUM('INFO', 'WARNING', 'ERROR', 'CRITICAL') NOT NULL,
    `blocking` BOOLEAN NOT NULL DEFAULT false,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `message` TEXT NOT NULL,
    `documentationReference` VARCHAR(2048) NULL,
    `version` VARCHAR(191) NOT NULL DEFAULT '1',
    `effectiveFrom` DATETIME(3) NULL,
    `effectiveUntil` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `ProviderRule_profileId_active_idx`(`profileId`, `active`),
    INDEX `ProviderRule_category_blocking_idx`(`category`, `blocking`),
    UNIQUE INDEX `ProviderRule_profileId_code_version_key`(`profileId`, `code`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseReadinessScore` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `releaseId` VARCHAR(191) NOT NULL,
    `inputHash` VARCHAR(191) NOT NULL,
    `score` INTEGER NOT NULL,
    `blockingCount` INTEGER NOT NULL DEFAULT 0,
    `warningCount` INTEGER NOT NULL DEFAULT 0,
    `explanation` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ReleaseReadinessScore_organizationId_releaseId_createdAt_idx`(`organizationId`, `releaseId`, `createdAt`),
    INDEX `ReleaseReadinessScore_inputHash_idx`(`inputHash`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ReleaseReadinessCategory` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `scoreId` VARCHAR(191) NOT NULL,
    `category` ENUM('METADATA', 'AUDIO', 'ARTWORK', 'RIGHTS', 'PROVIDER_COMPATIBILITY', 'CONTRIBUTOR', 'DUPLICATE', 'LYRICS') NOT NULL,
    `score` INTEGER NOT NULL,
    `deductions` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ReleaseReadinessCategory_scoreId_category_key`(`scoreId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiPromptTemplate` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `activeVersionId` VARCHAR(191) NULL,
    `createdByUserId` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `AiPromptTemplate_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `AiPromptVersion` (
    `id` VARCHAR(191) NOT NULL,
    `templateId` VARCHAR(191) NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `content` TEXT NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT false,
    `metadata` JSON NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `AiPromptVersion_templateId_version_key`(`templateId`, `version`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable

ALTER TABLE `AiProvider` ADD CONSTRAINT `AiProvider_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiProviderCredential` ADD CONSTRAINT `AiProviderCredential_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiCapability` ADD CONSTRAINT `AiCapability_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisJob` ADD CONSTRAINT `AiAnalysisJob_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisJob` ADD CONSTRAINT `AiAnalysisJob_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisJob` ADD CONSTRAINT `AiAnalysisJob_requestedByUserId_fkey` FOREIGN KEY (`requestedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisJob` ADD CONSTRAINT `AiAnalysisJob_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisAttempt` ADD CONSTRAINT `AiAnalysisAttempt_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisAttempt` ADD CONSTRAINT `AiAnalysisAttempt_jobId_fkey` FOREIGN KEY (`jobId`) REFERENCES `AiAnalysisJob`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisAttempt` ADD CONSTRAINT `AiAnalysisAttempt_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiAnalysisAttempt` ADD CONSTRAINT `AiAnalysisAttempt_actorUserId_fkey` FOREIGN KEY (`actorUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiUsageRecord` ADD CONSTRAINT `AiUsageRecord_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiUsageRecord` ADD CONSTRAINT `AiUsageRecord_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiUsageRecord` ADD CONSTRAINT `AiUsageRecord_providerId_fkey` FOREIGN KEY (`providerId`) REFERENCES `AiProvider`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationRun` ADD CONSTRAINT `ValidationRun_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ValidationRun` ADD CONSTRAINT `ValidationRun_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataAnalysis` ADD CONSTRAINT `MetadataAnalysis_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataAnalysis` ADD CONSTRAINT `MetadataAnalysis_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataSuggestion` ADD CONSTRAINT `MetadataSuggestion_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataSuggestion` ADD CONSTRAINT `MetadataSuggestion_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `MetadataAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataSuggestion` ADD CONSTRAINT `MetadataSuggestion_acceptedByUserId_fkey` FOREIGN KEY (`acceptedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MetadataSuggestion` ADD CONSTRAINT `MetadataSuggestion_rejectedByUserId_fkey` FOREIGN KEY (`rejectedByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkAnalysis` ADD CONSTRAINT `ArtworkAnalysis_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkAnalysis` ADD CONSTRAINT `ArtworkAnalysis_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkAnalysis` ADD CONSTRAINT `ArtworkAnalysis_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ArtworkAnalysisIssue` ADD CONSTRAINT `ArtworkAnalysisIssue_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `ArtworkAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioAnalysis` ADD CONSTRAINT `AudioAnalysis_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioAnalysis` ADD CONSTRAINT `AudioAnalysis_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioAnalysis` ADD CONSTRAINT `AudioAnalysis_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioAnalysis` ADD CONSTRAINT `AudioAnalysis_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioAnalysisIssue` ADD CONSTRAINT `AudioAnalysisIssue_analysisId_fkey` FOREIGN KEY (`analysisId`) REFERENCES `AudioAnalysis`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioFingerprint` ADD CONSTRAINT `AudioFingerprint_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioFingerprint` ADD CONSTRAINT `AudioFingerprint_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AudioFingerprint` ADD CONSTRAINT `AudioFingerprint_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DuplicateAudioMatch` ADD CONSTRAINT `DuplicateAudioMatch_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DuplicateAudioMatch` ADD CONSTRAINT `DuplicateAudioMatch_matchedOrganizationId_fkey` FOREIGN KEY (`matchedOrganizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DuplicateAudioMatch` ADD CONSTRAINT `DuplicateAudioMatch_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DuplicateAudioMatch` ADD CONSTRAINT `DuplicateAudioMatch_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LyricsAnalysis` ADD CONSTRAINT `LyricsAnalysis_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LyricsAnalysis` ADD CONSTRAINT `LyricsAnalysis_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LyricsAnalysis` ADD CONSTRAINT `LyricsAnalysis_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderRuleProfile` ADD CONSTRAINT `ProviderRuleProfile_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ProviderRule` ADD CONSTRAINT `ProviderRule_profileId_fkey` FOREIGN KEY (`profileId`) REFERENCES `ProviderRuleProfile`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseReadinessScore` ADD CONSTRAINT `ReleaseReadinessScore_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseReadinessScore` ADD CONSTRAINT `ReleaseReadinessScore_releaseId_fkey` FOREIGN KEY (`releaseId`) REFERENCES `Release`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseReadinessCategory` ADD CONSTRAINT `ReleaseReadinessCategory_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReleaseReadinessCategory` ADD CONSTRAINT `ReleaseReadinessCategory_scoreId_fkey` FOREIGN KEY (`scoreId`) REFERENCES `ReleaseReadinessScore`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiPromptTemplate` ADD CONSTRAINT `AiPromptTemplate_createdByUserId_fkey` FOREIGN KEY (`createdByUserId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AiPromptVersion` ADD CONSTRAINT `AiPromptVersion_templateId_fkey` FOREIGN KEY (`templateId`) REFERENCES `AiPromptTemplate`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
