"use client";

import { useState, type FormEvent } from "react";
import { Check, FileUp } from "lucide-react";
import type { CatalogCategory } from "@/lib/catalog/types";
import { getConfigFields, getConfigSchema, parseConfigValue, type ConfigField } from "@/lib/catalog/schemas";

export type ConfigValues = Record<string, unknown>;

type Props = {
  slug: string;
  category: CatalogCategory;
  values: ConfigValues;
  onChange: (values: ConfigValues) => void;
  onValidSubmit: (values: ConfigValues) => void;
  submitLabel?: string;
};

export function ConfigForm({ slug, category, values, onChange, onValidSubmit, submitLabel = "Review configuration" }: Props) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fields = getConfigFields(slug, category);
  const schema = getConfigSchema(slug, category);
  const update = (name: string, value: unknown) => {
    onChange({ ...values, [name]: value });
    setErrors((current) => { const next = { ...current }; delete next[name]; return next; });
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const parsedValues = Object.fromEntries(fields.map((item) => [
      item.name,
      parseConfigValue(item, (values[item.name] ?? (item.kind === "checkbox" ? false : item.kind === "multiselect" ? [] : "")) as string | boolean | string[]),
    ]));
    const result = schema.safeParse(parsedValues);
    if (!result.success) {
      const next: Record<string, string> = {};
      result.error.issues.forEach((issue) => { const key = String(issue.path[0] ?? "form"); if (!next[key]) next[key] = issue.message; });
      setErrors(next);
      const first = Object.keys(next)[0];
      if (first) document.getElementById("config-" + first)?.focus();
      return;
    }
    setErrors({});
    onValidSubmit(result.data as ConfigValues);
  };
  const controlClass = (name: string) => "mt-1.5 min-h-11 w-full rounded-xl border bg-card px-3 py-2 text-sm text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring " + (errors[name] ? "border-destructive" : "border-input");
  const error = (item: ConfigField) => errors[item.name] ? <p id={"config-" + item.name + "-error"} className="mt-1.5 text-xs text-destructive">{errors[item.name]}</p> : null;
  const help = (item: ConfigField) => item.helpText ? <p id={"config-" + item.name + "-help"} className="mt-1.5 text-xs leading-5 text-muted-foreground">{item.helpText}</p> : null;
  const label = (item: ConfigField) => <label htmlFor={"config-" + item.name} className="block text-sm font-medium">{item.label}{item.required !== false && item.kind !== "checkbox" && <span className="text-destructive"> *</span>}</label>;
  const renderField = (item: ConfigField) => {
    const value = values[item.name];
    const describedBy = errors[item.name] ? "config-" + item.name + "-error" : item.helpText ? "config-" + item.name + "-help" : undefined;
    if (item.kind === "checkbox") return <label key={item.name} className="flex items-start gap-3 rounded-xl border border-border bg-card p-4"><input id={"config-" + item.name} type="checkbox" checked={Boolean(value)} onChange={(event) => update(item.name, event.target.checked)} className="mt-0.5 size-4" aria-invalid={Boolean(errors[item.name])} /><span><span className="block text-sm font-medium">{item.label}</span>{help(item)}{error(item)}</span></label>;
    if (item.kind === "multiselect") return <fieldset key={item.name}><legend className="text-sm font-medium">{item.label}{item.required !== false && <span className="text-destructive"> *</span>}</legend>{help(item)}<div id={"config-" + item.name} className="mt-2 flex flex-wrap gap-2" tabIndex={-1}>{(item.options ?? []).map((option) => { const selected = Array.isArray(value) && value.includes(option.value); return <button key={option.value} type="button" aria-pressed={selected} onClick={() => update(item.name, selected ? (value as string[]).filter((entry) => entry !== option.value) : [...(Array.isArray(value) ? value as string[] : []), option.value])} className={"rounded-full border px-3 py-2 text-xs font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " + (selected ? "border-brand bg-brand/10 text-brand" : "border-border text-muted-foreground")}>{option.label}</button>; })}</div>{error(item)}</fieldset>;
    if (item.kind === "file") return <div key={item.name}>{label(item)}<label htmlFor={"config-" + item.name} className="mt-1.5 flex min-h-12 cursor-pointer items-center gap-3 rounded-xl border border-dashed border-input bg-card px-3 py-3 text-sm"><FileUp className="size-4 text-muted-foreground" /><span className="min-w-0 flex-1 truncate text-muted-foreground">{typeof value === "string" && value ? value : "Choose a file placeholder"}</span><span className="text-xs font-semibold text-brand">Browse</span><input id={"config-" + item.name} type="file" accept="image/*,.svg,.pdf,.txt" className="sr-only" aria-describedby={describedBy} onChange={(event) => update(item.name, event.target.files?.[0]?.name ?? "")} /></label>{help(item)}{error(item)}</div>;
    if (item.kind === "select") return <div key={item.name}>{label(item)}<select id={"config-" + item.name} value={typeof value === "string" ? value : ""} onChange={(event) => update(item.name, event.target.value)} className={controlClass(item.name)} aria-describedby={describedBy} aria-invalid={Boolean(errors[item.name])}><option value="">Choose an option…</option>{item.options?.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select>{help(item)}{error(item)}</div>;
    if (item.kind === "color") return <div key={item.name}>{label(item)}<div className={"mt-1.5 flex h-11 items-center gap-2 rounded-xl border bg-card px-2 " + (errors[item.name] ? "border-destructive" : "border-input")}><input aria-label={"Pick " + item.label.toLowerCase()} type="color" value={typeof value === "string" && /^#[0-9a-f]{6}$/i.test(value) ? value : "#2563eb"} onChange={(event) => update(item.name, event.target.value)} className="size-8 cursor-pointer rounded" /><input id={"config-" + item.name} value={typeof value === "string" ? value : ""} onChange={(event) => update(item.name, event.target.value)} placeholder={item.placeholder ?? "#2563eb"} className="min-w-0 flex-1 bg-transparent text-sm outline-none" aria-describedby={describedBy} aria-invalid={Boolean(errors[item.name])} /></div>{error(item)}</div>;
    return <div key={item.name}>{label(item)}<input id={"config-" + item.name} type={item.kind === "number" ? "number" : item.kind === "phone" ? "tel" : "text"} min={item.kind === "number" ? item.min : undefined} max={item.kind === "number" ? item.max : undefined} step={item.kind === "number" ? item.step : undefined} value={typeof value === "string" || typeof value === "number" ? String(value) : ""} onChange={(event) => update(item.name, event.target.value)} placeholder={item.placeholder} className={controlClass(item.name)} aria-describedby={describedBy} aria-invalid={Boolean(errors[item.name])} />{help(item)}{error(item)}</div>;
  };
  return <form noValidate onSubmit={submit} className="space-y-5"><div><h3 className="font-semibold">Configure your product</h3><p className="mt-1 text-sm text-muted-foreground">Complete the requested details. Required fields are marked with an asterisk.</p></div><div className="grid gap-4 sm:grid-cols-2">{fields.map((item) => <div key={item.name} className={item.kind === "multiselect" || item.kind === "checkbox" || item.kind === "file" ? "sm:col-span-2" : ""}>{renderField(item)}</div>)}</div><p className="rounded-xl bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Demo mode only. Files are not uploaded, and this form does not connect to a live provider or activate a service.</p><button type="submit" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 text-sm font-semibold text-brand-fg transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Check className="size-4" />{submitLabel}</button></form>;
}
