import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";

export const metadata = { title: "新增品項" };

export default function NewItemPage() {
  return (
    <Section
      title="新增品項"
      description="加進品項後，就能在模板裡選用。"
      actions={
        <ButtonLink href="/admin/items" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <ItemForm />

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/items" variant="ghost">
          取消
        </ButtonLink>
        <Button>建立品項</Button>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
