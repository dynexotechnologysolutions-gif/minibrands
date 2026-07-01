import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { emailOTP } from "better-auth/plugins";
import { prisma } from "./prisma";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";

const resend = new Resend(process.env.RESEND_API_KEY || "re_mock_key");

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  plugins: [
    emailOTP({
      async sendVerificationOTP({ email, otp, type }) {
        try {
          if (!process.env.RESEND_API_KEY) {
            console.log(`[MOCK EMAIL] OTP for ${email} (${type}): ${otp}`);
            return;
          }
          await resend.emails.send({
            from: process.env.EMAIL_FROM || "Velvet Lane Auth <onboarding@resend.dev>",
            to: email,
            subject: "Your Velvet Lane Verification Code",
            text: `Your verification code is: ${otp}`,
            html: `<div style="font-family: sans-serif; padding: 20px; color: #333;">
              <h2 style="color: #4f46e5;">Velvet Lane Verification</h2>
              <p>Your one-time password (OTP) is:</p>
              <div style="font-size: 24px; font-weight: bold; letter-spacing: 2px; padding: 10px 0; color: #4f46e5;">${otp}</div>
              <p>This code will expire in 5 minutes.</p>
            </div>`,
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
            // Check if profile already exists (safety check)
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
        max: 5, // Block on 6th request (max 5 sends in 10 minutes)
      },
    },
  },
});
