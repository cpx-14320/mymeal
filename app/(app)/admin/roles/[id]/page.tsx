import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section, ButtonLink } from "@/components/ui/primitives";
import { RoleForm } from "@/components/admin/role-form";
import { findRoleById } from "@/lib/models/role";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const role = await findRoleById(id);
  return { title: role ? `編輯權限：${role.name}` : "編輯權限" };
}

export default async function EditRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const role = await findRoleById(id);
  if (!role) notFound();

  return (
    <Section
      title={`編輯權限：${role.name}`}
      description={`目前有 ${role.memberCount} 位會員套用這個組別；調整後，套用這個組別的會員會一起套用新設定。`}
      actions={
        <ButtonLink href="/admin/roles" variant="ghost">
          返回列表
        </ButtonLink>
      }
    >
      <RoleForm role={role} />
    </Section>
  );
}
