import { Section } from "@/components/ui/primitives";
import { GroupOrdersTable } from "@/components/admin/group-orders-table";
import { DepartmentExport } from "@/components/admin/department-export";
import { GroupOrderStats } from "@/components/admin/group-order-stats";
import { listGroupOrders } from "@/lib/models/group-order";
import { listDepartments } from "@/lib/models/org";
import { getDailyOrderStats } from "@/lib/models/reports";

export const metadata = { title: "團訂" };

const REPORT_RANGE_DAYS = 30;

export default async function AdminGroupOrdersPage() {
  const [rows, departments, daily] = await Promise.all([
    listGroupOrders(),
    listDepartments(),
    getDailyOrderStats(REPORT_RANGE_DAYS),
  ]);

  return (
    <div className="space-y-8">
      <GroupOrderStats daily={daily} />

      <Section>
        <GroupOrdersTable rows={rows} />
      </Section>

      <DepartmentExport departments={departments} />
    </div>
  );
}
