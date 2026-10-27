"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  HistogramSeries,
  LineStyle,
  createChart,
  type IChartApi,
  type ISeriesApi,
  type UTCTimestamp,
} from "lightweight-charts";
import { ArrowDownRight, ArrowUpRight } from "lucide-react";

import { PriceTicker } from "@/components/shared/PriceTicker";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  TIMEFRAMES,
  applyPriceToCandle,
  change24h,
  formatPercent,
  formatPrice,
  type Asset,
  type Candle,
  type Timeframe,
} from "@/lib/demo/crypto";

type TradeChartProps = {
  asset: Asset;
  candles: Candle[];
  timeframe: Timeframe;
  onTimeframeChange: (timeframe: Timeframe) => void;
};

type Palette = { background: string; text: string; grid: string; border: string; up: string; down: string };

const FALLBACK: Palette = {
  background: "#FFFFFF",
  text: "#64748B",
  grid: "#E2E8F0",
  border: "#E2E8F0",
  up: "#10B981",
  down: "#F43F5E",
};

function readPalette(): Palette {
  if (typeof window === "undefined") return FALLBACK;
  const styles = getComputedStyle(document.documentElement);
  const token = (name: string, fallback: string) => styles.getPropertyValue(name).trim() || fallback;
  return {
    background: token("--surface", FALLBACK.background),
    text: token("--text-muted", FALLBACK.text),
    grid: token("--border", FALLBACK.grid),
    border: token("--border", FALLBACK.border),
    up: token("--success", FALLBACK.up),
    down: token("--danger", FALLBACK.down),
  };
}

const withAlpha = (color: string, alpha: number) => {
  if (color.startsWith("#")) {
    const hex = color.length === 4 ? color.slice(1).split("").map((part) => part + part).join("") : color.slice(1);
    const value = Number.parseInt(hex.slice(0, 6), 16);
    return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
  }
  return color;
};

