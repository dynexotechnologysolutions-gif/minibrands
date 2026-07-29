import { z } from "zod";

const emailEnvSchema = z.object({
  USE_SMTP_TRANSPORT: z.coerce.boolean().default(false),
  SMTP_HOST: z.string().min(1),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().min(1),
  SMTP_PASSWORD: z.string().min(1),
  SMTP_FROM: z.string().min(5),
});

export function validateEmailConfig() {
  if (process.env.USE_SMTP_TRANSPORT === "true") {
    const result = emailEnvSchema.safeParse(process.env);
    if (!result.success) {
      console.error("❌ Invalid Email Configuration:", result.error.format());
      throw new Error("SMTP Email Configuration missing or malformed on startup.");
    }
  }
}
