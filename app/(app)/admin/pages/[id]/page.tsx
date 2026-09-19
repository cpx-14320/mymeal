import { notFound } from "next/navigation";
import { Section, ButtonLink } from "@/components/ui/primitives";
import { SupplierForm } from "@/components/admin/supplier-form";
import { findSupplierById } from "@/lib/models/supplier";

export const metadata = { title: "編輯店家" };

export default async function EditSupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supplier = await findSupplierById(id);
  if (!supplier) notFound();

  return (
    <Section
      title={`編輯店家：${supplier.name}`}
      description="便當店、飲料店、咖啡等。這裡只是「品項是誰做的」的標註，品項與模板不隸屬店家。"
      actions={
        <ButtonLink href="/admin/pages" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <SupplierForm supplier={supplier} />
    </Section>
  );
}
