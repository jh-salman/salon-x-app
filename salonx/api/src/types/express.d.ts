import type { SalonMembershipRole } from "@prisma/client";

export type AuthPayload = {
  session: {
    id: string;
    userId: string;
    expiresAt: Date;
    token: string;
  };
  user: {
    id: string;
    email: string;
    name: string;
    emailVerified: boolean;
    image?: string | null;
  };
};

declare global {
  namespace Express {
    interface Request {
      requestId?: string;
      auth?: AuthPayload | null;
      salonId?: string;
      salonRole?: SalonMembershipRole;
    }
  }
}

export {};
