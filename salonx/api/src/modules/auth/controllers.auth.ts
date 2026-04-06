import type { NextFunction, Request, Response } from "express";
import { authMode } from "./services.auth.js";
import { signupWithEmailPasswordPhone } from "./signup.service.js";

export const authController = {
  /** GET /api/v1/auth/mode — how signup/login/OTP/biometric work. */
  mode(_req: Request, res: Response) {
    res.json(authMode);
  },

  /** POST /api/v1/auth/signup — email + password + phone; no session until OTP verify. */
  signup: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await signupWithEmailPasswordPhone(req.body);
      res.status(201).json({
        message: "Account created. Request an OTP and verify to sign in.",
        ...result,
      });
    } catch (e) {
      next(e);
    }
  },
};
