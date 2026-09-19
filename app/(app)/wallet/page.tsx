import type { Metadata } from "next";
import { PageContainer, PageHeader, Stat, ButtonLink } from "@/components/ui/primitives";
import { WalletTabs } from "@/components/wallet-tabs";
import { currentMemberId, memberInsightById } from "@/lib/mock";

export const metadata: Metadata = { title: "錢包 / 儲值" };

export default function WalletPage() {
  const balance = memberInsightById(currentMemberId)?.balance ?? 0;

  return (
    <PageContainer>
      <PageHeader
        title="錢包 / 儲值"
        description="以錢包餘額支付餐費。餘額不足時請提出儲值申請。"
        actions={<ButtonLink href="/wallet/topup">申請儲值</ButtonLink>}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <Stat label="目前餘額" value={`NT$ ${balance}`} />
        <Stat label="本月儲值" value="NT$ 500" />
        <Stat label="本月消費" value="NT$ 285" />
      </div>

      <WalletTabs />
    </PageContainer>
  );
}
