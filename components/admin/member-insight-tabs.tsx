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
import {
  itemById,
  itemTagForGroup,
  memberItemBreakdown,
  memberLedger,
  type MemberInsight,
} from "@/lib/mock";

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

function stars(n: number) {
  return "★".repeat(n) + "☆".repeat(5 - n);
}

type Tab = "orders" | "topups" | "favorites" | "comments" | "ratings";

export function MemberInsightTabs({
  id,
  insight,
}: {
  id: string;
  insight: MemberInsight;
}) {
  const [tab, setTab] = useState<Tab>("orders");
  const [pageSize, setPageSize] = useState(25);
  const [ordersPage, setOrdersPage] = useState(1);
  const [topupsPage, setTopupsPage] = useState(1);
  const [favoritesPage, setFavoritesPage] = useState(1);
  const [commentsPage, setCommentsPage] = useState(1);
  const [ratingsPage, setRatingsPage] = useState(1);
  const [ledger, setLedger] = useState(() => memberLedger(id));

  const removeLedgerRow = (rowId: string) =>
    setLedger((prev) => prev.filter((r) => r.id !== rowId));

  const breakdown = memberItemBreakdown(id);
  const orders = paginate(breakdown, ordersPage, pageSize);
  const topups = paginate(ledger, topupsPage, pageSize);
  const favorites = paginate(insight.favorites, favoritesPage, pageSize);
  const comments = paginate(insight.comments, commentsPage, pageSize);
  const ratings = paginate(insight.ratings, ratingsPage, pageSize);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "orders", label: "訂餐紀錄", count: breakdown.length },
    { key: "topups", label: "儲值紀錄", count: ledger.length },
    {
      key: "favorites",
      label: "收藏的品項",
      count: insight.favorites.length,
    },
    { key: "comments", label: "評論留言", count: insight.comments.length },
    { key: "ratings", label: "評分", count: insight.ratings.length },
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

      {tab === "orders" && (
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
            unit="項品項"
          />
        </>
      )}

      {tab === "topups" && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>類型</Th>
                <Th>明細</Th>
                <Th className="text-right">金額</Th>
                <Th className="text-right">剩餘金額</Th>
                <Th>時間</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {topups.rows.map((t) => (
                <tr key={t.id}>
                  <Td>
                    <Badge tone={t.type === "topup" ? "positive" : "warning"}>
                      {t.type === "topup" ? "儲值" : "消費"}
                    </Badge>
                  </Td>
                  <Td className="text-muted">{t.detail}</Td>
                  <Td
                    className={`text-right tabular-nums ${
                      t.type === "topup" ? "text-positive" : ""
                    }`}
                  >
                    {t.type === "topup" ? "+" : "-"}NT$ {t.amount}
                  </Td>
                  <Td className="text-right tabular-nums">
                    NT$ {t.balanceAfter}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{t.at}</Td>
                  <Td className="text-right">
                    <button
                      type="button"
                      onClick={() => removeLedgerRow(t.id)}
                      className="text-xs text-muted hover:text-danger"
                    >
                      刪除
                    </button>
                  </Td>
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
      )}

      {tab === "favorites" && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>品項</Th>
                <Th>分類</Th>
                <Th>主食</Th>
                <Th>肉類</Th>
                <Th>收藏時間</Th>
              </tr>
            </thead>
            <tbody>
              {favorites.rows.map((f) => {
                const item = itemById(f.itemId);
                if (!item) return null;
                return (
                  <tr key={f.itemId}>
                    <Td className="font-medium">
                      <span className="mr-1.5">{item.emoji}</span>
                      {item.name}
                    </Td>
                    <Td className="text-muted">{item.category}</Td>
                    <Td className="text-muted">
                      {itemTagForGroup(item, "staple")}
                    </Td>
                    <Td className="text-muted">
                      {itemTagForGroup(item, "meat")}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">{f.at}</Td>
                  </tr>
                );
              })}
            </tbody>
          </TableWrap>
          <Pagination
            page={favorites.current}
            pageCount={favorites.pageCount}
            total={insight.favorites.length}
            pageSize={pageSize}
            onPage={setFavoritesPage}
            unit="項"
          />
        </>
      )}

      {tab === "comments" &&
        (insight.comments.length === 0 ? (
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
                {comments.rows.map((c, i) => (
                  <tr key={i}>
                    <Td className="font-medium">
                      {itemById(c.itemId)?.name ?? c.itemId}
                    </Td>
                    <Td className="text-muted">{c.text}</Td>
                    <Td className="text-warning">{stars(c.stars)}</Td>
                    <Td className="whitespace-nowrap text-muted">{c.at}</Td>
                  </tr>
                ))}
              </tbody>
            </TableWrap>
            <Pagination
              page={comments.current}
              pageCount={comments.pageCount}
              total={insight.comments.length}
              pageSize={pageSize}
              onPage={setCommentsPage}
              unit="筆"
            />
          </>
        ))}

      {tab === "ratings" && (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>品項</Th>
                <Th>評分</Th>
              </tr>
            </thead>
            <tbody>
              {ratings.rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-medium">
                    {itemById(r.itemId)?.name ?? r.itemId}
                  </Td>
                  <Td>
                    <span className="text-warning">{stars(r.stars)}</span>
                    <span className="ml-2 tabular-nums text-muted">
                      {r.stars}/5
                    </span>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination
            page={ratings.current}
            pageCount={ratings.pageCount}
            total={insight.ratings.length}
            pageSize={pageSize}
            onPage={setRatingsPage}
            unit="筆"
          />
        </>
      )}
    </div>
  );
}
