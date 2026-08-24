import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import * as Sentry from "@sentry/nextjs";
import {
  getWelcomeEmailHtml,
} from "./email-templates";
import { EmailService } from "./email.service";
import { getAppUrl } from "./auth-utils";

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: getAppUrl(),
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://minibrands-fbms.vercel.app",
    getAppUrl(),
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Handled via OTP / token verification flow
    async sendResetPassword({ user, token, url }) {
      const resetUrl = url || `${getAppUrl()}/reset-password?token=${token}`;
      const { renderPasswordResetEmail } = await import("../emails/password-reset/template");
      const html = renderPasswordResetEmail({
        name: user.name,
        resetUrl,
        code: token,
      });

      await EmailService.send({
        to: user.email,
        subject: "Reset Your MiniBrands Password",
        html,
        category: "AUTH",
      });
    },
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "mock-google-client-id",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "mock-google-client-secret",
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        await EmailService.sendOTP(email, otp, type);
      },
    }),
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            // Safety check: ensure UserProfile exists
            const existingProfile = await prisma.userProfile.findUnique({
              where: { userId: user.id },
            });
            if (!existingProfile) {
              const targetRole = user.email === "sham1309kumar@gmail.com" ? "ADMIN" : "BUYER";
              await prisma.userProfile.create({
                data: {
                  userId: user.id,
                  role: targetRole,
                },
              });

              const welcomeHtml = getWelcomeEmailHtml({ name: user.name || "Fashion Enthusiast", role: targetRole });
              EmailService.send({
                to: user.email,
                subject: "Welcome to MiniBrands!",
                html: welcomeHtml,
                category: "TRANSACTIONAL",
              }).catch((err) => console.error("Error sending welcome email:", err));
            }
          } catch (error) {
            Sentry.captureException(error);
            console.error("Error creating user profile in hook:", error);
            throw error;
          }
        },
      },
    },
  },
  rateLimit: {
    enabled: true,
    window: 600, // 10 minutes (600 seconds)
    max: 100,
    customRules: {
      "/email-otp/send-verification-otp": {
        window: 600,
        max: 5, // Max 5 OTP sends in 10 minutes
      },
      "/sign-in/email-password": {
        window: 900, // 15 minutes
        max: 10,
      },
    },
  },
});
