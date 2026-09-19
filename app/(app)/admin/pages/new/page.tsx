import { Section, ButtonLink } from "@/components/ui/primitives";
import { SupplierForm } from "@/components/admin/supplier-form";

export const metadata = { title: "新增店家" };

export default function NewSupplierPage() {
  return (
    <Section
      title="新增店家"
      description="便當店、飲料店、咖啡等。這裡只是「品項是誰做的」的標註，品項與模板不隸屬店家。"
      actions={
        <ButtonLink href="/admin/pages" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <SupplierForm />
    </Section>
  );
}
