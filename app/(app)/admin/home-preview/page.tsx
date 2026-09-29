import { Section } from "@/components/ui/primitives";
import { HomePreviewForm } from "@/components/admin/home-preview-form";
import { listTemplates } from "@/lib/models/template";
import { getHomePreviewConfig } from "@/lib/models/site-settings";

export const metadata = { title: "首頁菜單預覽" };

export default async function AdminHomePreviewPage() {
  const [templates, current] = await Promise.all([listTemplates(), getHomePreviewConfig()]);

  return (
    <Section
      title="首頁菜單預覽"
      description="首頁（未登入訪客也看得到）的「本週菜單預覽」區塊，選一個模板後會改顯示這個模板的品項；可以再指定只顯示其中一個區塊，不指定就混合該模板全部區塊。都不選就維持內建的範例假資料。"
    >
      <HomePreviewForm
        templates={templates}
        currentTemplateId={current.templateId}
        currentSectionId={current.sectionId}
      />
    </Section>
  );
}
