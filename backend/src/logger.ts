import { format } from "node:util";
import { writeSync } from "node:fs";
import { requestId } from "hono/request-id";
import { routePath } from "hono/route";
import { every } from "hono/combine";
import {
  pino,
  destination,
  stdSerializers,
  type Logger,
} from "pino";

export function serializeError(value: unknown) {
  if (!(value instanceof Error)) {
    return { type: "NonError", message: format(value) };
  }
  return stdSerializers.err(value);
}

const { NODE_ENV } = process.env;
const isDev = NODE_ENV === "development";

const SERVICE_NAME = "drift-backend";

export const logger = pino(
  {
    // Tests that inspect logs provide their own logger with an in-memory sink.
    level: NODE_ENV === "test" ? "silent" : isDev ? "debug" : "info",
    timestamp: pino.stdTimeFunctions.isoTime,
    base: { pid: process.pid, service: SERVICE_NAME },
    serializers: { err: serializeError },
    ...(isDev
      ? {
            transport: {
                target: "pino-pretty",
                options: { colorize: true },
            },
        }
      : {}),
  },
  // Write each record directly to the container's stdout.
  ...(isDev ? [] : [destination({ dest: 1, sync: true })]),
);

export type LoggerType = typeof logger;

// Do not let the error-reporting path raise another application exception.
function writeLog(write: () => void): void {
  try {
    write();
  } catch {
    try {
      // Avoid console.{log|warn|error} and go straight to stdout
      writeSync(1, "Could not write log record; original details unavailable\n");
    } catch {
      // There is no safe output destination left.
    }
  }
}

let installed = false;
export function installErrorInterceptors() {
  if (installed) return;
  installed = true;

  // Override console.log, console.warn and console.error to use the pino logger
  for (const method of ["log", "warn", "error"] as const) {
    const level = method === "log" ? "info" : method;
    console[method] = (...args: unknown[]) =>
      writeLog(() => {
        const errors = args.filter((arg) => arg instanceof Error);
        const messageArgs = args.map((arg) =>
          arg instanceof Error ? arg.message : arg,
        );

        logger[level](
          {
            event: `console.${method}`,
            ...(errors.length ? { err: errors[0] } : {}),
            ...(errors.length > 1
              ? { errors: errors.slice(1).map(serializeError) }
              : {}),
          },
          format(...messageArgs),
        );
      });
  }

  // Last-resort safety net; expected failures belong in their request handlers.
  process.on("unhandledRejection", (reason) =>
    writeLog(() => {
      logger.error(
        { event: "process.unhandledRejection", err: reason },
        "Unhandled promise rejection",
      );
    }),
  );
  process.on("uncaughtException", (error) =>
    writeLog(() => {
      logger.error(
        { event: "process.uncaughtException", err: error },
        "Uncaught exception",
      );
    }),
  );
  process.on("warning", (warning) =>
    writeLog(() => {
      logger.warn(
        { event: "process.warning", err: warning },
        warning.message,
      );
    }),
  );
}

export const pinoLoggerMiddleware = every(
  requestId(),
  async (c, next) => {
    const requestIdValue = c.var.requestId;
    const method = c.req.method;
    const url = c.req.path;
    const route = routePath(c, -1);

    const requestLogger = logger.child({
      requestId: requestIdValue,
      request: { method, url, route },
    });
    c.set("logger", requestLogger);

    requestLogger.info({ event: "http.request.start" }, `${method} ${url}`);
    const start = Date.now();
    await next();
    const elapsed = Date.now() - start;
    const status = c.res.status;
    const responseLogger = requestLogger.child({ status, elapsedMs: elapsed });
    const message = `${method} ${url} completed`;
    if (status >= 500) {
      responseLogger.error({ event: "http.request.end" }, message);
    } else if (status >= 400) {
      responseLogger.warn({ event: "http.request.end" }, message);
    } else {
      responseLogger.info({ event: "http.request.end" }, message);
    }
  },
);
