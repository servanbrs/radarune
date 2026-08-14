import "server-only";
import { prisma } from "@/server/prisma/prisma";
import type { DatabaseClient } from "@/server/prisma/database-client";
import type { AdminPlaylistUpdateInput, GlobalPlaylistCreateInput, GlobalPlaylistUpdateInput } from "@/features/growth/schemas/growth.schema";

export class GlobalPlaylistRepository {
  async list() {
    return prisma.playlist.findMany({
      where: { organizationId: null, public: true },
      orderBy: [{ featured: "desc" }, { updatedAt: "desc" }],
      include: {
        tracks: { orderBy: { sortOrder: "asc" }, include: { track: { select: { id: true, title: true, trackNumber: true, artists: { orderBy: { sortOrder: "asc" }, take: 1, select: { artist: { select: { id: true, name: true, slug: true } } } } }, }, release: { select: { title: true } } } },
        _count: { select: { likes: true } },
      },
    });
  }

  async findById(id: string, client: DatabaseClient = prisma) {
    return client.playlist.findFirst({
      where: { id, organizationId: null },
      select: { id: true, name: true, slug: true, description: true, featured: true, public: true },
    });
  }

  async listLiveTracks(organizationId: string) {
    return prisma.track.findMany({
      where: { organizationId, release: { status: { in: ["DISTRIBUTED", "LIVE"] } } },
      orderBy: [{ release: { liveAt: "desc" } }, { trackNumber: "asc" }],
      select: { id: true, title: true, trackNumber: true, release: { select: { id: true, title: true } } },
      take: 500,
    });
  }

  async listUserPlaylists(organizationId: string) {
    return prisma.playlist.findMany({
      where: { organizationId: organizationId },
      orderBy: { updatedAt: "desc" },
      include: {
        ownerUser: { select: { id: true, name: true, email: true } },
        tracks: { orderBy: { sortOrder: "asc" }, include: { track: { select: { id: true, title: true, trackNumber: true } }, release: { select: { title: true } } } },
      },
    });
  }

  async findUserPlaylist(id: string, organizationId: string, client: DatabaseClient = prisma) {
    return client.playlist.findFirst({ where: { id, organizationId }, select: { id: true, name: true, ownerUserId: true } });
  }

  async updateUserPlaylist(id: string, organizationId: string, input: AdminPlaylistUpdateInput, client: DatabaseClient = prisma) {
    return client.playlist.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.public !== undefined ? { public: input.public } : {}),
      },
      select: { id: true, name: true, slug: true, public: true },
    });
  }

  async addTrackToUserPlaylist(playlistId: string, trackId: string, organizationId: string, client: DatabaseClient = prisma) {
    const playlist = await this.findUserPlaylist(playlistId, organizationId, client);
    if (!playlist) throw new Error("Kullanıcı playlisti bulunamadı.");
    const track = await client.track.findFirst({ where: { id: trackId, organizationId, release: { status: { in: ["DISTRIBUTED", "LIVE"] } } }, select: { id: true, releaseId: true } });
    if (!track) throw new Error("Yalnızca canlı parçalar eklenebilir.");
    const existing = await client.playlistTrack.findUnique({ where: { playlistId_trackId: { playlistId, trackId } }, select: { id: true } });
    if (existing) throw new Error("Bu parça playlistte zaten bulunuyor.");
    const last = await client.playlistTrack.aggregate({ where: { playlistId }, _max: { sortOrder: true } });
    return client.playlistTrack.create({ data: { playlistId, trackId, releaseId: track.releaseId, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true, trackId: true } });
  }

  async removeTrackFromUserPlaylist(playlistId: string, trackId: string, organizationId: string, client: DatabaseClient = prisma) {
    const playlist = await this.findUserPlaylist(playlistId, organizationId, client);
    if (!playlist) throw new Error("Kullanıcı playlisti bulunamadı.");
    await client.playlistTrack.deleteMany({ where: { playlistId, trackId } });
    return { playlistId, trackId };
  }

  async create(input: GlobalPlaylistCreateInput & { ownerUserId: string }, client: DatabaseClient = prisma) {
    return client.playlist.create({
      data: {
        ownerUserId: input.ownerUserId,
        organizationId: null,
        name: input.name,
        slug: input.slug,
        description: input.description ?? null,
        public: true,
        featured: input.featured,
      },
      select: { id: true, name: true, slug: true },
    });
  }

  async update(id: string, input: GlobalPlaylistUpdateInput, client: DatabaseClient = prisma) {
    return client.playlist.update({
      where: { id },
      data: {
        ...(input.name !== undefined ? { name: input.name } : {}),
        ...(input.slug !== undefined ? { slug: input.slug } : {}),
        ...(input.description !== undefined ? { description: input.description ?? null } : {}),
        ...(input.featured !== undefined ? { featured: input.featured } : {}),
        public: true,
      },
      select: { id: true, name: true, slug: true, featured: true },
    });
  }

  async delete(id: string, client: DatabaseClient = prisma) {
    return client.playlist.delete({ where: { id }, select: { id: true, name: true } });
  }

  async addTrack(playlistId: string, trackId: string, organizationId: string, client: DatabaseClient = prisma) {
    const track = await client.track.findFirst({ where: { id: trackId, organizationId, release: { status: { in: ["DISTRIBUTED", "LIVE"] } } }, select: { id: true, title: true, releaseId: true } });
    if (!track) throw new Error("Yalnızca bu organizasyona ait canlı parçalar eklenebilir.");
    const playlist = await this.findById(playlistId, client);
    if (!playlist) throw new Error("Global playlist bulunamadı.");
    const existing = await client.playlistTrack.findUnique({ where: { playlistId_trackId: { playlistId, trackId } }, select: { id: true } });
    if (existing) throw new Error("Bu parça playlistte zaten bulunuyor.");
    const last = await client.playlistTrack.aggregate({ where: { playlistId }, _max: { sortOrder: true } });
    return client.playlistTrack.create({ data: { playlistId, trackId, releaseId: track.releaseId, sortOrder: (last._max.sortOrder ?? -1) + 1 }, select: { id: true, trackId: true } });
  }

  async removeTrack(playlistId: string, trackId: string, client: DatabaseClient = prisma) {
    const playlist = await this.findById(playlistId, client);
    if (!playlist) throw new Error("Global playlist bulunamadı.");
    await client.playlistTrack.deleteMany({ where: { playlistId, trackId } });
    return { playlistId, trackId };
  }
}

export const globalPlaylistRepository = new GlobalPlaylistRepository();
