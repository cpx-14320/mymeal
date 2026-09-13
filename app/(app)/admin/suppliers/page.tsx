import { Section, Button } from "@/components/ui/primitives";
import { SuppliersTable } from "@/components/admin/suppliers-table";

export const metadata = { title: "店家" };

export default function AdminSuppliersPage() {
  return (
    <Section
      title="店家 / 供應商"
      description="便當店、飲料店、咖啡等。這裡只是「品項是誰做的」的標註，品項與模板不隸屬店家。"
      actions={<Button>新增店家</Button>}
    >
      <SuppliersTable />
    </Section>
  );
}
