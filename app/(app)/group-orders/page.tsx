import type { Metadata } from "next";
import { PageContainer, PageHeader, ButtonLink } from "@/components/ui/primitives";
import { GroupOrdersList } from "@/components/group-orders-list";

export const metadata: Metadata = { title: "開團訂餐" };

export default function GroupOrdersPage() {
  return (
    <PageContainer>
      <PageHeader
        title="開團訂餐"
        description="開一個新團，或加入同事已經開好的團。便當、飲料、下午茶都在這裡。"
        actions={<ButtonLink href="/group-orders/new">開團</ButtonLink>}
      />

      <GroupOrdersList />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
