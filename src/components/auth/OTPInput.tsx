"use client";

import * as React from "react";

export function OTPInput({ value, onChange, length = 6, disabled = false }: {
  value: string; onChange: (value: string) => void; length?: number; disabled?: boolean;
}) {
  const refs = React.useRef<Array<HTMLInputElement | null>>([]);
  const digits = value.padEnd(length, " ").slice(0, length).split("");
  function update(index: number, raw: string) {
    const incoming = raw.replace(/\D/g, "");
    if (!incoming) {
      const next = value.split("");
      next[index] = "";
      onChange(next.join("").slice(0, length));
      return;
    }
    const next = value.split("");
    for (let offset = 0; offset < incoming.length && index + offset < length; offset += 1) next[index + offset] = incoming[offset];
    onChange(next.join("").slice(0, length));
    refs.current[Math.min(index + incoming.length, length - 1)]?.focus();
  }
  return (
    <div className="flex justify-center gap-2 sm:gap-3" role="group" aria-label="Six-digit verification code">
      {digits.map((digit, index) => (
        <input
          key={index}
          ref={(node) => { refs.current[index] = node; }}
          aria-label={"Digit " + (index + 1)}
          inputMode="numeric"
          autoComplete={index === 0 ? "one-time-code" : "off"}
          pattern="[0-9]*"
          maxLength={length}
          disabled={disabled}
          value={digit.trim()}
          onChange={(event) => update(index, event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Backspace" && !digits[index].trim() && index > 0) refs.current[index - 1]?.focus();
            if (event.key === "ArrowLeft" && index > 0) refs.current[index - 1]?.focus();
            if (event.key === "ArrowRight" && index < length - 1) refs.current[index + 1]?.focus();
          }}
          onPaste={(event) => {
            const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, length);
            if (pasted) { event.preventDefault(); onChange(pasted); refs.current[Math.min(pasted.length, length - 1)]?.focus(); }
          }}
          className="size-11 rounded-lg border border-input bg-background text-center text-lg font-semibold tabular-nums outline-none transition focus:border-brand focus:ring-2 focus:ring-ring disabled:opacity-50 sm:size-12"
        />
      ))}
    </div>
  );
}