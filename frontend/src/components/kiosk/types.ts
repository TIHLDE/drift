import type { InferResponseType } from "hono";
import { apiClient } from "@/api/client";

export type EventItem = InferResponseType<
  typeof apiClient.api.photon.event.$get
>["items"][number];

export type NewsItem = InferResponseType<
  typeof apiClient.api.photon.news.$get
>["items"][number];

/** The hero banner cycles between a registration countdown and news. */
export type HeroSlide =
  | {
      kind: "registration";
      event: EventItem;
      countdown: { h: number; m: number; s: number };
    }
  | { kind: "news"; item: NewsItem };
