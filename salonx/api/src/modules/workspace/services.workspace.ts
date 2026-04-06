import { prisma } from "../../lib/prisma.js";

export type WorkspacePayload = {
  id: string;
  salonId: string;
  userId: string;
  displayNameOverride: string | null;
  info: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type WorkspacePatchInput = {
  displayNameOverride?: string | null;
  info?: string | null;
};

function normalizeNullableString(v: string | null | undefined): string | null {
  if (v === undefined) return null;
  if (v === null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

export const workspaceService = {
  async getForMember(salonId: string, userId: string): Promise<WorkspacePayload | null> {
    return prisma.salonMemberWorkspace.findUnique({
      where: { salonId_userId: { salonId, userId } },
    });
  },

  async upsertForMember(
    salonId: string,
    userId: string,
    patch: WorkspacePatchInput,
  ): Promise<WorkspacePayload> {
    const displayNameOverride =
      patch.displayNameOverride !== undefined
        ? normalizeNullableString(patch.displayNameOverride)
        : undefined;
    const info = patch.info !== undefined ? normalizeNullableString(patch.info) : undefined;

    return prisma.salonMemberWorkspace.upsert({
      where: { salonId_userId: { salonId, userId } },
      create: {
        salonId,
        userId,
        displayNameOverride: displayNameOverride ?? null,
        info: info ?? null,
      },
      update: {
        ...(displayNameOverride !== undefined ? { displayNameOverride } : {}),
        ...(info !== undefined ? { info } : {}),
      },
    });
  },
};
