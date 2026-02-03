import { Hono } from "hono";
import type { CacheClient } from "./cache";

export type AppContext = {
  cache: CacheClient;
};

export function createRoute() {
  return new Hono<{
    Variables: AppContext;
  }>();
}
