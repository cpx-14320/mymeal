import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { TopupForm } from "@/components/wallet-topup-form";
import { getSessionMemberId } from "@/lib/session";

export const metadata: Metadata = { title: "申請儲值" };

export default async function TopupPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  return <TopupForm memberId={memberId} />;
}
