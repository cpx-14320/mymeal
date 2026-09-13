import { notFound } from "next/navigation";
import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { itemById } from "@/lib/mock";

export const metadata = { title: "編輯品項" };

export default async function EditItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = itemById(id);
  if (!item) notFound();

  return (
    <Section
      title={`編輯品項：${item.name}`}
      description="改名稱或預設價，所有引用此品項的模板同步；已成立的歷史訂單已快照，不受影響。"
      actions={
        <ButtonLink href="/admin/items" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ItemForm item={item} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger">刪除品項</Button>
        <div className="flex gap-2">
          <ButtonLink href="/admin/items" variant="ghost">
            取消
          </ButtonLink>
          <Button>儲存</Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
