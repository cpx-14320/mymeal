"use client";

import { useState } from "react";
import {
  PillTabs,
  PageSizeSelect,
  Pagination,
  TableWrap,
  Th,
  Td,
  Badge,
} from "@/components/ui/primitives";
import type { FavoriteView } from "@/lib/models/favorite";
import type { ItemReviewView } from "@/lib/models/item-review";
import type { WalletLedgerRow, LedgerType } from "@/lib/models/wallet";
import { formatTaiwanDateTime } from "@/lib/date";

/** 訂餐分頁還沒有真的資料來源（要等團訂彙總依會員拆解做出來），先留空狀態。儲值分頁已接上真實 wallet_ledger。 */
interface OrderBreakdownStub {
  itemId: string;
  itemName: string;
  category: string;
  tags: string[];
  totalQuantity: number;
  orderCount: number;
}

const ledgerTypeLabel: Record<LedgerType, string> = {
  topup: "儲值",
  spend: "消費",
  refund: "退款",
  adjustment: "調整",
};
const ledgerTypeTone: Record<LedgerType, "positive" | "warning" | "neutral"> = {
  topup: "positive",
  refund: "positive",
  spend: "warning",
  adjustment: "neutral",
};

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

function formatAt(at: Date) {
  return new Date(at).toLocaleString("zh-TW", { hour12: false });
}

type Tab = "orders" | "topups" | "favorites" | "comments" | "ratings";

