import z from "zod";
import dotenv from "dotenv";
import { logger } from "./logger";
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
  logger.warn(
    {
      event: "env.warning",
      warning: "default-webhook-signing-key",
    },
    "You are using the standard webhook signing key. This is not secure and should not be used in production.",
  );
}
if (env.ZETTLE_WEBHOOK_SIGNING_KEY == null) {
  logger.warn(
    { event: "env.warning", warning: "missing-webhook-signing-key" },
    "No webhook signing key configured. Webhook requests will not be verified.",
  );
}
