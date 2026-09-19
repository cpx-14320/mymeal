import { Section } from "@/components/ui/primitives";
import { NameListCard } from "@/components/admin/name-list-card";
import { TagGroupsManager, AddTagGroupButton } from "@/components/admin/tag-groups";
import { listItemKinds } from "@/lib/models/item-kind";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";
import { createKindAction, updateKindAction, deleteKindAction } from "@/app/(app)/admin/items/kinds/actions";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
} from "@/app/(app)/admin/items/categories/actions";

export const metadata = { title: "分類與標籤" };

export default async function AdminItemClassificationPage() {
  const [kinds, categories, tagGroups] = await Promise.all([
    listItemKinds(),
    listItemCategories(),
    listTagGroups(),
  ]);

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2">
        <NameListCard
          title="品項類型"
          description="餐點／飲料／點心…。跟「分類」「標籤」都不一樣，是品項最上層的種類。"
          placeholder="例：甜點"
          items={kinds}
          createAction={createKindAction}
          updateAction={updateKindAction}
          deleteAction={deleteKindAction}
          confirmTitle="確認刪除類型"
          confirmMessage="刪除「{name}」前，請先確認沒有品項還在用這個類型。確定要刪除嗎？"
        />
        <NameListCard
          title="品項分類"
          description="用來替品項分群（便當／餐盒…），跟「標籤」與「模板分類（星期幾）」都不一樣。"
          placeholder="例：湯品"
          items={categories}
          createAction={createCategoryAction}
          updateAction={updateCategoryAction}
          deleteAction={deleteCategoryAction}
          confirmTitle="確認刪除分類"
          confirmMessage="刪除「{name}」前，請先確認沒有品項還在用這個分類。確定要刪除嗎？"
        />
      </div>

      <Section
        title="品項標籤"
        description="主食（飯／麵…）、肉類（雞／豬／羊…）、飲食、甜度冰塊…。編輯品項時從這些選項勾選。"
        actions={<AddTagGroupButton />}
      >
        <TagGroupsManager groups={tagGroups} />
      </Section>
    </div>
  );
}
