import { NextResponse } from "next/server";

import { proxyPlatform } from "@/lib/api/platformProxy";

export const dynamic = "force-dynamic";

const SYMBOL = /^[A-Z0-9]{2,12}$/;
const TIMEFRAMES = new Set(["1H", "4H", "1D", "1W"]);

/** OHLC history for one symbol and timeframe, straight from the engine. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const symbol = (url.searchParams.get("symbol") ?? "BTC").toUpperCase();
  const timeframe = (url.searchParams.get("timeframe") ?? "1H").toUpperCase();

  if (!SYMBOL.test(symbol)) {
    return NextResponse.json({ error: "invalid_symbol" }, { status: 422 });
  }
  if (!TIMEFRAMES.has(timeframe)) {
    return NextResponse.json({ error: "invalid_timeframe" }, { status: 422 });
  }

  return proxyPlatform(`/v1/markets/${symbol}/candles?timeframe=${timeframe}&limit=120`, {
    requireAuth: false,
  });
}
