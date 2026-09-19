import { Section } from "@/components/ui/primitives";
import { GroupOrdersTable } from "@/components/admin/group-orders-table";
import { DepartmentExport } from "@/components/admin/department-export";
import { listGroupOrders } from "@/lib/models/group-order";
import { listDepartments } from "@/lib/models/org";

export const metadata = { title: "團訂" };

export default async function AdminGroupOrdersPage() {
  const [rows, departments] = await Promise.all([listGroupOrders(), listDepartments()]);

  return (
    <div className="space-y-8">
      <Section
        title="團訂管理"
        description="所有團訂的狀態與部門/單位彙總；同一個模板可以被多個單位各自開團。"
      >
        <GroupOrdersTable rows={rows} />
      </Section>

      <DepartmentExport departments={departments} />
    </div>
  );
}
