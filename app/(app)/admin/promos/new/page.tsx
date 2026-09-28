import { Section } from "@/components/ui/primitives";
import { PromoForm } from "@/components/admin/promo-form";
import { newInterstitialId } from "@/lib/models/interstitial";

export const metadata = { title: "新增廣告" };

export default function NewPromoPage() {
  // 先產生這則廣告未來的 id，圖片選檔當下上傳就能用它命名（跟真正存檔後的廣告 id 一致）。
  const pendingPromoId = newInterstitialId();

  return (
    <Section
      title="新增蓋台廣告"
      description="設定好圖片與排程，開啟後在排程時間內會顯示於前台。"
    >
      <PromoForm pendingPromoId={pendingPromoId} />
    </Section>
  );
}
