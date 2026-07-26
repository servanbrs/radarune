import "server-only";
import { redirect } from "next/navigation";

export type AppPermission =
  | "organization:view"
  | "organization:update"
  | "organization:members:view"
  | "organization:members:manage"
  | "label:view"
  | "label:create"
  | "label:update"
  | "label:delete"
  | "artist:view"
  | "artist:create"
  | "artist:update"
  | "artist:delete"
  | "releases:view"
  | "releases:create"
  | "releases:update"
  | "releases:review"
  | "releases:distribute"
  | "distribution:view"
  | "distribution:manage"
  | "analytics:view:own"
  | "analytics:view:label"
  | "analytics:view:all"
  | "royalties:view:own"
  | "royalties:view:label"
  | "royalties:view:all"
  | "royalties:generate"
  | "payouts:request:own"
  | "payouts:request:label"
  | "payouts:approve"
  | "payouts:cancel"
  | "statements:view:own"
  | "statements:view:label"
  | "statements:view:all"
  | "revenue-import:create"
  | "revenue-import:view"
  | "financial-settings:update"
  | "admin.dashboard.view"
  | "users.view"
  | "users.manage"
  | "artists.view"
  | "artists.review"
  | "providers.view"
  | "providers.manage"
  | "providers.credentials.manage"
  | "intelligence.use"
  | "intelligence.metadata.use"
  | "intelligence.artwork.use"
  | "intelligence.audio.use"
  | "intelligence.history.view"
  | "admin.intelligence.view"
  | "admin.intelligence.manage"
  | "admin.intelligence.providers.manage"
  | "admin.intelligence.credentials.manage"
  | "admin.intelligence.prompts.manage"
  | "admin.intelligence.rules.manage"
  | "admin.intelligence.duplicates.review"
  | "audit.view"
  | "settings.view"
  | "settings.manage"
  | "system-logs.view"
  | "tenant:view"
  | "tenant:manage"
  | "tenant:branding:manage"
  | "tenant:domains:manage"
  | "site-builder:view"
  | "site-builder:manage"
  | "homepage:manage"
  | "discover:manage"
  | "api-keys:view"
  | "api-keys:manage"
  | "webhooks:view"
  | "webhooks:manage"
  | "system:health:view"
  | "legal:view"
  | "legal:manage"
  | "integrations.youtube.view"
  | "integrations.youtube.manage"
  | "integrations.spotify.view"
  | "integrations.spotify.manage"
  | "imports.view"
  | "imports.manage"
  | "imports.review"
  | "imports.auto_approve.manage"
  | "player.settings.manage"
  | "applications.preview_links"
  | "applications.automation.view"
  | "applications.automation.manage"
  | "seo.view"
  | "seo.manage"
  | "seo.audit"
  | "branding.view"
  | "branding.manage"
  | "settings.security.manage"
  | "content.blog.manage"
  | "system.monitoring.view"
  | "system.production.manage"
  | "storage.view"
  | "storage.manage"
  | "storage.migrate"
  | "artist.profile.view"
  | "artist.profile.edit"
  | "artist.team.manage"
  | "users.deletion_requests.view"
  | "users.delete"
  | "email.settings.view"
  | "email.settings.manage"
  | "email.templates.manage"
  | "email.logs.view"
  | "auth.social.view"
  | "auth.social.manage"
  | "developer.apps.create"
  | "developer.apps.manage"
  | "developer.api_keys.create"
  | "developer.api_keys.revoke"
  | "developer.usage.view"
  | "developer.webhooks.manage"
  | "oauth.apps.manage"
  | "oauth.authorizations.revoke";

export type MembershipRole = "OWNER" | "ADMIN" | "MEMBER";
export type SystemRole = "USER" | "ARTIST" | "MODERATOR" | "ADMIN" | "SUPER_ADMIN";

