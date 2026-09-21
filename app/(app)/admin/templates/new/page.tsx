import { Section, ButtonLink } from "@/components/ui/primitives";
import { TemplateCreateForm } from "@/components/admin/template-create-form";
import { listSuppliers } from "@/lib/models/supplier";
import { listItemKinds } from "@/lib/models/item-kind";

export const metadata = { title: "新增模板" };

export default async function NewTemplatePage() {
  const [suppliers, kinds] = await Promise.all([listSuppliers(), listItemKinds()]);

  return (
    <Section
      title="新增模板"
      description="模板是開團訂餐時套用的菜單藍圖，內含多個分類（例如依星期或依餐別區分），每個分類底下可勾選要開放訂購的品項。建立後會進入編輯頁繼續設定分類與品項。"
      actions={
        <ButtonLink href="/admin/templates" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <TemplateCreateForm suppliers={suppliers} kinds={kinds} />
    </Section>
  );
}
