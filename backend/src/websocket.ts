import type z from "zod";
import type { PurchaseSchema } from "./zettle/schema";
import type { WSContext } from "hono/ws";

export enum WebSocketEvents {
  ConnectionOpen = "connection_open",
  NewPurchase = "new_purchase",
}

export type WebSocketEvent = {
  [WebSocketEvents.ConnectionOpen]: {
    id: string;
  };
  [WebSocketEvents.NewPurchase]: {
    purchase: z.infer<typeof PurchaseSchema>;
  };
};

function generateId() {
  return Math.random().toString(36).substring(2, 15);
}

type WebSocketConnection = WSContext<WebSocket>;

export const ConnectionManager = {
  connections: new Map<string, WebSocketConnection>(),
  getConnection(id: string) {
    return this.connections.get(id);
  },

  generateAndAddConnection(ws: WebSocketConnection) {
    let id = generateId();
    while (this.connections.has(id)) {
      id = generateId();
    }
    this.connections.set(id, ws);
    return id;
  },

  addConnection(id: string, ws: WebSocketConnection) {
    this.connections.set(id, ws);
  },

  removeConnection(id: string) {
    this.connections.delete(id);
  },

  broadcast<TEvent extends WebSocketEvents>(
    event: TEvent,
    data: WebSocketEvent[TEvent],
  ) {
    const message = JSON.stringify({
      event,
      data,
    });
    for (const ws of this.connections.values()) {
      try {
        ws.send(message);
      } catch {
        console.log("Failed to send message to client");
      }
    }
  },

  sendToConnection<TEcho extends WebSocketEvents>(
    id: string,
    event: TEcho,
    data: WebSocketEvent[TEcho],
  ) {
    const ws = this.getConnection(id);
    if (ws) {
      const message = JSON.stringify({
        event,
        data,
      });
      ws.send(message);
    } else {
      console.warn(`No WebSocket connection found for id ${id}`);
    }
  },
};
