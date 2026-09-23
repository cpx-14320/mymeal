import { Section, ButtonLink, TableWrap, Th, Td } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { RolesTable } from "@/components/admin/roles-table";
import { permissionCategories } from "@/lib/mock";
import { listRoles } from "@/lib/models/role";

export const metadata = { title: "會員權限" };

export default async function AdminRolesPage() {
  const roles = await listRoles();

  return (
    <div className="space-y-8">
      <AdminHeaderActions>
        <ButtonLink href="/admin/roles/new" size="sm">新增組別</ButtonLink>
      </AdminHeaderActions>

      <Section>
        <Section
          title="組別"
          description="組別是權限鍵的組合，指派給會員整包套用；不同會員可以套用同一個組別的權限。"
        >
          <RolesTable roles={roles} />
        </Section>

        <Section title="權限矩陣" description="✓ 該組別具備此權限　– 無">
          <TableWrap>
            <thead>
              <tr>
                <Th>類別</Th>
                <Th>權限項目</Th>
                {roles.map((r) => (
                  <Th key={r.id} className="text-center">
                    {r.name}
                  </Th>
                ))}
              </tr>
            </thead>
            <tbody>
              {permissionCategories.map((cat) =>
                cat.items.map((p, i) => (
                  <tr key={p.key}>
                    {i === 0 && (
                      <Td
                        rowSpan={cat.items.length}
                        className="bg-surface-2 align-top text-muted"
                      >
                        {cat.label}
                      </Td>
                    )}
                    <Td className="font-mono">{p.label}</Td>
                    {roles.map((r) => (
                      <Td key={r.id} className="text-center">
                        {r.permissions[p.key] ? "✓" : "–"}
                      </Td>
                    ))}
                  </tr>
                )),
              )}
            </tbody>
          </TableWrap>
        </Section>
      </Section>
    </div>
  );
}
