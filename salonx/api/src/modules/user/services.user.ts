import { prisma } from "../../lib/prisma.js";

/** Salons the user can access, with optional Better Auth `organizationId` link. */
export const userService = {
  async listSalonsForUser(userId: string) {
    const rows = await prisma.salonMembership.findMany({
      where: { userId },
      include: {
        salon: {
          select: {
            id: true,
            name: true,
            slug: true,
            timezone: true,
            organizationId: true,
            plan: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return rows.map((r) => ({
      salon: r.salon,
      role: r.role,
    }));
  },
};
