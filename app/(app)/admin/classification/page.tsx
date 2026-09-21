import { Section, Card, CardBody } from "@/components/ui/primitives";
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

export const metadata = { title: "類別設定" };

export default async function AdminItemClassificationPage() {
  const [kinds, categories, tagGroups] = await Promise.all([
    listItemKinds(),
    listItemCategories(),
    listTagGroups(),
  ]);

  return (
    <div className="space-y-8">
      <Section>
        <div className="grid gap-4 sm:grid-cols-2">
          <NameListCard
            title="品項類型"
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
            placeholder="例：湯品"
            items={categories}
            createAction={createCategoryAction}
            updateAction={updateCategoryAction}
            deleteAction={deleteCategoryAction}
            confirmTitle="確認刪除分類"
            confirmMessage="刪除「{name}」前，請先確認沒有品項還在用這個分類。確定要刪除嗎？"
          />
        </div>

        <Card>
          <CardBody className="space-y-4">
            <Section
              title="品項標籤"
              titleClassName="text-base font-medium"
              actions={<AddTagGroupButton />}
            >
              <TagGroupsManager groups={tagGroups} />
            </Section>
          </CardBody>
        </Card>
      </Section>
    </div>
  );
}
