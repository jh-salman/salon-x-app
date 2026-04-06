import { SalonPlan } from "@prisma/client";
import { prisma } from "../../lib/prisma.js";

export const salonService = {
  async updatePlan(salonId: string, plan: SalonPlan) {
    return prisma.salon.update({
      where: { id: salonId },
      data: { plan },
    });
  },
};
