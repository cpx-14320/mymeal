import { Section } from "@/components/ui/primitives";
import { GroupOrdersTable } from "@/components/admin/group-orders-table";
import { DepartmentExport } from "@/components/admin/department-export";
import { listGroupOrders } from "@/lib/models/group-order";
import { listTemplates } from "@/lib/models/template";
import { listDepartments, listUnits } from "@/lib/models/org";
import { listMembers } from "@/lib/models/member";
import { getSettings } from "@/lib/models/settings";

export const metadata = { title: "團訂" };

export default async function AdminGroupOrdersPage() {
  const [rows, templates, departments, units, members, settings] = await Promise.all([
    listGroupOrders(),
    listTemplates(),
    listDepartments(),
    listUnits(),
    listMembers(),
    getSettings(),
  ]);

  return (
    <div className="space-y-8">
      <Section
        title="團訂管理"
        description="所有團訂的狀態與部門/單位彙總；同一個模板可以被多個單位各自開團。"
      >
        <GroupOrdersTable
          rows={rows}
          templates={templates.filter((t) => t.active).map((t) => ({ id: t.id, name: t.name }))}
          units={units.map((u) => ({ id: u.id, name: u.name, departmentName: u.departmentName }))}
          members={members.map((m) => ({ id: m.id, name: m.name }))}
          pickupLocations={settings.pickupLocations}
          deadlineDefaultHint={settings.orderDeadlineDefault}
          underMinPolicy={settings.underMinPolicy}
        />
      </Section>

      <DepartmentExport departments={departments} />
    </div>
  );
}
