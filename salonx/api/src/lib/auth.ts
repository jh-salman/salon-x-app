import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { bearer, organization, phoneNumber } from "better-auth/plugins";
import type { GenericEndpointContext } from "@better-auth/core";
import { APIError } from "@better-auth/core/error";
import { prisma } from "./prisma.js";
import { env } from "../config/env.js";
import { isUsaE164 } from "./phone-us.js";
import {
  syncSalonAfterOrganizationCreated,
  syncSalonMembershipAfterInvitationAccepted,
} from "./auth-org-sync.js";

/** Minimum seconds between send-otp calls per phone (server + app should match). */
const OTP_RESEND_GAP_MS = 60_000;

/** CORS app origins + API origin (Postman/curl often send `Origin: <BETTER_AUTH_URL>`). */
const trustedOrigins = [
  ...new Set([
    ...env.CORS_ORIGINS,
    new URL(env.BETTER_AUTH_URL).origin,
  ]),
];

/**
 * Multi-tenant: `Salon` + `SalonMembership` synced from Better Auth `organization` (hooks in `auth-org-sync.ts`).
 * Sign-up: POST /api/v1/auth/signup (email + password + phone). Sign-in: phone OTP only (password stored, not used for session).
 */
export const auth = betterAuth({
  database: prismaAdapter(prisma, { provider: "postgresql" }),
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  trustedOrigins,
  emailAndPassword: {
    enabled: false,
  },
  plugins: [
    bearer(),
    organization({
      sendInvitationEmail: async (data) => {
        if (env.NODE_ENV === "development") {
          console.log(
            `[auth:org-invite] id=${data.id} email=${data.email} org=${data.organization.name} — POST /api/auth/organization/accept-invitation with { invitationId }`,
          );
        }
      },
      organizationHooks: {
        afterCreateOrganization: async ({ organization, user }) => {
          await syncSalonAfterOrganizationCreated({ organization, user });
        },
        afterAcceptInvitation: async ({ invitation, user }) => {
          await syncSalonMembershipAfterInvitationAccepted({
            invitation: {
              organizationId: invitation.organizationId,
              role: invitation.role,
            },
            user,
          });
        },
      },
    }),
    phoneNumber({
      otpLength: 6,
      expiresIn: 300,
      allowedAttempts: 5,
      phoneNumberValidator: async (phoneNumber) => isUsaE164(phoneNumber),
      sendOTP: async ({ phoneNumber, code }, ctx) => {
        if (!ctx?.context) {
          throw APIError.from("INTERNAL_SERVER_ERROR", {
            code: "AUTH_CONTEXT_MISSING",
            message: "Missing auth context",
          });
        }
        const registered = await prisma.user.findFirst({
          where: { phoneNumber },
        });
        if (!registered) {
          await ctx.context.internalAdapter.deleteVerificationByIdentifier(
            phoneNumber,
          );
          throw APIError.from("BAD_REQUEST", {
            code: "PHONE_NOT_REGISTERED",
            message: "Sign up first at POST /api/v1/auth/signup before requesting an OTP.",
          });
        }
        const last = registered.lastOtpSentAt;
        if (last) {
          const elapsed = Date.now() - last.getTime();
          if (elapsed < OTP_RESEND_GAP_MS) {
            const waitSec = Math.ceil((OTP_RESEND_GAP_MS - elapsed) / 1000);
            await ctx.context.internalAdapter.deleteVerificationByIdentifier(
              phoneNumber,
            );
            throw APIError.from("TOO_MANY_REQUESTS", {
              code: "OTP_RESEND_TOO_SOON",
              message: `Wait ${waitSec} seconds before requesting a new code.`,
            });
          }
        }
        if (env.NODE_ENV === "development") {
          console.log(
            `[auth:otp] POST /api/auth/phone-number/send-otp → phone=${phoneNumber} otp=${code} — dev: paste this OTP into verify (no demo bypass; configure SMS in production)`,
          );
        } else {
          console.log(`[auth:otp] sent to=${phoneNumber} (code not logged in production)`);
        }
        await prisma.user.update({
          where: { id: registered.id },
          data: { lastOtpSentAt: new Date() },
        });
      },
      verifyOTP: async ({ phoneNumber, code }, ctx) => {
        if (!ctx) return false;
        return verifyOtpLikeInternal({ phoneNumber, code }, ctx);
      },
      /** No auto user creation on verify — users must register via /api/v1/auth/signup first. */
      callbackOnVerification: async ({ user }) => {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: true },
        });
      },
    }),
  ],
});

/** Mirrors Better Auth internal OTP check when `verifyOTP` is overridden. */
async function verifyOtpLikeInternal(
  { phoneNumber, code }: { phoneNumber: string; code: string },
  ctx: GenericEndpointContext,
): Promise<boolean> {
  const otp = await ctx.context.internalAdapter.findVerificationValue(phoneNumber);
  if (!otp) return false;
  if (otp.expiresAt < new Date()) return false;

  const [otpValue, attemptsStr] = otp.value.split(":");
  const allowedAttempts = 5;
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
  if (attempts >= allowedAttempts) return false;

  if (otpValue !== code) {
    await ctx.context.internalAdapter.updateVerificationByIdentifier(phoneNumber, {
      value: `${otpValue}:${attempts + 1}`,
    });
    return false;
  }
  return true;
}
