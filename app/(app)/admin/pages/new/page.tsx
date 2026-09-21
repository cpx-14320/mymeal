import { Section, ButtonLink } from "@/components/ui/primitives";
import { SupplierForm } from "@/components/admin/supplier-form";
import { listTemplates } from "@/lib/models/template";

export const metadata = { title: "新增頁面" };

export default async function NewSupplierPage() {
  const templates = await listTemplates();
  return (
    <Section
      title="新增頁面"
      description="建立一個會顯示在前台導覽選單的訂購頁面，例如某家便當店或飲料店。可設定圖示、排序，並選擇顯示自己標註的品項，或改為套用某個模板。"
      actions={
        <ButtonLink href="/admin/pages" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <SupplierForm templates={templates} />
    </Section>
  );
}
