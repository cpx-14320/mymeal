import { Section, ButtonLink } from "@/components/ui/primitives";
import { MembersTable } from "@/components/admin/members-table";
import { listMembers } from "@/lib/models/member";

export const metadata = { title: "會員列表" };

export default async function AdminMembersPage() {
  const members = await listMembers();

  return (
    <Section
      title="會員列表"
      description="註冊審核、停權 / 復權、權限指派。"
      actions={<ButtonLink href="/admin/members/new">新增會員</ButtonLink>}
    >
      <MembersTable members={members} />
    </Section>
  );
}
