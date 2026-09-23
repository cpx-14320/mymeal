import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Section } from "@/components/ui/primitives";
import { MemberEditForm } from "@/components/admin/member-edit-form";
import { findMemberById } from "@/lib/models/member";
import { listDepartments, listUnits } from "@/lib/models/org";
import { listRoles } from "@/lib/models/role";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const member = await findMemberById(id);
  return { title: member ? `編輯會員：${member.name}` : "編輯會員" };
}

export default async function EditMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [doc, departments, units, roles] = await Promise.all([
    findMemberById(id),
    listDepartments(),
    listUnits(),
    listRoles(),
  ]);
  if (!doc) notFound();
  const roleNames = roles.map((r) => r.name);

  const member = {
    id: String(doc._id),
    account: doc.account,
    email: doc.email,
    name: doc.name,
    employeeId: doc.employeeId,
    dept: doc.dept,
    unit: doc.unit,
    memberCode: doc.memberCode,
    referredByCode: doc.referredByCode,
    referredByName: doc.referredByName,
    role: doc.role,
    status: doc.status,
    createdAt: doc.createdAt,
    lastLoginAt: doc.lastLoginAt,
  };

  return (
    <Section
      title={`編輯會員：${member.name}`}
      description="改權限或狀態會立即影響該會員可操作的範圍。"
    >
      <MemberEditForm member={member} departments={departments} units={units} roleNames={roleNames} />
    </Section>
  );
}
