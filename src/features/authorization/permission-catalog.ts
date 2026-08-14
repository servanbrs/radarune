import type { AppPermission, SystemRole } from "./server/rbac";

export const systemRoles: SystemRole[] = ["USER", "ARTIST", "MODERATOR", "ADMIN", "SUPER_ADMIN"];

export const permissionGroups: Array<{ name: string; permissions: AppPermission[] }> = [
  {
    name: "Kontrol ve kullanıcılar",
    permissions: ["admin.dashboard.view", "users.view", "users.manage", "users.delete", "audit.view"],
  },
  {
    name: "Sanatçı, yayın ve dağıtım",
    permissions: [
      "artists.view", "artists.review", "releases:view", "releases:review", "releases:distribute",
      "distribution:view", "distribution:manage", "playlists:view", "playlists:manage", "artist.profile.view", "artist.profile.edit",
    ],
  },
  {
    name: "Analiz ve finans",
    permissions: [
      "analytics:view:own", "analytics:view:all", "royalties:view:own", "royalties:view:all",
      "royalties:generate", "payouts:approve", "statements:view:all", "revenue-import:view",
    ],
  },
  {
    name: "İçerik ve yapay zekâ",
    permissions: [
      "admin.intelligence.view", "admin.intelligence.manage", "admin.intelligence.duplicates.review",
      "intelligence.use", "intelligence.metadata.use", "intelligence.artwork.use", "content.blog.manage",
    ],
  },
  {
    name: "Entegrasyonlar ve geliştirici",
    permissions: [
      "providers.view", "providers.manage", "integrations.youtube.view", "integrations.spotify.view",
      "webhooks:view", "webhooks:manage", "api-keys:view", "api-keys:manage", "auth.social.view",
      "auth.social.manage", "developer.apps.manage", "developer.webhooks.manage",
    ],
  },
  {
    name: "Site ve sistem",
    permissions: [
      "settings.view", "settings.manage", "tenant:view", "tenant:manage", "site-builder:view",
      "site-builder:manage", "homepage:manage", "discover:manage", "seo.view", "seo.manage",
      "branding.view", "branding.manage", "system:health:view", "system.monitoring.view",
      "email.settings.view", "email.settings.manage", "storage.view", "storage.manage",
    ],
  },
];

export const permissionLabels: Partial<Record<AppPermission, string>> = {
  "admin.dashboard.view": "Kontrol merkezini görüntüleme",
  "users.view": "Kullanıcıları görüntüleme", "users.manage": "Kullanıcı rolü ve durumunu yönetme", "users.delete": "Kullanıcı silme",
  "artists.view": "Sanatçıları görüntüleme", "artists.review": "Sanatçı başvurularını inceleme",
  "releases:view": "Yayınları görüntüleme", "releases:review": "Yayınları inceleme", "releases:distribute": "Dağıtım başlatma",
  "distribution:view": "Dağıtımları görüntüleme", "distribution:manage": "Dağıtımları yönetme",
  "playlists:view": "Listeleri görüntüleme", "playlists:manage": "Listeleri yönetme",
  "analytics:view:own": "Kendi analizlerini görüntüleme", "analytics:view:all": "Analizleri görüntüleme",
  "royalties:view:own": "Kendi teliflerini görüntüleme", "royalties:view:all": "Tüm telifleri görüntüleme",
  "royalties:generate": "Telif raporu oluşturma", "payouts:approve": "Ödemeleri onaylama", "statements:view:all": "Tüm ekstreleri görüntüleme",
  "revenue-import:view": "Gelir içe aktarımlarını görüntüleme", "audit.view": "Denetim kayıtlarını görüntüleme",
  "admin.intelligence.view": "Yapay zekâ modülünü görüntüleme", "admin.intelligence.manage": "Yapay zekâ ayarlarını yönetme",
  "admin.intelligence.duplicates.review": "Benzer içerikleri inceleme", "intelligence.use": "Yapay zekâ araçlarını kullanma",
  "intelligence.metadata.use": "Metadata önerisi alma", "intelligence.artwork.use": "Kapak analizi kullanma", "content.blog.manage": "Blog içeriği yönetme",
  "providers.view": "Sağlayıcıları görüntüleme", "providers.manage": "Sağlayıcıları yönetme", "integrations.youtube.view": "YouTube entegrasyonu",
  "integrations.spotify.view": "Spotify entegrasyonu", "webhooks:view": "Webhookları görüntüleme", "webhooks:manage": "Webhookları yönetme",
  "api-keys:view": "API anahtarlarını görüntüleme", "api-keys:manage": "API anahtarlarını yönetme", "auth.social.view": "Sosyal girişleri görüntüleme",
  "auth.social.manage": "Sosyal girişleri yönetme", "developer.apps.manage": "Geliştirici uygulamalarını yönetme", "developer.webhooks.manage": "Geliştirici webhooklarını yönetme",
  "settings.view": "Ayarları görüntüleme", "settings.manage": "Ayarları yönetme", "tenant:view": "Organizasyonu görüntüleme", "tenant:manage": "Organizasyonu yönetme",
  "site-builder:view": "Site oluşturucuyu görüntüleme", "site-builder:manage": "Site oluşturucuyu yönetme", "homepage:manage": "Ana sayfayı yönetme",
  "discover:manage": "Keşfet sayfasını yönetme", "seo.view": "SEO ayarlarını görüntüleme", "seo.manage": "SEO ayarlarını yönetme",
  "branding.view": "Marka ayarlarını görüntüleme", "branding.manage": "Marka ayarlarını yönetme", "system:health:view": "Sistem sağlığını görüntüleme",
  "system.monitoring.view": "Sistem izlemeyi görüntüleme", "email.settings.view": "E-posta ayarlarını görüntüleme", "email.settings.manage": "E-posta ayarlarını yönetme",
  "storage.view": "Depolamayı görüntüleme", "storage.manage": "Depolamayı yönetme", "artist.profile.view": "Sanatçı profillerini görüntüleme",
  "artist.profile.edit": "Sanatçı profillerini düzenleme",
};

export function getPermissionLabel(permission: AppPermission) {
  return permissionLabels[permission] ?? permission;
}
