import z from "zod";
import dotenv from "dotenv";
dotenv.config();

export const env = z
  .object({
    ZETTLE_CLIENT_ID: z.string().optional(),
    ZETTLE_API_KEY: z.string().optional(),
    REDIS_URL: z.string().optional(),
    ZETTLE_WEBHOOK_SIGNING_KEY: z.string().optional(),
  })
  .parse(process.env);

if (
  env.ZETTLE_WEBHOOK_SIGNING_KEY === "super-secret-do-not-use-in-production"
) {
  console.warn(
    "WARNING: You are using the standard webhook signing key. This is not secure and should not be used in production.",
  );
}
if (env.ZETTLE_WEBHOOK_SIGNING_KEY == null) {
  console.warn(
    "WARNING: No webhook signing key configured. Webhook requests will not be verified.",
  );
}
