import { Section } from "@/components/ui/primitives";
import { NameListCard } from "@/components/admin/name-list-card";
import { OrgUnitSection } from "@/components/admin/org-unit-section";
import { listDepartments, listUnits } from "@/lib/models/org";
import {
  createDepartmentAction,
  updateDepartmentAction,
  deleteDepartmentAction,
  createUnitAction,
  updateUnitAction,
  deleteUnitAction,
} from "./actions";

export const metadata = { title: "部門與單位" };

export default async function AdminOrgPage() {
  const [departments, units] = await Promise.all([listDepartments(), listUnits()]);

  return (
    <Section>
      <div className="grid gap-4 sm:grid-cols-2">
        <NameListCard
          title="部門"
          description="會員註冊、編輯會員時可選擇的部門。"
          placeholder="例：網路發展部"
          items={departments}
          createAction={createDepartmentAction}
          updateAction={updateDepartmentAction}
          deleteAction={deleteDepartmentAction}
          confirmTitle="確認刪除部門"
          confirmMessage="刪除「{name}」會連同底下單位一起刪除，確定要刪除嗎？"
        />
        <OrgUnitSection
          units={units}
          departments={departments}
          createAction={createUnitAction}
          updateAction={updateUnitAction}
          deleteAction={deleteUnitAction}
        />
      </div>
    </Section>
  );
}
