import type { Server } from "node:http";
import { WebSocketServer, type WebSocket } from "ws";

import type { MarketEngine } from "./engine.js";

type Client = WebSocket & { alive?: boolean; symbols?: Set<string> };

/**
 * WebSocket feed: `/ws` with a `subscribe` control frame.
 * Clients receive `{ type: "ticker" | "book" | "fill", payload }` messages for
 * the symbols they subscribed to. A 30s ping/pong sweep drops dead sockets so
 * half-open connections cannot leak, and clients reconnect with exponential
 * backoff (see `public` client helper in docs/ARCHITECTURE.md).
 */
export function attachRealtimeServer(server: Server, engine: MarketEngine, path = "/ws") {
  const wss = new WebSocketServer({ server, path });

  wss.on("connection", (socket: Client) => {
    socket.alive = true;
    socket.symbols = new Set(engine.symbols());
    socket.send(JSON.stringify({ type: "snapshot", payload: { tickers: engine.tickers(), book: engine.depth(engine.symbols()[0] ?? "BTC") } }));

    socket.on("pong", () => {
      socket.alive = true;
    });

    socket.on("message", (raw) => {
      let message: { type?: string; symbol?: string; symbols?: string[] };
      try {
        message = JSON.parse(raw.toString());
      } catch {
        socket.send(JSON.stringify({ error: "invalid_json" }));
        return;
      }
      if (message.type === "subscribe") {
        const requested = message.symbols ?? (message.symbol ? [message.symbol] : []);
        socket.symbols = new Set(requested.filter((symbol) => engine.symbols().includes(symbol)));
        socket.send(
          JSON.stringify({
            type: "subscribed",
            payload: { symbols: [...socket.symbols], book: engine.depth(requested[0] ?? "BTC") },
          }),
        );
      }
      if (message.type === "ping") socket.send(JSON.stringify({ type: "pong", at: Date.now() }));
    });
  });

  const broadcast = (type: string, payload: unknown) => {
    const frame = JSON.stringify({ type, payload });
    for (const client of wss.clients as Set<Client>) {
      if (client.readyState !== client.OPEN) continue;
      const symbol = (payload as { symbol?: string }).symbol;
      if (symbol && client.symbols && !client.symbols.has(symbol)) continue;
      client.send(frame);
    }
  };

  engine.on("ticker", (ticker) => broadcast("ticker", ticker));
  engine.on("book", (book) => broadcast("book", book));
  engine.on("fill", (fill) => broadcast("fill", fill));

  const heartbeat = setInterval(() => {
    for (const client of wss.clients as Set<Client>) {
      if (client.alive === false) {
        client.terminate();
        continue;
      }
      client.alive = false;
      client.ping();
    }
  }, 30_000);
  heartbeat.unref?.();

  return {
    wss,
    close: () =>
      new Promise<void>((resolve) => {
        clearInterval(heartbeat);
        wss.close(() => resolve());
      }),
  };
}
