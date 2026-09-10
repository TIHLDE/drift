import { ofetch } from "ofetch";
import z from "zod";
import { logger } from "@/logger";

const MinecraftServerStatusSchema = z.object({
  online: z.boolean(),
  players: z
    .object({
      online: z.number(),
      max: z.number(),
    })
    .optional(),
  version: z.union([
    z.string(),
    z.object({
      name_clean: z.string().optional(),
      name_raw: z.string().optional(),
    }),
  ]).optional(),
  protocol: z
    .object({
      version: z.number().optional(),
      name: z.string().optional(),
    })
    .optional(),
  motd: z
    .object({
      clean: z.array(z.string()).optional(),
    })
    .optional(),
});

export type MinecraftServerStatus = z.infer<
  typeof MinecraftServerStatusSchema
>;

export { MinecraftServerStatusSchema };

export class MinecraftAPI {
  constructor(private serverAddress: string) {}

  async getServerStatus(): Promise<MinecraftServerStatus> {
    try {
      const response = await ofetch(
        `https://api.mcsrvstat.us/3/${this.serverAddress}`,
        {
          parseResponse: JSON.parse,
        },
      );

      const parsedData = MinecraftServerStatusSchema.parse(response);
      return parsedData;
    } catch (error) {
      logger.error(
        {
          err: error,
          serverAddress: this.serverAddress,
          event: "minecraft.status_fetch_failed",
        },
        "Error fetching Minecraft server status, returning offline status",
      );
      // Return offline status if API fails
      return {
        online: false,
      };
    }
  }
}
