import { Section, Button } from "@/components/ui/primitives";
import { itemCategories } from "@/lib/mock";

export const metadata = { title: "品項分類" };

export default function AdminItemCategoriesPage() {
  return (
    <Section
      title="品項分類"
      description="用來替品項分群（便當／餐盒…），跟「標籤」與「模板分類（星期幾）」都不一樣。"
      actions={<Button variant="secondary">新增分類</Button>}
    >
      <div className="flex flex-wrap gap-2">
        {itemCategories.map((c) => (
          <span
            key={c}
            className="inline-flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-1.5 text-sm"
          >
            {c}
            <button className="text-muted hover:text-danger">✕</button>
          </span>
        ))}
      </div>
    </Section>
  );
}
