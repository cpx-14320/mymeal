import { notFound } from "next/navigation";
import { Section, Button, ButtonLink } from "@/components/ui/primitives";
import { PromoForm } from "@/components/admin/promo-form";
import { interstitialById } from "@/lib/mock";

export const metadata = { title: "編輯廣告" };

export default async function EditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = interstitialById(id);
  if (!promo) notFound();

  return (
    <Section
      title={`編輯廣告：${promo.name}`}
      description="修改圖片、連結、倒數秒數或排程。"
      actions={
        <ButtonLink href="/admin/promos" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <PromoForm promo={promo} />

      <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
        <Button variant="danger">刪除廣告</Button>
        <div className="flex gap-2">
          <ButtonLink href="/admin/promos" variant="ghost">
            取消
          </ButtonLink>
          <Button>儲存</Button>
        </div>
      </div>

      <p className="mt-3 text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </Section>
  );
}
