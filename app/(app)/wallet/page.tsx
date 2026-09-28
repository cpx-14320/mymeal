import { redirect } from "next/navigation";
import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Stat,
  StatGrid3,
  COMPACT_STAT_VALUE_CLASS,
  ButtonLink,
} from "@/components/ui/primitives";
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
  // 儲值有被撤銷核准（topup_reversal，見 wallet.ts 的說明）、消費有被退款（refund）都要一起算進來，
  // 不然「本月儲值／本月消費」只看原始那筆，撤銷或退款之後金額看起來完全沒變，跟餘額對不起來。
  const monthlyTopup = ledger
    .filter((l) => (l.type === "topup" || l.type === "topup_reversal") && isThisMonth(l.at))
    .reduce((sum, l) => sum + l.amount, 0);
  const monthlySpend = -ledger
    .filter((l) => (l.type === "spend" || l.type === "refund") && isThisMonth(l.at))
    .reduce((sum, l) => sum + l.amount, 0);

  return (
    <PageContainer>
      <PageHeader
        title="錢包 / 儲值"
        description="以錢包餘額支付餐費。餘額不足時請提出儲值申請。"
        actions={<ButtonLink href="/wallet/topup">申請儲值</ButtonLink>}
      />

      <StatGrid3>
        <Stat label="目前餘額" value={`NT$ ${balance}`} valueClassName={COMPACT_STAT_VALUE_CLASS} />
        <Stat label="本月儲值" value={`NT$ ${monthlyTopup}`} valueClassName={COMPACT_STAT_VALUE_CLASS} />
        <Stat label="本月消費" value={`NT$ ${monthlySpend}`} valueClassName={COMPACT_STAT_VALUE_CLASS} />
      </StatGrid3>

      <WalletTabs ledger={ledger} requests={requests} />
    </PageContainer>
  );
}
