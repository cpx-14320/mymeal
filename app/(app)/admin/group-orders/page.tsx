import { Section, Button } from "@/components/ui/primitives";
import { GroupOrdersTable } from "@/components/admin/group-orders-table";
import { DepartmentExport } from "@/components/admin/department-export";

export const metadata = { title: "團訂" };

export default function AdminGroupOrdersPage() {
  return (
    <div className="space-y-8">
      <Section
        title="團訂管理"
        description="所有團訂的狀態、結算與匯出；同一個模板可以被多個單位各自開團。"
        actions={<Button variant="secondary">代開團</Button>}
      >
        <GroupOrdersTable />
      </Section>

      <DepartmentExport />
    </div>
  );
}
