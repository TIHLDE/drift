import { PurchaseSchema } from "./schema";
import { env } from "@/env";
import { createRoute } from "@/utils";
import { startOfDay, endOfDay, subWeeks } from "date-fns";
import { ZettleAPI } from "./service";
import { zValidator } from "@hono/zod-validator";
import z from "zod";

function getZettleApi() {
  if (env.ZETTLE_API_KEY == null || env.ZETTLE_CLIENT_ID == null) {
    throw new Error("Zettle api not configured");
  }
  return new ZettleAPI(env.ZETTLE_CLIENT_ID, env.ZETTLE_API_KEY);
}

const PurchaseParamsSchema = z.object({
  startDate: z.iso.date().optional().nullable(),
  endDate: z.iso.date().optional().nullable(),
});

const zettleApp = createRoute()
  .basePath("/zettle")
  .get("/purchases", zValidator("query", PurchaseParamsSchema), async (c) => {
    const zettleApi = getZettleApi();
    const params = c.req.valid("query");
    const cache = c.get("cache");

    const startDate = startOfDay(
      params.startDate ? params.startDate : subWeeks(new Date(), 1),
    );
    const endDate = endOfDay(params.endDate ? params.endDate : new Date());

    const { data } = await cache.cachifyValidate({
      fn: () =>
        zettleApi.getPurchases({
          startDate,
          endDate,
        }),
      schema: z.object({ purchases: z.array(PurchaseSchema) }),
      key: `zettle:products:${startDate.toISOString()}:${endDate.toISOString()}`,
    });

    return c.json(data.purchases);
  });

export default zettleApp;
