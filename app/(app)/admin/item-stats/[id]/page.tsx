import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, ButtonLink, Stat } from "@/components/ui/primitives";
import { ItemCommentsTable } from "@/components/admin/item-comments-table";
import { itemById, itemStatById, itemComments } from "@/lib/mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const item = itemById(id);
  return { title: item ? `餐點統計：${item.name}` : "餐點統計" };
}

export default async function ItemStatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = itemById(id);
  const stat = itemStatById(id);
  if (!item || !stat) notFound();

  const comments = itemComments(id);

  return (
    <div className="space-y-8">
      <Section
        title={`餐點統計：${item.name}`}
        description={`${item.category}．NT$ ${item.price}`}
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

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
