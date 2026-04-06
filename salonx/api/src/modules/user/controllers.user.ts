import type { Request, Response } from "express";
import { userService } from "./services.user.js";
import { HttpError } from "../../middleware/http-error.js";

const userController = {
  async listSalons(req: Request, res: Response) {
    const userId = req.auth?.user.id;
    if (!userId) {
      throw new HttpError(401, "UNAUTHORIZED", "Authentication required");
    }
    const data = await userService.listSalonsForUser(userId);
    res.json({ data });
  },
};

export { userController };
