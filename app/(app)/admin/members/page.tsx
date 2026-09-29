import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { MembersTable } from "@/components/admin/members-table";
import { listMembers } from "@/lib/models/member";

export const metadata = { title: "會員列表" };

export default async function AdminMembersPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; updated?: string }>;
}) {
  const [members, params] = await Promise.all([listMembers(), searchParams]);

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/members/new" size="sm">新增會員</ButtonLink>
      </AdminHeaderActions>

      <MembersTable
        members={members}
        justCreated={params.created === "1"}
        justUpdated={params.updated === "1"}
      />
    </Section>
  );
}
