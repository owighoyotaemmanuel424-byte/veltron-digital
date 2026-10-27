export type DemoResult = { ok: true; message: string } | { ok: false; message: string; code?: "RATE_LIMIT" | "INVALID" };

const wait = (ms = 650) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function demoLogin(input: { email: string; password: string; remember: boolean }): Promise<DemoResult> {
  await wait();
  if (input.email.toLowerCase().includes("rate-limit")) {
    return { ok: false, code: "RATE_LIMIT", message: "Too many attempts. Please wait a moment and try again." };
  }
  if (input.password.trim().length < 1) return { ok: false, code: "INVALID", message: "Enter your password to continue." };
  return { ok: true, message: "Demo sign-in successful." };
}

export async function demoSignup(input: { name: string; email: string; password: string }): Promise<DemoResult> {
  await wait(850);
  if (input.email.toLowerCase().includes("exists")) {
    return { ok: false, code: "INVALID", message: "An account with this email already exists." };
  }
  return { ok: true, message: "Your demo account is ready." };
}

export async function demoVerifyOtp(code: string): Promise<DemoResult> {
  await wait(500);
  if (code.length !== 6 || !/^\d{6}$/.test(code)) return { ok: false, code: "INVALID", message: "Enter the six-digit verification code." };
  if (code === "000000") return { ok: false, code: "INVALID", message: "That code has expired. Request a new code." };
  return { ok: true, message: "Verification complete." };
}

export async function demoResendOtp(): Promise<DemoResult> {
  await wait(450);
  return { ok: true, message: "A new demo verification code is ready. Use any six digits except 000000." };
}

export async function demoRequestPasswordReset(email: string): Promise<DemoResult> {
  await wait(650);
  if (!email.includes("@")) return { ok: false, code: "INVALID", message: "Enter a valid email address." };
  return { ok: true, message: "If an account exists, a verification code has been sent." };
}

export async function demoResetPassword(password: string): Promise<DemoResult> {
  await wait(700);
  if (password.length < 8) return { ok: false, code: "INVALID", message: "Choose a password with at least 8 characters." };
  return { ok: true, message: "Your demo password has been updated." };
}

export async function demoOAuth(provider: "Google" | "Apple"): Promise<DemoResult> {
  await wait(450);
  return { ok: true, message: provider + " sign-in is a demo preview and is not connected to an identity provider." };
}