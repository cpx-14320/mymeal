import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { PromoForm } from "@/components/admin/promo-form";

export const metadata = { title: "新增廣告" };

export default function NewPromoPage() {
  return (
    <Section
      title="新增蓋台廣告"
      description="設定好圖片與排程，開啟後在排程時間內會顯示於前台。"
      actions={
        <ButtonLink href="/admin/promos" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <PromoForm />

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/promos" variant="ghost">
          取消
        </ButtonLink>
        <Button>建立廣告</Button>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