export function TradeChart({ asset, candles, timeframe, onTimeframeChange }: TradeChartProps) {
  const { resolvedTheme } = useTheme();
  const holderRef = React.useRef<HTMLDivElement>(null);
  const chartRef = React.useRef<IChartApi | null>(null);
  const candleRef = React.useRef<ISeriesApi<"Candlestick"> | null>(null);
  const volumeRef = React.useRef<ISeriesApi<"Histogram"> | null>(null);
  const dataRef = React.useRef<Candle[]>(candles);
  const [ready, setReady] = React.useState(false);
  const change = change24h(asset);
  const positive = change >= 0;

  // Create the chart once; everything else updates it in place so the canvas
  // never remounts (no layout shift, no lost zoom).
  React.useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    const chart = createChart(holder, {
      width: holder.clientWidth,
      height: holder.clientHeight,
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: FALLBACK.text, fontFamily: "var(--font-inter), ui-sans-serif" },
      grid: { vertLines: { color: FALLBACK.grid, style: LineStyle.Dotted }, horzLines: { color: FALLBACK.grid, style: LineStyle.Dotted } },
      rightPriceScale: { borderColor: FALLBACK.border, scaleMargins: { top: 0.08, bottom: 0.26 } },
      timeScale: { borderColor: FALLBACK.border, timeVisible: true, secondsVisible: false, rightOffset: 4, barSpacing: 6 },
      crosshair: { mode: CrosshairMode.Normal },
      handleScale: { axisPressedMouseMove: { time: true, price: false } },
      autoSize: false,
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: FALLBACK.up,
      downColor: FALLBACK.down,
      wickUpColor: FALLBACK.up,
      wickDownColor: FALLBACK.down,
      borderVisible: false,
      priceLineVisible: false,
      lastValueVisible: true,
    });
    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: "volume" },
      priceScaleId: "volume",
      lastValueVisible: false,
      priceLineVisible: false,
    });
    chart.priceScale("volume").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });

    chartRef.current = chart;
    candleRef.current = candleSeries;
    volumeRef.current = volumeSeries;
    setReady(true);

    const observer = new ResizeObserver(() => {
      chart.applyOptions({ width: holder.clientWidth, height: holder.clientHeight });
    });
    observer.observe(holder);

    return () => {
      observer.disconnect();
      chart.remove();
      chartRef.current = null;
      candleRef.current = null;
      volumeRef.current = null;
      setReady(false);
    };
  }, []);

  // Theme tokens live in CSS, so colours are read from the document whenever
  // the theme flips (both palettes are plain hex, readable by the canvas).
  React.useEffect(() => {
    const chart = chartRef.current;
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!chart || !candleSeries || !volumeSeries) return;
    const palette = readPalette();
    chart.applyOptions({
      layout: { background: { type: ColorType.Solid, color: "transparent" }, textColor: palette.text },
      grid: { vertLines: { color: palette.grid }, horzLines: { color: palette.grid } },
      rightPriceScale: { borderColor: palette.border },
      timeScale: { borderColor: palette.border },
      crosshair: { vertLine: { color: palette.border }, horzLine: { color: palette.border } },
      localization: { priceFormatter: (value: number) => formatPrice(value, asset.precision) },
    });
    candleSeries.applyOptions({ upColor: palette.up, downColor: palette.down, wickUpColor: palette.up, wickDownColor: palette.down });
    volumeSeries.setData(
      dataRef.current.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color: withAlpha(candle.close >= candle.open ? palette.up : palette.down, 0.28),
      })),
    );
  }, [resolvedTheme, asset.precision]);

  React.useEffect(() => {
    dataRef.current = candles;
    const chart = chartRef.current;
    const candleSeries = candleRef.current;
    const volumeSeries = volumeRef.current;
    if (!chart || !candleSeries || !volumeSeries) return;
    const palette = readPalette();
    candleSeries.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        open: candle.open,
        high: candle.high,
        low: candle.low,
        close: candle.close,
      })),
    );
    volumeSeries.setData(
      candles.map((candle) => ({
        time: candle.time as UTCTimestamp,
        value: candle.volume,
        color: withAlpha(candle.close >= candle.open ? palette.up : palette.down, 0.28),
      })),
    );
    chart.timeScale().fitContent();
  }, [candles, ready]);

  // Extend the newest candle with each price tick instead of re-seeding history.
  React.useEffect(() => {
    const candleSeries = candleRef.current;
    const last = dataRef.current[dataRef.current.length - 1];
    if (!candleSeries || !last) return;
    const live = applyPriceToCandle(last, asset.price, asset.precision);
    candleSeries.update({ time: live.time as UTCTimestamp, open: live.open, high: live.high, low: live.low, close: live.close });
  }, [asset.price, asset.precision]);

  return (
    <Card>
      <CardHeader className="gap-4 pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              aria-hidden="true"
              className="grid size-10 place-items-center rounded-lg text-xs font-bold"
              style={{ backgroundColor: `${asset.color}1f`, color: asset.color }}
            >
              {asset.symbol.slice(0, 3)}
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-base font-semibold tracking-tight">
                {asset.symbol}<span className="text-muted-foreground">/USD</span>
              </h2>
              <p className="truncate text-xs text-muted-foreground">{asset.name}</p>
            </div>
          </div>
          <div className="flex items-center gap-1 rounded-lg border border-border p-1" role="group" aria-label="Chart timeframe">
            {TIMEFRAMES.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={entry.id === timeframe}
                onClick={() => onTimeframeChange(entry.id)}
                // Inline colours: legacy unlayered `button` rules in globals.css
                // win over Tailwind's layered background utilities.
                style={entry.id === timeframe ? { backgroundColor: "var(--brand)", color: "var(--brand-fg)" } : undefined}
                className={cn(
                  "h-7 rounded-md px-2.5 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  entry.id !== timeframe && "text-muted-foreground hover:bg-accent hover:text-foreground",
                )}
              >
                {entry.label}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <PriceTicker value={asset.price} precision={asset.precision} className="text-2xl font-semibold tracking-tight" />
          <span className={cn("inline-flex items-center gap-1 text-xs font-semibold", positive ? "text-success" : "text-danger")}>
            {positive ? <ArrowUpRight aria-hidden="true" className="size-3.5" /> : <ArrowDownRight aria-hidden="true" className="size-3.5" />}
            {formatPercent(change)}
            <span className="font-normal text-muted-foreground">24h</span>
          </span>
        </div>
      </CardHeader>
      <CardContent className="pb-4">
        <div
          ref={holderRef}
          data-timeframe={timeframe}
          data-symbol={asset.symbol}
          aria-label={`${asset.symbol} ${timeframe} candlestick chart with volume`}
          role="img"
          className="h-[320px] w-full sm:h-[380px]"
        />
      </CardContent>
    </Card>
  );
}
