import { Section, Card, CardBody } from "@/components/ui/primitives";
import { NameListCard } from "@/components/admin/name-list-card";
import { TagGroupsManager, AddTagGroupButton } from "@/components/admin/tag-groups";
import { listItemCategories } from "@/lib/models/item-category";
import { listTagGroups } from "@/lib/models/tag-group";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  reorderCategoryAction,
} from "@/app/(app)/admin/items/categories/actions";

export const metadata = { title: "類別設定" };

export default async function AdminItemClassificationPage() {
  const [categories, tagGroups] = await Promise.all([listItemCategories(), listTagGroups()]);

  return (
    <div className="space-y-8">
      <Section>
        <NameListCard
          title="品項分類"
          placeholder="例：便當"
          items={categories}
          createAction={createCategoryAction}
          updateAction={updateCategoryAction}
          deleteAction={deleteCategoryAction}
          reorderAction={reorderCategoryAction}
          layout="grid"
          confirmTitle="確認刪除分類"
          confirmMessage="刪除「{name}」前，請先確認沒有品項還在用這個分類。確定要刪除嗎？"
        />

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
