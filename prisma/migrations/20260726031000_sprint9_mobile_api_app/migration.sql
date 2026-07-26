-- Sprint 9: Mobile API, mobile sessions, upload sessions, push notifications and playback telemetry

CREATE TABLE `MobileDevice` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NOT NULL,
    `deviceName` VARCHAR(191) NULL,
    `appVersion` VARCHAR(191) NOT NULL,
    `osVersion` VARCHAR(191) NULL,
    `locale` VARCHAR(191) NULL,
    `timezone` VARCHAR(191) NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `lastSeenAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastIpHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MobileDevice_organizationId_platform_active_idx`(`organizationId`, `platform`, `active`),
    INDEX `MobileDevice_deviceId_active_idx`(`deviceId`, `active`),
    INDEX `MobileDevice_lastSeenAt_idx`(`lastSeenAt`),
    UNIQUE INDEX `MobileDevice_userId_deviceId_key`(`userId`, `deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RefreshTokenFamily` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `familyHash` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED', 'REUSE_DETECTED') NOT NULL DEFAULT 'ACTIVE',
    `revokedAt` DATETIME(3) NULL,
    `reuseDetectedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `RefreshTokenFamily_familyHash_key`(`familyHash`),
    INDEX `RefreshTokenFamily_userId_status_expiresAt_idx`(`userId`, `status`, `expiresAt`),
    INDEX `RefreshTokenFamily_organizationId_status_idx`(`organizationId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `DeviceSession` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `tokenFamilyId` VARCHAR(191) NOT NULL,
    `accessTokenHash` VARCHAR(191) NOT NULL,
    `refreshTokenHash` VARCHAR(191) NOT NULL,
    `status` ENUM('ACTIVE', 'REVOKED', 'EXPIRED', 'REUSE_DETECTED') NOT NULL DEFAULT 'ACTIVE',
    `accessTokenExpiresAt` DATETIME(3) NOT NULL,
    `refreshTokenExpiresAt` DATETIME(3) NOT NULL,
    `revokedAt` DATETIME(3) NULL,
    `lastUsedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `lastIpHash` VARCHAR(191) NULL,
    `userAgentHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `DeviceSession_accessTokenHash_key`(`accessTokenHash`),
    UNIQUE INDEX `DeviceSession_refreshTokenHash_key`(`refreshTokenHash`),
    INDEX `DeviceSession_userId_status_refreshTokenExpiresAt_idx`(`userId`, `status`, `refreshTokenExpiresAt`),
    INDEX `DeviceSession_deviceId_status_idx`(`deviceId`, `status`),
    INDEX `DeviceSession_tokenFamilyId_status_idx`(`tokenFamilyId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileAppVersion` (
    `id` VARCHAR(191) NOT NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NOT NULL,
    `version` VARCHAR(191) NOT NULL,
    `buildNumber` INTEGER NOT NULL,
    `minimumSupportedVersion` VARCHAR(191) NOT NULL,
    `latestVersion` VARCHAR(191) NOT NULL,
    `forceUpdate` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMode` BOOLEAN NOT NULL DEFAULT false,
    `maintenanceMessage` TEXT NULL,
    `featureFlags` JSON NULL,
    `legalDocumentVersions` JSON NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `MobileAppVersion_platform_active_idx`(`platform`, `active`),
    UNIQUE INDEX `MobileAppVersion_platform_version_buildNumber_key`(`platform`, `version`, `buildNumber`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushToken` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NOT NULL,
    `provider` ENUM('EXPO_PUSH', 'FCM', 'APNS') NOT NULL,
    `tokenHash` VARCHAR(191) NOT NULL,
    `tokenEncrypted` TEXT NOT NULL,
    `maskedToken` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `invalidatedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PushToken_tokenHash_key`(`tokenHash`),
    INDEX `PushToken_organizationId_provider_active_idx`(`organizationId`, `provider`, `active`),
    INDEX `PushToken_userId_active_idx`(`userId`, `active`),
    INDEX `PushToken_deviceId_active_idx`(`deviceId`, `active`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushNotification` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NOT NULL,
    `notificationId` VARCHAR(191) NULL,
    `type` VARCHAR(191) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `body` TEXT NOT NULL,
    `deepLink` VARCHAR(191) NULL,
    `payload` JSON NULL,
    `priority` INTEGER NOT NULL DEFAULT 100,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `PushNotification_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `PushNotification_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `PushNotification_notificationId_idx`(`notificationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PushNotificationDelivery` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `pushNotificationId` VARCHAR(191) NOT NULL,
    `pushTokenId` VARCHAR(191) NOT NULL,
    `provider` ENUM('EXPO_PUSH', 'FCM', 'APNS') NOT NULL,
    `status` ENUM('PENDING', 'QUEUED', 'SENT', 'DELIVERED', 'FAILED', 'INVALID_TOKEN', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `providerMessageId` VARCHAR(191) NULL,
    `errorCode` VARCHAR(191) NULL,
    `errorMessage` TEXT NULL,
    `queuedAt` DATETIME(3) NULL,
    `sentAt` DATETIME(3) NULL,
    `deliveredAt` DATETIME(3) NULL,
    `failedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `PushNotificationDelivery_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `PushNotificationDelivery_pushNotificationId_status_idx`(`pushNotificationId`, `status`),
    INDEX `PushNotificationDelivery_pushTokenId_status_idx`(`pushTokenId`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationPreference` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `category` ENUM('RELEASE_UPDATES', 'FINANCE_PAYOUT', 'SOCIAL', 'MARKETING', 'SYSTEM', 'SECURITY') NOT NULL,
    `pushEnabled` BOOLEAN NOT NULL DEFAULT true,
    `emailEnabled` BOOLEAN NOT NULL DEFAULT true,
    `inAppEnabled` BOOLEAN NOT NULL DEFAULT true,
    `locked` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NotificationPreference_organizationId_category_idx`(`organizationId`, `category`),
    UNIQUE INDEX `NotificationPreference_userId_category_key`(`userId`, `category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `NotificationTopic` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` TEXT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `NotificationTopic_organizationId_active_idx`(`organizationId`, `active`),
    UNIQUE INDEX `NotificationTopic_organizationId_key_key`(`organizationId`, `key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserNotificationSubscription` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `topicId` VARCHAR(191) NOT NULL,
    `active` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `UserNotificationSubscription_topicId_active_idx`(`topicId`, `active`),
    UNIQUE INDEX `UserNotificationSubscription_userId_topicId_key`(`userId`, `topicId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileUploadSession` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `uploadId` VARCHAR(191) NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `kind` ENUM('AUDIO', 'ARTWORK') NOT NULL,
    `status` ENUM('CREATED', 'UPLOADING', 'PAUSED', 'VERIFYING', 'COMPLETED', 'FAILED', 'ABORTED', 'EXPIRED') NOT NULL DEFAULT 'CREATED',
    `fileName` VARCHAR(191) NOT NULL,
    `mimeType` VARCHAR(191) NOT NULL,
    `byteSize` BIGINT NOT NULL,
    `checksumSha256` VARCHAR(191) NULL,
    `storageKey` VARCHAR(191) NOT NULL,
    `signedUploadUrl` TEXT NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `completedAt` DATETIME(3) NULL,
    `abortedAt` DATETIME(3) NULL,
    `failureReason` TEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MobileUploadSession_idempotencyKey_key`(`idempotencyKey`),
    INDEX `MobileUploadSession_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `MobileUploadSession_userId_status_idx`(`userId`, `status`),
    INDEX `MobileUploadSession_expiresAt_idx`(`expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PlaybackSession` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NULL,
    `sessionId` VARCHAR(191) NOT NULL,
    `trackId` VARCHAR(191) NOT NULL,
    `source` ENUM('DISCOVER', 'RELEASE', 'ARTIST_PROFILE', 'PLAYLIST', 'SMART_LINK', 'PRESAVE', 'SEARCH') NOT NULL,
    `startedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `listenedMilliseconds` INTEGER NOT NULL DEFAULT 0,
    `completed` BOOLEAN NOT NULL DEFAULT false,
    `streamCountedAt` DATETIME(3) NULL,
    `deviceId` VARCHAR(191) NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgentHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `PlaybackSession_sessionId_key`(`sessionId`),
    INDEX `PlaybackSession_organizationId_trackId_createdAt_idx`(`organizationId`, `trackId`, `createdAt`),
    INDEX `PlaybackSession_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `PlaybackSession_streamCountedAt_idx`(`streamCountedAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileOfflineOperation` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `operationId` VARCHAR(191) NOT NULL,
    `operationType` VARCHAR(191) NOT NULL,
    `idempotencyKey` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'APPLIED', 'CONFLICT', 'REJECTED', 'EXPIRED') NOT NULL DEFAULT 'PENDING',
    `payloadHash` VARCHAR(191) NOT NULL,
    `conflictReason` TEXT NULL,
    `appliedAt` DATETIME(3) NULL,
    `expiresAt` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MobileOfflineOperation_idempotencyKey_key`(`idempotencyKey`),
    INDEX `MobileOfflineOperation_organizationId_status_createdAt_idx`(`organizationId`, `status`, `createdAt`),
    INDEX `MobileOfflineOperation_expiresAt_idx`(`expiresAt`),
    UNIQUE INDEX `MobileOfflineOperation_userId_operationId_key`(`userId`, `operationId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MobileApiRequestLog` (
    `id` VARCHAR(191) NOT NULL,
    `organizationId` VARCHAR(191) NULL,
    `userId` VARCHAR(191) NULL,
    `requestId` VARCHAR(191) NOT NULL,
    `method` VARCHAR(191) NOT NULL,
    `path` VARCHAR(191) NOT NULL,
    `statusCode` INTEGER NOT NULL,
    `durationMs` INTEGER NULL,
    `appVersion` VARCHAR(191) NULL,
    `platform` ENUM('IOS', 'ANDROID', 'WEB') NULL,
    `ipHash` VARCHAR(191) NULL,
    `userAgentHash` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `MobileApiRequestLog_requestId_key`(`requestId`),
    INDEX `MobileApiRequestLog_organizationId_createdAt_idx`(`organizationId`, `createdAt`),
    INDEX `MobileApiRequestLog_userId_createdAt_idx`(`userId`, `createdAt`),
    INDEX `MobileApiRequestLog_statusCode_createdAt_idx`(`statusCode`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable

ALTER TABLE `MobileDevice` ADD CONSTRAINT `MobileDevice_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileDevice` ADD CONSTRAINT `MobileDevice_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshTokenFamily` ADD CONSTRAINT `RefreshTokenFamily_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RefreshTokenFamily` ADD CONSTRAINT `RefreshTokenFamily_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceSession` ADD CONSTRAINT `DeviceSession_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceSession` ADD CONSTRAINT `DeviceSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceSession` ADD CONSTRAINT `DeviceSession_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `MobileDevice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `DeviceSession` ADD CONSTRAINT `DeviceSession_tokenFamilyId_fkey` FOREIGN KEY (`tokenFamilyId`) REFERENCES `RefreshTokenFamily`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushToken` ADD CONSTRAINT `PushToken_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushToken` ADD CONSTRAINT `PushToken_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushToken` ADD CONSTRAINT `PushToken_deviceId_fkey` FOREIGN KEY (`deviceId`) REFERENCES `MobileDevice`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotification` ADD CONSTRAINT `PushNotification_notificationId_fkey` FOREIGN KEY (`notificationId`) REFERENCES `Notification`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotificationDelivery` ADD CONSTRAINT `PushNotificationDelivery_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotificationDelivery` ADD CONSTRAINT `PushNotificationDelivery_pushNotificationId_fkey` FOREIGN KEY (`pushNotificationId`) REFERENCES `PushNotification`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PushNotificationDelivery` ADD CONSTRAINT `PushNotificationDelivery_pushTokenId_fkey` FOREIGN KEY (`pushTokenId`) REFERENCES `PushToken`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationPreference` ADD CONSTRAINT `NotificationPreference_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationPreference` ADD CONSTRAINT `NotificationPreference_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `NotificationTopic` ADD CONSTRAINT `NotificationTopic_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserNotificationSubscription` ADD CONSTRAINT `UserNotificationSubscription_topicId_fkey` FOREIGN KEY (`topicId`) REFERENCES `NotificationTopic`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileUploadSession` ADD CONSTRAINT `MobileUploadSession_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileUploadSession` ADD CONSTRAINT `MobileUploadSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileUploadSession` ADD CONSTRAINT `MobileUploadSession_uploadId_fkey` FOREIGN KEY (`uploadId`) REFERENCES `Upload`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaybackSession` ADD CONSTRAINT `PlaybackSession_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaybackSession` ADD CONSTRAINT `PlaybackSession_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PlaybackSession` ADD CONSTRAINT `PlaybackSession_trackId_fkey` FOREIGN KEY (`trackId`) REFERENCES `Track`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileOfflineOperation` ADD CONSTRAINT `MobileOfflineOperation_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileOfflineOperation` ADD CONSTRAINT `MobileOfflineOperation_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileApiRequestLog` ADD CONSTRAINT `MobileApiRequestLog_organizationId_fkey` FOREIGN KEY (`organizationId`) REFERENCES `Organization`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MobileApiRequestLog` ADD CONSTRAINT `MobileApiRequestLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
