import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { MembersTable } from "@/components/admin/members-table";
import { listMembers } from "@/lib/models/member";

export const metadata = { title: "會員列表" };

export default async function AdminMembersPage() {
  const members = await listMembers();

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/members/new" size="sm">新增會員</ButtonLink>
      </AdminHeaderActions>

      <MembersTable members={members} />
    </Section>
  );
}
