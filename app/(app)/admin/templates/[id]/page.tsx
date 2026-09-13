import { notFound } from "next/navigation";
import {
  Section,
  Button,
  ButtonLink,
  Badge,
  Card,
  CardBody,
  Note,
} from "@/components/ui/primitives";
import {
  templateById,
  templateKindLabel,
  supplierById,
  itemById,
} from "@/lib/mock";

export const metadata = { title: "編輯模板" };

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const template = templateById(id);
  if (!template) notFound();

  const supplier = supplierById(template.supplierId);

  return (
    <div className="space-y-8">
      <Section
        title={template.name}
        description="分類自由命名（星期一…／飲料…）；品項從「品項」挑。"
        actions={
          <div className="flex gap-2">
            <ButtonLink href="/admin/templates" variant="ghost">
              返回列表
            </ButtonLink>
            <Button variant="secondary">編輯基本資料</Button>
          </div>
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="brand">{templateKindLabel[template.kind]}</Badge>
          <Badge tone={template.active ? "positive" : "neutral"}>
            {template.active ? "啟用" : "停用"}
          </Badge>
          {supplier && <Badge>{supplier.name}</Badge>}
        </div>

        <Note>
          從這裡挑的品項參照「品項」；改品項的名稱或預設價會同步。想只改某一次開團的菜色，是在「開團」時調整，不動模板。
        </Note>
      </Section>

      <div className="space-y-4">
        {template.sections.map((sec) => (
          <Card key={sec.id}>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{sec.name}</span>
                  <span className="text-xs text-muted tabular-nums">
                    {sec.itemIds.length} 個品項
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm">
                    改名
                  </Button>
                  <Button variant="danger" size="sm">
                    刪除分類
                  </Button>
                </div>
              </div>

              <ul className="divide-y divide-line rounded-lg border border-line">
                {sec.itemIds.map((iid) => {
                  const it = itemById(iid);
                  if (!it) return null;
                  return (
                    <li
                      key={iid}
                      className="flex items-center justify-between gap-3 px-3 py-2.5"
                    >
                      <span className="flex items-center gap-2">
                        <span>{it.emoji}</span>
                        <span className="font-medium">{it.name}</span>
                        <span className="text-xs text-muted">
                          {supplierById(it.supplierId)?.name}
                        </span>
                      </span>
                      <span className="flex items-center gap-3">
                        <span className="text-sm tabular-nums text-muted">
                          NT$ {it.price}
                        </span>
                        <button className="text-muted hover:text-danger">
                          移除
                        </button>
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Button variant="secondary" size="sm">
                ＋ 從品項加入
              </Button>
            </CardBody>
          </Card>
        ))}
      </div>

      <Button variant="secondary">＋ 新增分類</Button>

      <p className="text-xs text-muted">＊此頁為介面預覽，操作尚未串接後端。</p>
    </div>
  );
}
