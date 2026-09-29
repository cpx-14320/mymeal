import { Section } from "@/components/ui/primitives";
import { PageForm } from "@/components/admin/page-form";
import { listTemplates } from "@/lib/models/template";
import { getNextPageSortOrder } from "@/lib/models/page";

export const metadata = { title: "新增頁面" };

export default async function NewPagePage() {
  const [templates, defaultSortOrder] = await Promise.all([listTemplates(), getNextPageSortOrder()]);
  return (
    <Section
      title="新增頁面"
      description="建立一個會顯示在前台導覽選單的訂購頁面，例如某家便當店或飲料店。可設定圖示、排序，並選擇顯示自己標註的品項，或改為套用某個模板。"
    >
      <PageForm templates={templates} defaultSortOrder={defaultSortOrder} />
    </Section>
  );
}
