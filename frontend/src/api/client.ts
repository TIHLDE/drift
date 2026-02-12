import type { BackendApi } from "@drift/backend";
import { hc } from "hono/client";

export const apiClient = hc<BackendApi>("http://localhost:3000/");