const rolePermissions: Record<MembershipRole, readonly AppPermission[]> = {
  OWNER: [
    "admin.dashboard.view",
    "organization:view",
    "organization:update",
    "organization:members:view",
    "organization:members:manage",
    "label:view",
    "label:create",
    "label:update",
    "label:delete",
    "artist:view",
    "artist:create",
    "artist:update",
    "artist:delete",
    "releases:view",
    "releases:create",
    "releases:update",
    "releases:review",
    "releases:distribute",
    "distribution:view",
    "distribution:manage",
    "analytics:view:label",
    "royalties:view:label",
    "royalties:generate",
    "payouts:request:label",
    "statements:view:label",
    "revenue-import:create",
    "revenue-import:view",
    "tenant:view",
    "tenant:manage",
    "tenant:branding:manage",
    "tenant:domains:manage",
    "site-builder:view",
    "site-builder:manage",
    "homepage:manage",
    "discover:manage",
    "auth.social.view",
    "auth.social.manage",
    "api-keys:view",
    "api-keys:manage",
    "webhooks:view",
    "webhooks:manage",
    "system:health:view",
    "legal:view",
    "legal:manage",
    "storage.view",
    "storage.manage",
    "artist.profile.view",
    "artist.profile.edit",
    "artist.team.manage",
    "developer.apps.create",
    "developer.apps.manage",
    "developer.api_keys.create",
    "developer.api_keys.revoke",
    "developer.usage.view",
    "developer.webhooks.manage",
    "oauth.apps.manage",
    "oauth.authorizations.revoke",
  ],
  ADMIN: [
    "admin.dashboard.view",
    "organization:view",
    "organization:members:view",
    "label:view",
    "label:create",
    "label:update",
    "artist:view",
    "artist:create",
    "artist:update",
    "releases:view",
    "releases:create",
    "releases:update",
    "releases:review",
    "distribution:view",
    "analytics:view:label",
    "royalties:view:label",
    "royalties:generate",
    "payouts:request:label",
    "statements:view:label",
    "revenue-import:view",
    "tenant:view",
    "tenant:branding:manage",
    "tenant:domains:manage",
    "site-builder:view",
    "site-builder:manage",
    "homepage:manage",
    "discover:manage",
    "api-keys:view",
    "api-keys:manage",
    "webhooks:view",
    "webhooks:manage",
    "system:health:view",
    "legal:view",
    "legal:manage",
    "storage.view",
    "storage.manage",
    "users.deletion_requests.view",
    "email.settings.view",
    "email.settings.manage",
    "email.templates.manage",
    "email.logs.view",
    "auth.social.view",
    "auth.social.manage",
    "developer.apps.manage",
    "developer.api_keys.revoke",
    "developer.usage.view",
    "developer.webhooks.manage",
    "oauth.authorizations.revoke",
  ],
  MEMBER: [
    "organization:view",
    "label:view",
    "artist:view",
    "releases:view",
    "releases:create",
    "releases:update",
    "distribution:view",
    "analytics:view:own",
    "royalties:view:own",
    "payouts:request:own",
    "statements:view:own",
  ],
};

