import { Section } from "@/components/ui/primitives";
import { ItemForm } from "@/components/admin/item-form";
import { listItemCategories } from "@/lib/models/item-category";
import { listPages } from "@/lib/models/page";
import { listTagGroups } from "@/lib/models/tag-group";
import { newCatalogItemId } from "@/lib/models/catalog-item";

export const metadata = { title: "新增品項" };

export default async function NewItemPage() {
  const [categories, pages, tagGroups] = await Promise.all([
    listItemCategories(),
    listPages(),
    listTagGroups(),
  ]);
  // 先產生這個品項未來的 id，圖片選檔當下上傳就能用它命名（跟真正存檔後的品項 id 一致）。
  const pendingItemId = newCatalogItemId();

  return (
    <Section
      title="新增品項"
      description="新增後，此品項會出現在「品項設定」列表中，供各模板挑選使用。"
    >
      <ItemForm categories={categories} pages={pages} tagGroups={tagGroups} pendingItemId={pendingItemId} />
    </Section>
  );
}
