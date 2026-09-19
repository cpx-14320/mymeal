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
    <Section
      title="部門與單位"
      description="註冊表單與會員編輯頁的部門/單位選項；新增後即可套用，不用改程式碼。單位一律隸屬於一個部門，刪除部門會連同底下單位一起刪除；改名會同步更新既有會員的部門/單位資料。"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <NameListCard
          title="部門"
          description="會員註冊、編輯會員時可選擇的部門。"
          placeholder="例：財務部"
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
