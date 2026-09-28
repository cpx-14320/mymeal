"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PillTabs,
  TableWrap,
  Th,
  Td,
  Pagination,
  ItemLabel,
  Button,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import { ItemGrid } from "@/components/item-grid";
import { ItemReviewModal } from "@/components/item-review-modal";
import { formatTaiwanDateTime } from "@/lib/date";
import type { CatalogItemView } from "@/lib/models/catalog-item";
import type { ItemCategoryOption } from "@/lib/models/item-category";
import type { ItemStat, ItemReviewView } from "@/lib/models/item-review";

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

type Tab = "favorites" | "reviews";

/** 「我的收藏」頁面共用兩個分頁：收藏（沿用原本的 ItemGrid 卡片牆）跟我的評論
 *  （這位會員對品項留下的所有星等／留言，仿照後台會員洞察的評論表格）。 */
export function FavoritesTabs({
  items,
  stats,
  categories,
  favoriteItemIds,
  reviews,
}: {
  items: CatalogItemView[];
  stats: Record<string, ItemStat>;
  categories: ItemCategoryOption[];
  favoriteItemIds: string[];
  reviews: ItemReviewView[];
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("favorites");
  const [page, setPage] = useState(1);
  const [editingItem, setEditingItem] = useState<{ id: string; name: string } | null>(null);

  const { pageRows, pageCount, current, effectiveSize } = paginate(reviews, page, DEFAULT_PAGE_SIZE);

  return (
    <div className="space-y-4">
      <PillTabs
        tabs={[
          { key: "favorites", label: "我的收藏", count: favoriteItemIds.length },
          { key: "reviews", label: "我的評論", count: reviews.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "favorites" && (
        <ItemGrid
          scope="favorites"
          initialFavoriteIds={favoriteItemIds}
          items={items}
          stats={stats}
          categories={categories}
          defaultPageSize={25}
        />
      )}

      {tab === "reviews" &&
        (reviews.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">還沒有留下任何評論。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>品項</Th>
                  <Th>星等</Th>
                  <Th>評論</Th>
                  <Th>時間</Th>
                  <Th className="text-right">操作</Th>
                </tr>
              </thead>
              <tbody>
                {pageRows.map((r) => (
                  <tr key={r.itemId}>
                    <Td>
                      <ItemLabel imageUrl={r.imageUrl} emoji={r.emoji} name={r.itemName} />
                    </Td>
                    <Td className="text-warning">{stars(r.stars)}</Td>
                    <Td className="text-muted">{r.text || "—"}</Td>
                    <Td className="text-muted">{formatTaiwanDateTime(r.at)}</Td>
                    <Td className="text-right">
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => setEditingItem({ id: r.itemId, name: r.itemName })}
                      >
                        編輯
                      </Button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={current}
              pageCount={pageCount}
              total={reviews.length}
              pageSize={effectiveSize}
              onPage={setPage}
              unit="則"
            />
          </>
        ))}

      {editingItem && (
        <ItemReviewModal
          itemId={editingItem.id}
          itemName={editingItem.name}
          open={!!editingItem}
          onClose={() => setEditingItem(null)}
          onSubmitted={() => router.refresh()}
        />
      )}
    </div>
  );
}
