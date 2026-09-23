import { Section } from "@/components/ui/primitives";
import { RoleForm } from "@/components/admin/role-form";

export const metadata = { title: "新增組別" };

export default function NewRolePage() {
  return (
    <Section
      title="新增組別"
      description="建立後即可指派給會員，多個會員可以套用同一個組別。"
    >
      <RoleForm />
    </Section>
  );
}
