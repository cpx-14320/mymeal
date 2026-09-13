"use client";

import { useState } from "react";
import { PageSizeSelect, Pagination } from "@/components/ui/primitives";
import { OrderRow, type Order, type OrderStatus } from "@/components/order-row";

const restaurants = ["福來鮮食", "阿明快餐", "健康廚房"];
const dishes = [
  "香煎鯖魚便當 ×1",
  "三杯雞便當 ×1",
  "烤時蔬溫沙拉 ×1",
  "招牌雞腿便當 ×1",
  "咖哩雞便當 ×1",
  "麻婆豆腐便當 ×1",
];
const teams = [
  { name: "五樓午餐", id: "3" },
  { name: "行政週五團", id: "5" },
  { name: "三樓週三團", id: "6" },
  { name: "設計部揪團", id: "2" },
  { name: "研發部午餐", id: "7" },
];
const statuses: OrderStatus[] = ["fulfilled", "fulfilled", "fulfilled", "cancelled"];

const history: Order[] = Array.from({ length: 26 }, (_, i) => ({
  id: `h${i + 1}`,
  date: `09/${String((3 + ((i * 3) % 27)) % 28 || 1).padStart(2, "0")}`,
  restaurant: restaurants[i % restaurants.length],
  dish: dishes[i % dishes.length],
  price: [90, 95, 100, 110][i % 4],
  team: teams[i % teams.length],
  status: statuses[i % statuses.length],
}));

export function OrdersHistory() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const pageCount = Math.max(1, Math.ceil(history.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = history.slice(start, start + pageSize);

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      <div className="space-y-3">
        {rows.map((o) => (
          <OrderRow key={o.id} order={o} />
        ))}
      </div>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={history.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
