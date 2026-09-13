"use client";

import { useState } from "react";
import {
  Section,
  Button,
  Note,
  inputClass,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";

const names = [
  "林佩珊", "王建豪", "陳怡君", "張家瑋", "黃志明", "李冠廷", "吳雅婷", "蔡孟儒",
  "鄭凱文", "許家豪", "周宜蓁", "謝旻軒", "洪世昌", "江佩蓉", "曾柏翰", "邱瑋倫",
  "賴品妍", "蕭子涵", "羅偉誠", "高鈺婷",
];
const depts = [
  "網路發展部", "設計部", "行政部", "業務部", "資訊部", "客服部", "財務部", "人資部",
];

const balances = Array.from({ length: 26 }, (_, i) => {
  const topup = [900, 1500, 2000, 3000, 4000, 5000][i % 6];
  const spent = [860, 1180, 1400, 2100, 2760, 3300][i % 6] + (i % 3) * 55;
  return {
    who: names[i % names.length],
    dept: depts[i % depts.length],
    balance: topup - spent,
    topup,
    spent,
  };
});

const txTypes = ["訂餐扣款", "儲值入帳", "退款", "手動調整"] as const;

const txns = Array.from({ length: 30 }, (_, i) => {
  const type = txTypes[i % txTypes.length];
  const base = [45, 90, 95, 100, 300, 500, 1000][i % 7];
  const amount =
    type === "儲值入帳" || type === "退款"
      ? base
      : type === "手動調整"
        ? i % 2 === 0
          ? -35
          : 50
        : -base;
  return {
    who: names[(i + 5) % names.length],
    type,
    amount,
    after: 1200 - (i % 20) * 45,
    by: type === "訂餐扣款" ? "系統" : "finance",
    at: `09/${10 - (i % 8)} ${String(9 + (i % 9)).padStart(2, "0")}:${String((i * 13) % 60).padStart(2, "0")}`,
  };
});

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

type Tab = "balances" | "txns";

const tabs: { key: Tab; label: string; count: number }[] = [
  { key: "balances", label: "會員餘額", count: balances.length },
  { key: "txns", label: "最近交易", count: txns.length },
];

export function WalletsTables() {
  const [tab, setTab] = useState<Tab>("balances");
  const [bPage, setBPage] = useState(1);
  const [tPage, setTPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  const b = paginate(balances, bPage, pageSize);
  const t = paginate(txns, tPage, pageSize);

  const changeSize = (n: number) => {
    setPageSize(n);
    setBPage(1);
    setTPage(1);
  };

  return (
    <Section
      title="錢包與交易"
      description={
        tab === "balances"
          ? "各會員的餘額與累計儲值 / 消費。"
          : "所有錢包異動：訂餐扣款、儲值入帳、退款、手動調整。"
      }
      actions={
        tab === "balances" ? (
          <div className="flex gap-2">
            <input
              className={`${inputClass} w-48`}
              placeholder="搜尋姓名 / 部門"
            />
            <Button variant="secondary">匯出</Button>
          </div>
        ) : undefined
      }
    >
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
      </div>

      {tab === "balances" ? (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>會員</Th>
                <Th>部門</Th>
                <Th className="text-right">餘額</Th>
                <Th className="text-right">累計儲值</Th>
                <Th className="text-right">累計消費</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {b.rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-medium">{r.who}</Td>
                  <Td className="text-muted">{r.dept}</Td>
                  <Td
                    className={`text-right tabular-nums ${
                      r.balance < 0 ? "text-danger" : ""
                    }`}
                  >
                    NT$ {r.balance}
                  </Td>
                  <Td className="text-right tabular-nums text-muted">
                    NT$ {r.topup}
                  </Td>
                  <Td className="text-right tabular-nums text-muted">
                    NT$ {r.spent}
                  </Td>
                  <Td className="text-right">
                    <Button variant="secondary" size="sm">
                      調整餘額
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination
            page={b.current}
            pageCount={b.pageCount}
            total={balances.length}
            pageSize={pageSize}
            onPage={setBPage}
            unit="人"
          />
          <div className="mt-3">
            <Note>
              「調整餘額」為高風險操作（手動加值 / 扣款 / 退款），每次都需填寫備註並寫入稽核紀錄。
            </Note>
          </div>
        </>
      ) : (
        <>
          <TableWrap>
            <thead>
              <tr>
                <Th>會員</Th>
                <Th>類型</Th>
                <Th className="text-right">金額</Th>
                <Th className="text-right">餘額</Th>
                <Th>操作者</Th>
                <Th>時間</Th>
                <Th className="text-right">操作</Th>
              </tr>
            </thead>
            <tbody>
              {t.rows.map((r, i) => (
                <tr key={i}>
                  <Td className="font-medium">{r.who}</Td>
                  <Td>{r.type}</Td>
                  <Td
                    className={`text-right tabular-nums ${
                      r.amount > 0 ? "text-positive" : ""
                    }`}
                  >
                    {r.amount > 0 ? `+${r.amount}` : r.amount}
                  </Td>
                  <Td className="text-right tabular-nums">{r.after}</Td>
                  <Td className="text-muted">{r.by}</Td>
                  <Td className="whitespace-nowrap text-muted">{r.at}</Td>
                  <Td className="text-right">
                    <Button variant="secondary" size="sm">
                      調整
                    </Button>
                  </Td>
                </tr>
              ))}
            </tbody>
          </TableWrap>
          <Pagination
            page={t.current}
            pageCount={t.pageCount}
            total={txns.length}
            pageSize={pageSize}
            onPage={setTPage}
          />
          <div className="mt-3">
            <Note>
              「調整」用於訂單金額結算有誤等情況：不會修改這筆歷史交易本身，而是寫入一筆新的「手動調整」紀錄來抵銷/補足差額，並需填寫備註；原始訂單記錄不會被改動。
            </Note>
          </div>
        </>
      )}
    </Section>
  );
}
