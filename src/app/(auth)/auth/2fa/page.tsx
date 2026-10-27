"use client";
import { useRouter } from "next/navigation";
import { AuthCard } from "@/components/auth/AuthCard";
import { TwoFactorChallenge } from "@/components/auth/TwoFactorChallenge";
export default function TwoFactorPage() {
  const router = useRouter();
  return <div className="flex w-full justify-center"><AuthCard title="Verify it’s you" description="One more step to keep your account protected." className="max-w-md"><TwoFactorChallenge onSuccess={() => router.push("/dashboard")} /></AuthCard></div>;
}