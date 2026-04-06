import type { SalonMembershipRole } from "@prisma/client";
import { prisma } from "./prisma.js";

/** Map Better Auth org roles (`owner` / `admin` / `member`) → app `SalonMembershipRole`. */
export function mapBaRoleToSalonRole(baRole: string | null | undefined): SalonMembershipRole {
  const r = (baRole ?? "member").split(",")[0]?.trim().toLowerCase() ?? "member";
  if (r === "owner") return "OWNER";
  if (r === "admin") return "ADMIN";
  return "STYLIST";
}

export async function syncSalonAfterOrganizationCreated(data: {
  organization: { id: string; name: string; slug: string };
  user: { id: string };
}) {
  const { organization, user } = data;

  let salon = await prisma.salon.findUnique({
    where: { organizationId: organization.id },
  });

  if (!salon) {
    salon = await prisma.salon.create({
      data: {
        name: organization.name,
        slug: organization.slug,
        organizationId: organization.id,
      },
    });
  }

  await prisma.salonMembership.upsert({
    where: { salonId_userId: { salonId: salon.id, userId: user.id } },
    create: { salonId: salon.id, userId: user.id, role: "OWNER" },
    update: { role: "OWNER" },
  });
}

export async function syncSalonMembershipAfterInvitationAccepted(data: {
  invitation: { organizationId: string; role: string | null };
  user: { id: string };
}) {
  const { invitation, user } = data;

  const salon = await prisma.salon.findUnique({
    where: { organizationId: invitation.organizationId },
  });
  if (!salon) return;

  const role = mapBaRoleToSalonRole(invitation.role);

  await prisma.salonMembership.upsert({
    where: { salonId_userId: { salonId: salon.id, userId: user.id } },
    create: { salonId: salon.id, userId: user.id, role },
    update: { role },
  });
}
