import type { Metadata } from "next";
import { PageContainer, PageHeader, ButtonLink } from "@/components/ui/primitives";
import { GroupOrdersList } from "@/components/group-orders-list";
import { listGroupOrders } from "@/lib/models/group-order";
import { listTemplates } from "@/lib/models/template";
import { listUnits } from "@/lib/models/org";
import { getSessionMemberId } from "@/lib/session";

export const metadata: Metadata = { title: "開團訂餐" };

export default async function GroupOrdersPage() {
  const [rows, templates, units, memberId] = await Promise.all([
    listGroupOrders(),
    listTemplates(),
    listUnits(),
    getSessionMemberId(),
  ]);

  const categoryByTemplateId = Object.fromEntries(templates.map((t) => [t.id, t.categoryName]));

  return (
    <PageContainer>
      <PageHeader
        title="開團訂餐"
        description="開一個新團，或加入同事已經開好的團。便當、飲料、下午茶都在這裡。"
        actions={<ButtonLink href="/group-orders/new">開團</ButtonLink>}
      />

      <GroupOrdersList
        rows={rows}
        units={units.map((u) => ({ id: u.id, name: u.name }))}
        categoryByTemplateId={categoryByTemplateId}
        currentMemberId={memberId ?? ""}
      />
    </PageContainer>
  );
}
