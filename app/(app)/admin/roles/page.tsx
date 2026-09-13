import {
  Section,
  ButtonLink,
  Badge,
  Card,
  CardBody,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";
import {
  memberGroups,
  membersInGroup,
  permissionGroups,
  type PermissionLevel,
} from "@/lib/mock";

export const metadata = { title: "會員權限" };

function Mark({ v }: { v: PermissionLevel }) {
  if (v === "full") return <span className="font-bold text-positive">✓</span>;
  if (v === "own") return <span className="font-bold text-warning">△</span>;
  return <span className="text-line">–</span>;
}

export default function AdminRolesPage() {
  return (
    <div className="space-y-8">
      <Section
        title="組別"
        description="組別是權限鍵的組合，指派給會員整包套用；不同會員可以套用同一個組別的權限。"
        actions={<ButtonLink href="/admin/roles/new">新增組別</ButtonLink>}
      >
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {memberGroups.map((g) => {
            const permCount = permissionGroups.filter(
              (p) => g.permissions[p.key] !== "none",
            ).length;
            return (
              <Card key={g.key}>
                <CardBody className="space-y-2">
                  <p className="font-medium">{g.name}</p>
                  <p className="font-mono text-xs text-muted">{g.key}</p>
                  <div className="flex gap-1.5 pt-1">
                    <Badge>{permCount} 項權限</Badge>
                    <Badge tone="brand">{membersInGroup(g.name)} 人</Badge>
                  </div>
                  <ButtonLink
                    href={`/admin/roles/${g.key}`}
                    variant="secondary"
                    size="sm"
                    className="mt-1 w-full"
                  >
                    編輯權限
                  </ButtonLink>
                </CardBody>
              </Card>
            );
          })}
        </div>
      </Section>

      <Section title="權限矩陣" description="✓ 具備　△ 僅限自己　– 無">
        <TableWrap>
          <thead>
            <tr>
              <Th>權限群組</Th>
              {memberGroups.map((g) => (
                <Th key={g.key} className="text-center">
                  {g.name}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionGroups.map((p) => (
              <tr key={p.key}>
                <Td className="font-mono text-xs">{p.label}</Td>
                {memberGroups.map((g) => (
                  <Td key={g.key} className="text-center">
                    <Mark v={g.permissions[p.key]} />
                  </Td>
                ))}
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
