import { serve } from "@hono/node-server";
import zettleApp from "./zettle";
import minecraftApp from "./minecraft";
import { getCache } from "./cache";
import { type AppContext } from "./utils";
import { Hono } from "hono";
import { cors } from "hono/cors";

import { hc } from "hono/client";
import { createNodeWebSocket } from "@hono/node-ws";
import {
  installErrorInterceptors,
  pinoLoggerMiddleware,
  logger,
} from "@/logger";

installErrorInterceptors();

const app = new Hono<{
  Variables: AppContext;
}>()
  .use(
    "*",
    cors({
      origin: ["http://localhost:5173", "https://drift.tihlde.org"],
      credentials: true,
    }),
  )
  .use("*", async (c, next) => {
    c.set("cache", await getCache());
    await next();
  })
  .use("*", pinoLoggerMiddleware)
  .onError((err, c) => {
    const requestLogger = c.get("logger") ?? logger;
    requestLogger.error(
      { err, event: "http.error" },
      "Unhandled error while handling request",
    );
    return c.text("Internal Server Error", { status: 500 });
  })
  .basePath("/api")
  .route("/", zettleApp)
  .route("/", minecraftApp);

export type BackendApi = typeof app;

export type ApiClientType = ReturnType<typeof hc<typeof app>>;

const { injectWebSocket, upgradeWebSocket } = createNodeWebSocket({ app });

export { upgradeWebSocket };

const server = serve({
  fetch: app.fetch,
  port: 3000,
}).on("listening", () => {
  logger.info(
    { event: "server.listening", url: "http://localhost:3000", port: 3000 },
    "Server is listening",
  );
});

injectWebSocket(server);
