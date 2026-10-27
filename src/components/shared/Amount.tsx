import * as React from "react";
import { cn } from "@/lib/utils";
export type AmountProps = { value: number; currency?: "fiat" | "crypto"; precision?: number; signed?: boolean; showSign?: boolean; className?: string; fiatCurrency?: string; cryptoCurrency?: string };
export function Amount({ value, currency = "fiat", precision, signed = false, showSign = signed, className, fiatCurrency = "USD", cryptoCurrency = "BTC" }: AmountProps) {
 const negative=value<0, positive=value>0, digits=precision ?? (currency==="crypto"?8:2), absolute=Math.abs(value);
 const formatted=currency==="fiat" ? new Intl.NumberFormat("en-US",{style:"currency",currency:fiatCurrency,minimumFractionDigits:digits,maximumFractionDigits:digits}).format(absolute) : new Intl.NumberFormat("en-US",{minimumFractionDigits:digits,maximumFractionDigits:digits,useGrouping:true}).format(absolute);
 const sign=negative?"−":showSign&&positive?"+":"", tone=signed?(negative?"text-danger":positive?"text-success":"text-muted-foreground"):"text-foreground";
 return <span className={cn("font-mono tabular-nums whitespace-nowrap",tone,className)} aria-label={`${negative?"minus ":showSign&&positive?"plus ":""}${formatted}${currency==="crypto"?` ${cryptoCurrency}`:""}`}>{sign}{formatted}{currency==="crypto"?<span className="ml-1 text-xs text-muted-foreground">{cryptoCurrency}</span>:null}</span>;
}