export function MemberInsightTabs({
  breakdown,
  ledger,
  favorites,
  comments,
  ratings,
}: {
  breakdown: OrderBreakdownStub[];
  ledger: WalletLedgerRow[];
  favorites: FavoriteView[];
  comments: ItemReviewView[];
  ratings: ItemReviewView[];
}) {
  const [tab, setTab] = useState<Tab>("orders");
  const [pageSize, setPageSize] = useState(25);
  const [ordersPage, setOrdersPage] = useState(1);
  const [topupsPage, setTopupsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);

  const orders = paginate(breakdown, ordersPage, pageSize);
  const topups = paginate(ledger, topupsPage, pageSize);
  const favoritesPaged = paginate(favorites, favoritesPage, pageSize);
  const commentsPaged = paginate(comments, commentsPage, pageSize);
  const ratingsPaged = paginate(ratings, ratingsPage, pageSize);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "orders", label: "訂餐紀錄", count: breakdown.length },
    { key: "topups", label: "儲值紀錄", count: ledger.length },
    { key: "favorites", label: "收藏的品項", count: favorites.length },
    { key: "comments", label: "評論留言", count: comments.length },
    { key: "ratings", label: "評分", count: ratings.length },
  ];

  const changeSize = (n: number) => {
    setPageSize(n);
    setOrdersPage(1);
    setTopupsPage(1);
    setFavoritesPage(1);
    setCommentsPage(1);
    setRatingsPage(1);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
      </div>

      {tab === "orders" &&
        (breakdown.length === 0 ? (
          <p className="text-sm text-muted">尚無訂餐紀錄（團訂功能尚未上線）。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>品項</Th>
                  <Th>分類</Th>
                  <Th>標籤</Th>
                  <Th className="text-right">總訂購數量</Th>
                  <Th className="text-right">訂單次數</Th>
                </tr>
              </thead>
              <tbody>
                {orders.rows.map((o) => (
                  <tr key={o.itemId}>
                    <Td className="font-medium">{o.itemName}</Td>
                    <Td className="text-muted">{o.category}</Td>
                    <Td className="text-muted">
                      {o.tags.length ? o.tags.join("、") : "—"}
                    </Td>
                    <Td className="text-right tabular-nums">
                      {o.totalQuantity}
                    </Td>
                    <Td className="text-right tabular-nums">{o.orderCount}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={orders.current}
              pageCount={orders.pageCount}
              total={breakdown.length}
              pageSize={pageSize}
              onPage={setOrdersPage}
              unit="筆"
            />
          </>
        ))}

      {tab === "topups" &&
        (ledger.length === 0 ? (
          <p className="text-sm text-muted">尚無儲值／消費紀錄（錢包功能尚未上線）。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>類型</Th>
                  <Th>明細</Th>
                  <Th className="text-right">金額</Th>
                  <Th className="text-right">剩餘金額</Th>
                  <Th>時間</Th>
                </tr>
              </thead>
              <tbody>
                {topups.rows.map((t) => (
                  <tr key={t.id}>
                    <Td>
                      <Badge tone={ledgerTypeTone[t.type]}>{ledgerTypeLabel[t.type]}</Badge>
                    </Td>
                    <Td className="text-muted">{t.detail}</Td>
                    <Td
                      className={`text-right tabular-nums ${
                        t.amount > 0 ? "text-positive" : ""
                      }`}
                    >
                      {t.amount > 0 ? `+NT$ ${t.amount}` : `-NT$ ${Math.abs(t.amount)}`}
                    </Td>
                    <Td className="text-right tabular-nums">
                      NT$ {t.balanceAfter}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(t.at)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={topups.current}
              pageCount={topups.pageCount}
              total={ledger.length}
              pageSize={pageSize}
              onPage={setTopupsPage}
              unit="筆"
            />
          </>
        ))}

      {tab === "favorites" &&
        (favorites.length === 0 ? (
          <p className="text-sm text-muted">尚未收藏任何品項。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>品項</Th>
                  <Th>分類</Th>
                  <Th>標籤</Th>
                  <Th>收藏時間</Th>
                </tr>
              </thead>
              <tbody>
                {favoritesPaged.rows.map((f) => (
                  <tr key={f.itemId}>
                    <Td className="font-medium">
                      <span className="mr-1.5">{f.emoji}</span>
                      {f.itemName}
                    </Td>
                    <Td className="text-muted">{f.categoryName}</Td>
                    <Td className="text-muted">
                      {f.tags.length ? f.tags.join("、") : "—"}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatAt(f.at)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={favoritesPaged.current}
              pageCount={favoritesPaged.pageCount}
              total={favorites.length}
              pageSize={pageSize}
              onPage={setFavoritesPage}
              unit="筆"
            />
          </>
        ))}

      {tab === "comments" &&
        (comments.length === 0 ? (
          <p className="text-sm text-muted">尚未留下任何評論。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>品項</Th>
                  <Th>留言</Th>
                  <Th>評分</Th>
                  <Th>時間</Th>
                </tr>
              </thead>
              <tbody>
                {commentsPaged.rows.map((c) => (
                  <tr key={c.itemId}>
                    <Td className="font-medium">{c.itemName}</Td>
                    <Td className="text-muted">{c.text}</Td>
                    <Td className="text-warning">{stars(c.stars)}</Td>
                    <Td className="whitespace-nowrap text-muted">{formatAt(c.at)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={commentsPaged.current}
              pageCount={commentsPaged.pageCount}
              total={comments.length}
              pageSize={pageSize}
              onPage={setCommentsPage}
              unit="筆"
            />
          </>
        ))}

      {tab === "ratings" &&
        (ratings.length === 0 ? (
          <p className="text-sm text-muted">尚無評分紀錄。</p>
        ) : (
          <>
            <TableWrap>
              <thead>
                <tr>
                  <Th>品項</Th>
                  <Th>評分</Th>
                  <Th>時間</Th>
                </tr>
              </thead>
              <tbody>
                {ratingsPaged.rows.map((r) => (
                  <tr key={r.itemId}>
                    <Td className="font-medium">{r.itemName}</Td>
                    <Td>
                      <span className="text-warning">{stars(r.stars)}</span>
                      <span className="ml-2 tabular-nums text-muted">
                        {r.stars}/5
                      </span>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{formatAt(r.at)}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={ratingsPaged.current}
              pageCount={ratingsPaged.pageCount}
              total={ratings.length}
              pageSize={pageSize}
              onPage={setRatingsPage}
              unit="筆"
            />
          </>
        ))}
    </div>
  );
}
