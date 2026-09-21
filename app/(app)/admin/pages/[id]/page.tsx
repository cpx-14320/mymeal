import { notFound } from "next/navigation";
import { Section, ButtonLink } from "@/components/ui/primitives";
import { SupplierForm } from "@/components/admin/supplier-form";
import { findSupplierById } from "@/lib/models/supplier";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "編輯頁面" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [supplier, templates] = await Promise.all([findSupplierById(id), listTemplates()]);
  if (!supplier) notFound();

  return (
    <Section
      title={`編輯頁面：${supplier.name}`}
      description="這是一個顯示在前台導覽選單的訂購頁面。可設定圖示、排序，並選擇顯示自己標註的品項，或改為套用某個模板。"
      actions={
        <ButtonLink href="/admin/pages" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <SupplierForm supplier={supplier} templates={templates} />
    </Section>
  );
}
