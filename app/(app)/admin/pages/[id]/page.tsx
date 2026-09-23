import { notFound } from "next/navigation";
import { Section } from "@/components/ui/primitives";
import { PageForm } from "@/components/admin/page-form";
import { findPageById } from "@/lib/models/page";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "編輯頁面" };

export default async function EditPagePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [page, templates] = await Promise.all([findPageById(id), listTemplates()]);
  if (!page) notFound();

  return (
    <Section
      title={`編輯頁面：${page.name}`}
      description="這是一個顯示在前台導覽選單的訂購頁面。可設定圖示、排序，並選擇顯示自己標註的品項，或改為套用某個模板。"
    >
      <PageForm page={page} templates={templates} />
    </Section>
  );
}