const systemRolePermissions: Record<SystemRole, readonly AppPermission[]> = {
  USER: [],
  ARTIST: [
    "releases:view",
    "releases:create",
    "releases:update",
    "intelligence.use",
    "intelligence.metadata.use",
    "intelligence.artwork.use",
    "intelligence.audio.use",
    "intelligence.history.view",
    "analytics:view:own",
    "royalties:view:own",
    "payouts:request:own",
    "statements:view:own",
  ],
  MODERATOR: [
    "admin.dashboard.view",
    "artists.view",
    "artists.review",
    "providers.view",
    "admin.intelligence.view",
    "admin.intelligence.duplicates.review",
    "releases:view",
    "releases:review",
    "distribution:view",
    "analytics:view:all",
    "royalties:view:all",
    "revenue-import:view",
    "statements:view:all",
    "audit.view",
    "system-logs.view",
    "storage.view",
    "storage.manage",
    "users.deletion_requests.view",
    "email.settings.view",
    "email.settings.manage",
    "email.templates.manage",
    "email.logs.view",
    "auth.social.view",
    "auth.social.manage",
    "developer.apps.manage",
    "developer.api_keys.revoke",
    "developer.usage.view",
    "developer.webhooks.manage",
    "oauth.authorizations.revoke",
    "tenant:view",
    "site-builder:view",
    "homepage:manage",
    "discover:manage",
    "api-keys:view",
    "webhooks:view",
    "system:health:view",
    "legal:view",
    "imports.view",
    "imports.review",
    "applications.preview_links",
    "applications.automation.view",
  ],
  ADMIN: [
    "admin.dashboard.view",
    "users.view",
    "users.manage",
    "artists.view",
    "artists.review",
    "providers.view",
    "providers.manage",
    "admin.intelligence.view",
    "admin.intelligence.manage",
    "admin.intelligence.rules.manage",
    "admin.intelligence.duplicates.review",
    "releases:view",
    "releases:review",
    "releases:distribute",
    "distribution:view",
    "distribution:manage",
    "analytics:view:all",
    "royalties:view:all",
    "royalties:generate",
    "payouts:approve",
    "payouts:cancel",
    "revenue-import:create",
    "revenue-import:view",
    "statements:view:all",
    "audit.view",
    "settings.view",
    "system-logs.view",
    "tenant:view",
    "tenant:manage",
    "tenant:branding:manage",
    "tenant:domains:manage",
    "site-builder:view",
    "site-builder:manage",
    "homepage:manage",
    "discover:manage",
    "api-keys:view",
    "api-keys:manage",
    "webhooks:view",
    "webhooks:manage",
    "system:health:view",
    "legal:view",
    "legal:manage",
    "integrations.youtube.view",
    "integrations.spotify.view",
    "imports.view",
    "imports.manage",
    "imports.review",
    "applications.preview_links",
    "applications.automation.view",
    "seo.view",
    "seo.manage",
    "branding.view",
    "branding.manage",
    "system.monitoring.view",
    "users.delete",
  ],
  SUPER_ADMIN: [
    "admin.dashboard.view",
    "users.view",
    "users.manage",
    "artists.view",
    "artists.review",
    "providers.view",
    "providers.manage",
    "providers.credentials.manage",
    "admin.intelligence.view",
    "admin.intelligence.manage",
    "admin.intelligence.providers.manage",
    "admin.intelligence.credentials.manage",
    "admin.intelligence.prompts.manage",
    "admin.intelligence.rules.manage",
    "admin.intelligence.duplicates.review",
    "releases:view",
    "releases:review",
    "releases:distribute",
    "distribution:view",
    "distribution:manage",
    "analytics:view:all",
    "royalties:view:all",
    "royalties:generate",
    "payouts:approve",
    "payouts:cancel",
    "revenue-import:create",
    "revenue-import:view",
    "statements:view:all",
    "financial-settings:update",
    "audit.view",
    "settings.view",
    "settings.manage",
    "system-logs.view",
    "tenant:view",
    "tenant:manage",
    "tenant:branding:manage",
    "tenant:domains:manage",
    "site-builder:view",
    "site-builder:manage",
    "homepage:manage",
    "discover:manage",
    "api-keys:view",
    "api-keys:manage",
    "webhooks:view",
    "webhooks:manage",
    "system:health:view",
    "legal:view",
    "legal:manage",
    "integrations.youtube.view",
    "integrations.youtube.manage",
    "integrations.spotify.view",
    "integrations.spotify.manage",
    "imports.view",
    "imports.manage",
    "imports.review",
    "imports.auto_approve.manage",
    "player.settings.manage",
    "applications.preview_links",
    "applications.automation.view",
    "applications.automation.manage",
    "seo.view",
    "seo.manage",
    "seo.audit",
    "branding.view",
    "branding.manage",
    "settings.security.manage",
    "content.blog.manage",
    "system.monitoring.view",
    "system.production.manage",
    "storage.view",
    "storage.manage",
    "storage.migrate",
    "users.deletion_requests.view",
    "users.delete",
    "email.settings.view",
    "email.settings.manage",
    "email.templates.manage",
    "email.logs.view",
    "auth.social.view",
    "auth.social.manage",
    "developer.apps.create",
    "developer.apps.manage",
    "developer.api_keys.create",
    "developer.api_keys.revoke",
    "developer.usage.view",
    "developer.webhooks.manage",
    "oauth.apps.manage",
    "oauth.authorizations.revoke",
  ],
};

class RbacService {
  hasPermission(role: MembershipRole, permission: AppPermission) {
    return rolePermissions[role].includes(permission);
  }

  hasSystemPermission(role: SystemRole, permission: AppPermission) {
    return systemRolePermissions[role].includes(permission);
  }

  hasEffectivePermission(args: {
    membershipRole: MembershipRole;
    permission: AppPermission;
    systemRole: SystemRole;
  }) {
    return (
      this.hasPermission(args.membershipRole, args.permission) ||
      this.hasSystemPermission(args.systemRole, args.permission)
    );
  }

  assertPermission(role: MembershipRole, permission: AppPermission) {
    if (!this.hasPermission(role, permission)) {
      throw new Error("You do not have permission to perform this action.");
    }
  }

  assertEffectivePermission(args: {
    membershipRole: MembershipRole;
    permission: AppPermission;
    systemRole: SystemRole;
  }) {
    if (!this.hasEffectivePermission(args)) {
      throw new Error("You do not have permission to perform this action.");
    }
  }

  redirectIfMissingPermission(role: MembershipRole, permission: AppPermission) {
    if (!this.hasPermission(role, permission)) {
      redirect("/dashboard");
    }
  }

  redirectIfMissingEffectivePermission(args: {
    membershipRole: MembershipRole;
    permission: AppPermission;
    systemRole: SystemRole;
  }) {
    if (!this.hasEffectivePermission(args)) {
      redirect("/dashboard");
    }
  }

  listPermissions(role: MembershipRole) {
    return rolePermissions[role];
  }

  listEffectivePermissions(membershipRole: MembershipRole, systemRole: SystemRole) {
    return Array.from(
      new Set([...rolePermissions[membershipRole], ...systemRolePermissions[systemRole]]),
    );
  }
}

export const rbacService = new RbacService();
