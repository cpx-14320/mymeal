import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader, Stat, ButtonLink } from "@/components/ui/primitives";
import { WalletTabs } from "@/components/wallet-tabs";
import { getSessionMemberId } from "@/lib/session";
import { getMemberBalance, listLedgerForMember } from "@/lib/models/wallet";
import { listTopupRequestsForMember } from "@/lib/models/topup-request";

export const metadata: Metadata = { title: "錢包 / 儲值" };

export default async function WalletPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const [balance, ledger, requests] = await Promise.all([
    getMemberBalance(memberId),
    listLedgerForMember(memberId),
    listTopupRequestsForMember(memberId),
  ]);

  const now = new Date();
  const isThisMonth = (d: Date) => d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  const monthlyTopup = ledger
    .filter((l) => l.type === "topup" && isThisMonth(l.at))
    .reduce((sum, l) => sum + l.amount, 0);
  const monthlySpend = ledger
    .filter((l) => l.type === "spend" && isThisMonth(l.at))
    .reduce((sum, l) => sum + Math.abs(l.amount), 0);

  return (
    <PageContainer>
      <PageHeader
        title="錢包 / 儲值"
        description="以錢包餘額支付餐費。餘額不足時請提出儲值申請。"
        actions={<ButtonLink href="/wallet/topup">申請儲值</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="目前餘額" value={`NT$ ${balance}`} />
        <Stat label="本月儲值" value={`NT$ ${monthlyTopup}`} />
        <Stat label="本月消費" value={`NT$ ${monthlySpend}`} />
      </div>

      <WalletTabs ledger={ledger} requests={requests} />
    </PageContainer>
  );
}
