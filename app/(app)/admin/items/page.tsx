import { Section, ButtonLink, Note } from "@/components/ui/primitives";
import { ItemsTable } from "@/components/admin/items-table";

export const metadata = { title: "品項" };

export default function AdminItemsPage() {
  return (
    <div className="space-y-8">
      <Section
        title="品項"
        description="所有可訂購品項的唯一來源，模板從這裡挑。改名稱或預設價，所有引用同步。"
        actions={<ButtonLink href="/admin/items/new">新增品項</ButtonLink>}
      >
        <Note>
          「上週有雞腿飯、這週也有」→ 只要是同一筆品項，就是同一列資料；不用重複建立。
        </Note>

        <ItemsTable />
      </Section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
