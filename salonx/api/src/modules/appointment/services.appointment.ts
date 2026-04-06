import type { Prisma } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export type ListAppointmentsQuery = {
  from?: Date;
  to?: Date;
  take?: number;
};

export const appointmentService = {
  async listForSalon(salonId: string, query: ListAppointmentsQuery) {
    const where: Prisma.AppointmentWhereInput = { salonId };

    if (query.from || query.to) {
      where.startAt = {};
      if (query.from) where.startAt.gte = query.from;
      if (query.to) where.startAt.lte = query.to;
    }

    return prisma.appointment.findMany({
      where,
      orderBy: { startAt: "asc" },
      take: query.take ?? 200,
      include: {
        client: { select: { id: true, fullName: true, phone: true } },
      },
    });
  },
};
