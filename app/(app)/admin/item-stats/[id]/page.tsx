import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, ButtonLink, Stat } from "@/components/ui/primitives";
import { ItemCommentsTable } from "@/components/admin/item-comments-table";
import { findItemStatById, findCatalogItemById } from "@/lib/models/catalog-item";
import { listReviewsForItem } from "@/lib/models/item-review";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const stat = await findItemStatById(id);
  return { title: stat ? `餐點統計：${stat.itemName}` : "餐點統計" };
}

export default async function ItemStatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [stat, item] = await Promise.all([findItemStatById(id), findCatalogItemById(id)]);
  if (!stat || !item) notFound();

  const comments = await listReviewsForItem(id);

  return (
    <div className="space-y-8">
      <Section
        title={`餐點統計：${stat.itemName}`}
        description={`${item.categoryName}．NT$ ${stat.price}`}
        actions={
          <ButtonLink href="/admin/item-stats" variant="ghost">
            返回列表
          </ButtonLink>
        }
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="總訂購數量" value={stat.totalQuantity} />
          <Stat label="被訂購次數" value={stat.orderCount} />
          <Stat
            label="平均評分"
            value={stat.avgRating !== null ? stat.avgRating.toFixed(1) : "—"}
          />
          <Stat label="評論數" value={stat.commentCount} />
        </div>
      </Section>

      <Section title="評論留言" description="所有會員對這個品項留下的評論。">
        <ItemCommentsTable comments={comments} />
      </Section>
    </div>
  );
}
