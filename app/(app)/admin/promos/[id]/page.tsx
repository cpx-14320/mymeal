import { notFound } from "next/navigation";
import { Section, ButtonLink } from "@/components/ui/primitives";
import { PromoForm } from "@/components/admin/promo-form";
import { findInterstitialById } from "@/lib/models/interstitial";

export const metadata = { title: "編輯廣告" };

export default async function EditPromoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = await findInterstitialById(id);
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
    </Section>
  );
}
