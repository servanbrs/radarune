export type CreatorAccessInput = {
  systemRole?: string | null;
};

export type CreatorAccess = {
  isAdmin: boolean;
  isArtist: boolean;
  isOrganizer: boolean;
  canCreateReleases: boolean;
  canManageArtists: boolean;
  canViewAnalytics: boolean;
  canUseGrowthTools: boolean;
  showBecomeArtist: boolean;
};

function normalizeRole(role: string | null | undefined) {
  return role?.trim().toUpperCase() ?? "USER";
}

function getAccess(input: CreatorAccessInput): CreatorAccess {
  const role = normalizeRole(input.systemRole);

  const isAdmin = ["ADMIN", "SUPER_ADMIN"].includes(role);

  const isArtist = role === "ARTIST";

  const isOrganizer = [
    "ORGANIZER",
    "LABEL",
    "LABEL_MANAGER",
  ].includes(role);

  const canCreateReleases =
    isAdmin ||
    isArtist ||
    isOrganizer;

  const canManageArtists =
    isAdmin ||
    isOrganizer;

  // Performans verileri yalnızca doğrulanmış sanatçıların ve yöneticilerin
  // kendi kataloglarını görmesi için açılır.
  const canViewAnalytics = isAdmin || role === "MODERATOR" || isArtist || isOrganizer;

  const canUseGrowthTools =
    isAdmin ||
    isArtist ||
    isOrganizer;

  return {
    isAdmin,
    isArtist,
    isOrganizer,
    canCreateReleases,
    canManageArtists,
    canViewAnalytics,
    canUseGrowthTools,
    showBecomeArtist: !canCreateReleases,
  };
}

export const creatorAccessService = {
  getAccess,
};
