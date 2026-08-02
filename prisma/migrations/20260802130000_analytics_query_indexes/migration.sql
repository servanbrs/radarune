CREATE INDEX `PlaybackSession_organizationId_streamCountedAt_idx`
  ON `PlaybackSession` (`organizationId`, `streamCountedAt`);

CREATE INDEX `DiscoverEvent_organizationId_userId_createdAt_idx`
  ON `DiscoverEvent` (`organizationId`, `userId`, `createdAt`);
