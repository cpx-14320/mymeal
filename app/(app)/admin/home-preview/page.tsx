import { Section } from "@/components/ui/primitives";
import { HomePreviewForm } from "@/components/admin/home-preview-form";
import { listTemplates } from "@/lib/models/template";
import { getHomePreviewTemplateId } from "@/lib/models/site-settings";

export const metadata = { title: "首頁菜單預覽" };

export default async function AdminHomePreviewPage() {
  const [templates, currentTemplateId] = await Promise.all([
    listTemplates(),
    getHomePreviewTemplateId(),
  ]);

  return (
    <Section
      title="首頁菜單預覽"
      description="首頁（未登入訪客也看得到）的「本週菜單預覽」區塊，選一個模板後會改顯示這個模板前幾項品項；不指定就維持內建的範例假資料。"
    >
      <HomePreviewForm templates={templates} currentTemplateId={currentTemplateId} />
    </Section>
  );
}
