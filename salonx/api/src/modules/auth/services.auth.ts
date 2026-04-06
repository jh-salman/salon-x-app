/** Public contract for clients (Expo). */
export const authMode = {
  version: 4,
  /** Password is stored at signup; session login is OTP-only (no email/password sign-in). */
  password: {
    atSignup: true,
    sessionLogin: false,
  },
  phone: {
    /** E.164 US only, e.g. +15551234567 */
    region: "US",
    format: "E.164",
    validate: "Server rejects non-US numbers",
  },
  otp: {
    length: 6,
    ttlSeconds: 300,
    /** Minimum seconds between send-otp requests per phone (enforced server-side). */
    resendCooldownSeconds: 60,
    delivery: "sms",
    /** No static demo code — only the OTP from send-otp (SMS in prod, or server console in dev). */
    noDemoBypass: true,
    development: {
      hint: "After POST send-otp, read the 6-digit otp= value from the API process stdout and use it in verify.",
    },
  },
  signup: {
    endpoint: "POST /api/v1/auth/signup",
    body: {
      email: "string",
      password: "string (min 8)",
      phoneNumber: "US E.164",
      name: "string (optional)",
    },
    steps: [
      "POST /api/v1/auth/signup with email, password, phoneNumber, optional name — creates account, no session.",
      "POST /api/auth/phone-number/send-otp with { phoneNumber } — must be a registered phone.",
      "POST /api/auth/phone-number/verify with { phoneNumber, code } — OTP login; session + token. Email marked verified after successful OTP.",
    ],
  },
  login: {
    /** Same as OTP verify — no separate password login. */
    steps: [
      "Step 1 — POST /api/auth/phone-number/send-otp body { phoneNumber: US E.164 }. Server generates OTP; production sends SMS, development logs otp= to the API console (no demo code).",
      "Step 2 — POST /api/auth/phone-number/verify body { phoneNumber, code } — session + token.",
    ],
  },
  betterAuthPaths: {
    sendOtp: "POST /api/auth/phone-number/send-otp",
    verify: "POST /api/auth/phone-number/verify",
  },
  faceLock: {
    scope: "client-only",
    description:
      "Face ID / Touch ID is enforced in the Expo app (e.g. expo-local-authentication) after a session exists, or to unlock stored tokens. The API does not implement biometric verification.",
  },
} as const;
