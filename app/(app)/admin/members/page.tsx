import { Section, ButtonLink, inputClass } from "@/components/ui/primitives";
import { MembersTable } from "@/components/admin/members-table";

export const metadata = { title: "會員" };

export default function AdminMembersPage() {
  return (
    <Section
      title="會員管理"
      description="註冊審核、停權 / 復權、權限指派。"
      actions={
        <div className="flex gap-2">
          <input className={`${inputClass} w-48`} placeholder="搜尋姓名 / 帳號" />
          <ButtonLink href="/admin/members/new">新增會員</ButtonLink>
        </div>
      }
    >
      <MembersTable />
    </Section>
  );
}
