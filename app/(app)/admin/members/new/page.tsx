import { Section } from "@/components/ui/primitives";
import { MemberCreateForm } from "@/components/admin/member-create-form";
import { listDepartments, listUnits } from "@/lib/models/org";
import { listRoles } from "@/lib/models/role";

export const metadata = { title: "新增會員" };

export default async function NewMemberPage() {
  const [departments, units, roles] = await Promise.all([listDepartments(), listUnits(), listRoles()]);
  const roleNames = roles.map((r) => r.name);

  return (
    <Section
      title="新增會員"
      description="建立後即可登入使用，權限決定後台可操作的範圍。"
    >
      <MemberCreateForm departments={departments} units={units} roleNames={roleNames} />
    </Section>
  );
}
