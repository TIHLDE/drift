import { ofetch } from "ofetch";
import z from "zod";
import { createRoute } from "@/utils";

const PHOTON_ENDPOINT = process.env.PHOTON_ENDPOINT || "https://photon.tihlde.org";

const EventBaseSchema = z.object({
  id: z.string(),
  title: z.string(),
  location: z.string().nullable(),
  startTime: z.string(),
  endTime: z.string(),
  image: z.string().nullable(),
  imageAlt: z.string().nullable(),
});

const EnrichedEventSchema = EventBaseSchema.extend({
  registrationStart: z.string().nullable(),
});

const RawListSchema = z.object({
  items: z.array(EventBaseSchema),
});

const EventListSchema = z.object({
  items: z.array(EnrichedEventSchema),
});

const EventDetailSchema = z.object({
  registrationStart: z.string().nullable(),
});

const photonApp = createRoute()
  .basePath("/photon")
  .get("/event", async (c) => {
    const cache = c.get("cache");

    // Cache for 30 min: all kiosk screens share one photon call per TTL
    const cached = await cache.cachifyValidate({
      key: `photon:events:upcoming`,
      ttlSeconds: 30 * 60,
      fn: async () => {
        const list = await ofetch(`${PHOTON_ENDPOINT}/api/event`, {
          query: { expired: false, ordering: "upcoming", pageSize: 50 },
          parseResponse: JSON.parse,
        }).then((res) => RawListSchema.parse(res));

        // The list endpoint lacks registration times; enrich from the detail endpoint
        const items = await Promise.all(
          list.items.map(async (item): Promise<z.infer<typeof EnrichedEventSchema>> => {
            try {
              const detail = await ofetch(`${PHOTON_ENDPOINT}/api/event/${item.id}`, {
                parseResponse: JSON.parse,
              }).then((res) => EventDetailSchema.parse(res));
              return { ...item, ...detail };
            } catch {
              // Detail fetch failed; show the event without a registration start
              return { ...item, registrationStart: null };
            }
          }),
        );
        return { items };
      },
      schema: EventListSchema,
    });

    return c.json(cached.data);
  });

export default photonApp;
