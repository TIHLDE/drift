import { serve } from "@hono/node-server";
import zettleApp from "./zettle";
import { getCache } from "./cache";
import { type AppContext } from "./utils";
import { Hono } from "hono";

import { hc } from "hono/client";

const app = new Hono<{
  Variables: AppContext;
}>()
  .use("*", async (c, next) => {
    c.set("cache", await getCache());
    await next();
  })
  .basePath("/api")
  .route("/", zettleApp);

export type BackendApi = typeof app;

export type ApiClientType = ReturnType<typeof hc<typeof app>>;

serve({
  fetch: app.fetch,
  port: 3000,
}).on("listening", () => {
  console.log("Server is listening on http://localhost:3000");
});
