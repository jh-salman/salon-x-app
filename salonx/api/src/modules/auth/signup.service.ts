import { hashPassword } from "better-auth/crypto";
import { z } from "zod";
import { prisma } from "../../lib/prisma.js";
import { isUsaE164 } from "../../lib/phone-us.js";
import { HttpError } from "../../middleware/http-error.js";

const signupBodySchema = z.object({
  email: z.string().min(1),
  password: z.string().min(8).max(128),
  phoneNumber: z.string().min(1),
  name: z.string().max(200).optional(),
});

export type SignupBody = z.infer<typeof signupBodySchema>;

/**
 * Register email + password + US phone. No session — user must complete OTP (`verify`) to sign in.
 */
export async function signupWithEmailPasswordPhone(
  raw: unknown,
): Promise<{ user: { id: string; email: string; name: string; phoneNumber: string | null; phoneNumberVerified: boolean } }> {
  const parsed = signupBodySchema.safeParse(raw);
  if (!parsed.success) {
    throw new HttpError(400, "VALIDATION_ERROR", parsed.error.message);
  }
  const { email: emailRaw, password, phoneNumber: phoneRaw, name: nameRaw } =
    parsed.data;
  const email = emailRaw.trim().toLowerCase();
  const phoneNumber = phoneRaw.trim();

  if (!z.email().safeParse(email).success) {
    throw new HttpError(400, "INVALID_EMAIL", "Invalid email address.");
  }
  if (!isUsaE164(phoneNumber)) {
    throw new HttpError(400, "INVALID_PHONE", "Use a valid US E.164 phone number.");
  }

  const name =
    nameRaw?.trim() ||
    (email.includes("@") ? email.split("@")[0]! : "User");

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    throw new HttpError(409, "EMAIL_ALREADY_EXISTS", "This email is already registered.");
  }

  const existingPhone = await prisma.user.findFirst({
    where: { phoneNumber },
  });
  if (existingPhone) {
    throw new HttpError(409, "PHONE_ALREADY_EXISTS", "This phone number is already registered.");
  }

  const passwordHash = await hashPassword(password);

  const user = await prisma.$transaction(async (tx) => {
    const u = await tx.user.create({
      data: {
        email,
        name,
        phoneNumber,
        phoneNumberVerified: false,
        emailVerified: false,
      },
    });
    await tx.account.create({
      data: {
        accountId: u.id,
        userId: u.id,
        providerId: "credential",
        password: passwordHash,
      },
    });
    return u;
  });

  return {
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      phoneNumber: user.phoneNumber,
      phoneNumberVerified: user.phoneNumberVerified,
    },
  };
}
