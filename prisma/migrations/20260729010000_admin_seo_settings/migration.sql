-- MySQL/MariaDB stores Prisma enums as column-level ENUMs (there is no
-- PostgreSQL-style ALTER TYPE command). Keep the existing values and append
-- the SEO settings so deployments work on the production database.
ALTER TABLE `AdminSetting`
  MODIFY COLUMN `key` ENUM(
    'PLATFORM_NAME',
    'LOGO_URL',
    'SUPPORT_EMAIL',
    'SEO_TITLE',
    'SEO_DESCRIPTION',
    'DEFAULT_DISTRIBUTION_PROVIDER',
    'AUTO_DISTRIBUTION_ENABLED',
    'MAX_AUDIO_FILE_SIZE_BYTES',
    'MAX_ARTWORK_FILE_SIZE_BYTES',
    'MIN_ARTWORK_RESOLUTION',
    'USER_REGISTRATION_ENABLED',
    'ARTIST_APPLICATIONS_ENABLED',
    'EMAIL_VERIFICATION_REQUIRED',
    'MAINTENANCE_MODE_ENABLED',
    'MAINTENANCE_MESSAGE'
  ) NOT NULL;
