"use client";

const checks = [
  { label: "8+ characters", test: (value: string) => value.length >= 8 },
  { label: "Upper and lowercase", test: (value: string) => /[a-z]/.test(value) && /[A-Z]/.test(value) },
  { label: "A number", test: (value: string) => /\d/.test(value) },
  { label: "A symbol", test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

export function PasswordStrength({ password }: { password: string }) {
  const score = checks.filter((check) => check.test(password)).length;
  const labels = ["Enter a password", "Weak", "Fair", "Good", "Strong"];
  return (
    <div className="mt-2 space-y-2" aria-live="polite">
      <div className="flex gap-1.5" aria-label={"Password strength: " + labels[score]}>
        {checks.map((check, index) => (
          <span key={check.label} className={"h-1.5 flex-1 rounded-full transition-colors " + (index < score ? (score < 2 ? "bg-destructive" : score < 3 ? "bg-amber-500" : "bg-emerald-500") : "bg-muted")} />
        ))}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{labels[score]}</span>
        <span>{checks.filter((check) => check.test(password)).length} of 4 checks</span>
      </div>
    </div>
  );
}