import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";
import { HttpError } from "../../middleware/http-error.js";
import { normalizeBusinessPhoneE164 } from "../../lib/phone-business.js";

export type BusinessPatchInput = {
  legalName?: string | null;
  taxId?: string | null;
  phone?: string | null;
  email?: string | null;
  websiteUrl?: string | null;
  addressLine1?: string | null;
  addressLine2?: string | null;
  city?: string | null;
  region?: string | null;
  postalCode?: string | null;
  country?: string | null;
};

function normalizeNullableString(v: string | null | undefined): string | null {
  if (v === undefined) return null;
  if (v === null) return null;
  const t = v.trim();
  return t.length === 0 ? null : t;
}

function normalizeEmail(v: string | null | undefined): string | null {
  const n = normalizeNullableString(v);
  return n === null ? null : n.toLowerCase();
}

async function assertBusinessContactGloballyUnique(
  salonId: string,
  email: string | null,
  phone: string | null,
) {
  if (email) {
    const conflict = await prisma.salonBusinessProfile.findFirst({
      where: {
        salonId: { not: salonId },
        email,
      },
    });
    if (conflict) {
      throw new HttpError(
        409,
        "BUSINESS_EMAIL_IN_USE",
        "This business email is already used by another salon.",
      );
    }
  }

  if (phone) {
    const conflict = await prisma.salonBusinessProfile.findFirst({
      where: {
        salonId: { not: salonId },
        phone,
      },
    });
    if (conflict) {
      throw new HttpError(
        409,
        "BUSINESS_PHONE_IN_USE",
        "This business phone is already used by another salon.",
      );
    }
  }
}

export const businessService = {
  async getForSalon(salonId: string) {
    return prisma.salonBusinessProfile.findUnique({
      where: { salonId },
    });
  },

  async upsertForSalon(salonId: string, patch: BusinessPatchInput) {
    const existing = await prisma.salonBusinessProfile.findUnique({ where: { salonId } });

    const effectiveEmail =
      patch.email === undefined ? (existing?.email ?? null) : normalizeEmail(patch.email);

    let effectivePhone: string | null;
    if (patch.phone === undefined) {
      effectivePhone = existing?.phone ?? null;
    } else if (patch.phone === null) {
      effectivePhone = null;
    } else {
      const raw = normalizeNullableString(patch.phone);
      effectivePhone = raw === null ? null : normalizeBusinessPhoneE164(raw);
    }

    await assertBusinessContactGloballyUnique(salonId, effectiveEmail, effectivePhone);

    const data: Prisma.SalonBusinessProfileUncheckedUpdateInput = {};

    if (patch.legalName !== undefined) data.legalName = normalizeNullableString(patch.legalName);
    if (patch.taxId !== undefined) data.taxId = normalizeNullableString(patch.taxId);
    if (patch.phone !== undefined) data.phone = effectivePhone;
    if (patch.email !== undefined) data.email = effectiveEmail;
    if (patch.websiteUrl !== undefined) data.websiteUrl = normalizeNullableString(patch.websiteUrl);
    if (patch.addressLine1 !== undefined)
      data.addressLine1 = normalizeNullableString(patch.addressLine1);
    if (patch.addressLine2 !== undefined)
      data.addressLine2 = normalizeNullableString(patch.addressLine2);
    if (patch.city !== undefined) data.city = normalizeNullableString(patch.city);
    if (patch.region !== undefined) data.region = normalizeNullableString(patch.region);
    if (patch.postalCode !== undefined) data.postalCode = normalizeNullableString(patch.postalCode);
    if (patch.country !== undefined) data.country = normalizeNullableString(patch.country);

    const createData: Prisma.SalonBusinessProfileUncheckedCreateInput = {
      salonId,
      legalName: patch.legalName !== undefined ? normalizeNullableString(patch.legalName) : null,
      taxId: patch.taxId !== undefined ? normalizeNullableString(patch.taxId) : null,
      phone: patch.phone !== undefined ? effectivePhone : null,
      email: patch.email !== undefined ? effectiveEmail : null,
      websiteUrl: patch.websiteUrl !== undefined ? normalizeNullableString(patch.websiteUrl) : null,
      addressLine1:
        patch.addressLine1 !== undefined ? normalizeNullableString(patch.addressLine1) : null,
      addressLine2:
        patch.addressLine2 !== undefined ? normalizeNullableString(patch.addressLine2) : null,
      city: patch.city !== undefined ? normalizeNullableString(patch.city) : null,
      region: patch.region !== undefined ? normalizeNullableString(patch.region) : null,
      postalCode: patch.postalCode !== undefined ? normalizeNullableString(patch.postalCode) : null,
      country: patch.country !== undefined ? normalizeNullableString(patch.country) : null,
    };

    if (Object.keys(data).length === 0) {
      if (existing) return existing;
      return prisma.salonBusinessProfile.create({ data: createData });
    }

    try {
      return await prisma.salonBusinessProfile.upsert({
        where: { salonId },
        create: createData,
        update: data,
      });
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code;
      if (code === "P2002") {
        throw new HttpError(
          409,
          "BUSINESS_CONTACT_CONFLICT",
          "Business email or phone is already in use by another salon.",
        );
      }
      throw e;
    }
  },
};
