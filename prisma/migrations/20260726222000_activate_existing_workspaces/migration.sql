-- Workspaces created before the onboarding state fix must be usable after deployment.
UPDATE `Organization` AS organization
SET
    `tenantStatus` = 'ACTIVE',
    `onboardingCompletedAt` = COALESCE(`onboardingCompletedAt`, `createdAt`)
WHERE `tenantStatus` = 'PENDING_SETUP'
  AND EXISTS (
    SELECT 1
    FROM `OrganizationMembership` AS membership
    WHERE membership.`organizationId` = organization.`id`
      AND membership.`role` = 'OWNER'
      AND membership.`status` = 'ACTIVE'
  );

UPDATE `InstallationState` AS installation
INNER JOIN `Organization` AS organization
  ON organization.`id` = installation.`organizationId`
SET
    installation.`status` = 'COMPLETED',
    installation.`currentStep` = 'COMPLETED',
    installation.`completedAt` = COALESCE(installation.`completedAt`, CURRENT_TIMESTAMP(3)),
    installation.`lockedAt` = COALESCE(installation.`lockedAt`, CURRENT_TIMESTAMP(3))
WHERE organization.`tenantStatus` = 'ACTIVE'
  AND installation.`status` IN ('NOT_STARTED', 'IN_PROGRESS');
