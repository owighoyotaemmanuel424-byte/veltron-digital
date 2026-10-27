"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Eye, EyeOff, UserRound } from "lucide-react";
import { toast } from "sonner";
import { AuthCard } from "@/components/auth/AuthCard";
import { OAuthButtons } from "@/components/auth/OAuthButton";
import { PasswordStrength } from "@/components/auth/PasswordStrength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { demoSignup } from "@/lib/demo/auth";

const schema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  email: z.email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your password."),
  terms: z.boolean().refine((value) => value, "Accept the terms to continue."),
}).refine((value) => value.password === value.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match." });
type FormValues = z.infer<typeof schema>;

export default function SignupPage() {
  const router = useRouter();
  const [showPassword, setShowPassword] = React.useState(false);
  const { register, handleSubmit, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "", terms: false },
    mode: "onChange",
  });
  const password = watch("password") || "";

  async function submit(values: FormValues) {
    const result = await demoSignup({ name: values.name, email: values.email, password: values.password });
    if (!result.ok) { toast.error(result.message); return; }
    toast.success(result.message);
    router.push("/dashboard");
  }

  return (
    <AuthCard title="Create your account" description="Start with a few details. You can refine your profile later." footer={<>Already have an account? <Link href="/login" className="font-medium text-brand hover:underline">Sign in</Link></>}>
      <div className="mb-5"><OAuthButtons /></div>
      <div className="mb-5 flex items-center gap-3 text-xs text-muted-foreground"><span className="h-px flex-1 bg-border" />or sign up with email<span className="h-px flex-1 bg-border" /></div>
      <form onSubmit={handleSubmit(submit)} className="space-y-3.5" noValidate>
        <div className="space-y-1"><label htmlFor="signup-name" className="text-sm font-medium">Full name</label><Input id="signup-name" autoComplete="name" placeholder="Your name" {...register("name")} />{errors.name ? <p className="text-xs text-destructive">{errors.name.message}</p> : null}</div>
        <div className="space-y-1"><label htmlFor="signup-email" className="text-sm font-medium">Email address</label><Input id="signup-email" type="email" autoComplete="email" placeholder="you@example.com" {...register("email")} />{errors.email ? <p className="text-xs text-destructive">{errors.email.message}</p> : null}</div>
        <div className="space-y-1"><label htmlFor="signup-password" className="text-sm font-medium">Password</label><div className="relative"><Input id="signup-password" type={showPassword ? "text" : "password"} autoComplete="new-password" placeholder="Create a strong password" className="pr-10" {...register("password")} /><button type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div><PasswordStrength password={password} />{errors.password ? <p className="text-xs text-destructive">{errors.password.message}</p> : null}</div>
        <div className="space-y-1"><label htmlFor="signup-confirm" className="text-sm font-medium">Confirm password</label><Input id="signup-confirm" type="password" autoComplete="new-password" placeholder="Enter it again" {...register("confirmPassword")} />{errors.confirmPassword ? <p className="text-xs text-destructive">{errors.confirmPassword.message}</p> : null}</div>
        <div className="space-y-1"><label className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><input type="checkbox" className="mt-1 size-4 shrink-0 accent-brand" {...register("terms")} /><span>I agree to the <Link href="/terms" className="text-brand hover:underline">Terms of Service</Link> and <Link href="/privacy" className="text-brand hover:underline">Privacy Policy</Link>.</span></label>{errors.terms ? <p className="text-xs text-destructive">{errors.terms.message}</p> : null}</div>
        <Button type="submit" className="w-full" disabled={isSubmitting}>{isSubmitting ? "Creating account…" : <><UserRound className="size-4" /> Create account</>}</Button>
        <p className="text-center text-xs leading-5 text-muted-foreground">Demo preview only. No real account or password is stored.</p>
      </form>
    </AuthCard>
  );
}