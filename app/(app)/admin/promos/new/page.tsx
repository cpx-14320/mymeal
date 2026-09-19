import { Section, ButtonLink } from "@/components/ui/primitives";
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
    </Section>
  );
}
