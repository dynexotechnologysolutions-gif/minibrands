import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import {
  getVerificationEmailHtml,
  getPasswordResetEmailHtml,
  getWelcomeEmailHtml,
  getAccountLockoutEmailHtml,
} from "./email-templates";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  baseURL: process.env.BETTER_AUTH_URL || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  trustedOrigins: [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ].filter(Boolean),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
    requireEmailVerification: false, // Handled via OTP / token verification flow
    async sendResetPassword({ user, token, url }) {
      try {
        if (!process.env.RESEND_API_KEY) {
          console.log(`[MOCK EMAIL] Password Reset Token for ${user.email}: ${token} (URL: ${url})`);
          return;
        }
        await resend.emails.send({
          from: process.env.EMAIL_FROM || "Velvet Lane Security <onboarding@resend.dev>",
          to: user.email,
          subject: "Reset Your MiniBrands Password",
          html: getPasswordResetEmailHtml({
            name: user.name,
            resetUrl: url || `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/reset-password?token=${token}`,
            code: token,
            expiresInMinutes: 15,
          }),
        });
      } catch (error) {
        Sentry.captureException(error);
        console.error("Failed to send reset password email:", error);
      }
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
        try {
          if (!process.env.RESEND_API_KEY) {
            console.log(`[MOCK EMAIL] OTP for ${email} (${type}): ${otp}`);
            return;
          }
          const subject = type === "forget-password"
            ? "Your MiniBrands Password Reset Code"
            : "Your MiniBrands Verification Code";

          const html = type === "forget-password"
            ? getPasswordResetEmailHtml({ code: otp, expiresInMinutes: 5 })
            : getVerificationEmailHtml({ code: otp, expiresInMinutes: 5 });

          await resend.emails.send({
            from: process.env.EMAIL_FROM || "Velvet Lane Auth <onboarding@resend.dev>",
            to: email,
            subject,
            html,
          });
        } catch (error) {
          Sentry.captureException(error);
          console.error("Failed to send verification email:", error);
          throw error;
        }
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
              await prisma.userProfile.create({
                data: {
                  userId: user.id,
                  role: "BUYER",
                },
              });

              // Send welcome email if Resend is configured
              if (process.env.RESEND_API_KEY) {
                resend.emails.send({
                  from: process.env.EMAIL_FROM || "Velvet Lane <onboarding@resend.dev>",
                  to: user.email,
                  subject: "Welcome to MiniBrands Velvet Lane!",
                  html: getWelcomeEmailHtml({ name: user.name || "Fashion Enthusiast", role: "BUYER" }),
                }).catch((err) => console.error("Error sending welcome email:", err));
              }
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
