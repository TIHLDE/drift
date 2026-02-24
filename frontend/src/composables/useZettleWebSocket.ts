import { onMounted, onUnmounted } from "vue";

export type Purchase = {
  purchaseUUID1?: string;
  timestamp?: string;
  purchaseNumber?: number;
  amount?: number;
  currency?: string;
  products?: Array<{
    quantity?: string;
    name?: string;
    variantName?: string;
    unitPrice?: number;
  }>;
};

export function useZettleWebSocket(
  onPurchase: (data: { purchase: Purchase }) => void,
) {
  let ws: WebSocket | null = null;
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  let periodicReconnectInterval: ReturnType<typeof setInterval> | null = null;

  function getWsUrl() {
    const base = import.meta.env.VITE_API_ENDPOINT || "http://localhost:3000";
    return base.replace(/^http/, "ws") + "/api/zettle/websocket";
  }

  function connect() {
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
    ws = new WebSocket(getWsUrl());
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.event === "new_purchase") onPurchase(msg.data);
      } catch {
        // ignore malformed messages
      }
    };
    ws.onclose = () => {
      reconnectTimer = setTimeout(connect, 1000);
    };
  }

  onMounted(() => {
    connect();
    periodicReconnectInterval = setInterval(connect, 30 * 60 * 1000);
  });

  onUnmounted(() => {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    if (periodicReconnectInterval) clearInterval(periodicReconnectInterval);
    if (ws) {
      ws.onclose = null;
      ws.close();
    }
  });
}
