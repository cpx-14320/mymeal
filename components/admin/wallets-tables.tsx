"use client";

import { Fragment, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Section,
  Button,
  inputClass,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import type { WalletBalanceRow, WalletLedgerRow, LedgerType } from "@/lib/models/wallet";
import { formatTaiwanDateTime } from "@/lib/date";
import { adjustBalanceAction } from "@/app/(app)/admin/wallets/actions";

const ledgerTypeLabel: Record<LedgerType, string> = {
  topup: "儲值入帳",
  spend: "訂餐扣款",
  refund: "退款",
  adjustment: "手動調整",
};

function paginate<T>(rows: T[], page: number, size: number) {
  const pageCount = Math.max(1, Math.ceil(rows.length / size));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * size;
  return { pageCount, current, rows: rows.slice(start, start + size) };
}

/** 「調整餘額／調整」共用的內嵌表單：填金額（可正可負）+ 必填備註，送出後整頁 refresh。 */
function AdjustForm({
  memberId,
  onDone,
  onCancel,
}: {
  memberId: string;
  onDone: () => void;
  onCancel: () => void;
}) {
  const router = useRouter();
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  async function submit() {
    const n = Number(amount);
    if (!Number.isFinite(n) || n === 0) {
      setError("請輸入非 0 的調整金額（正數加值、負數扣款）。");
      return;
    }
    if (!note.trim()) {
      setError("請填寫調整備註。");
      return;
    }
    setPending(true);
    setError(undefined);
    const result = await adjustBalanceAction(memberId, n, note.trim());
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    router.refresh();
    onDone();
  }

  return (
    <div className="flex flex-wrap items-start gap-2 rounded-lg border border-line bg-surface-2 p-3">
      <input
        className={`${inputClass} w-32`}
        type="number"
        placeholder="±金額"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
      />
      <input
        className={`${inputClass} flex-1 min-w-40`}
        placeholder="調整備註（必填）"
        value={note}
        onChange={(e) => setNote(e.target.value)}
      />
      <Button size="sm" disabled={pending} onClick={submit}>
        {pending ? "送出中…" : "確認"}
      </Button>
      <Button size="sm" variant="ghost" disabled={pending} onClick={onCancel}>
        取消
      </Button>
      {error && <p className="w-full text-sm text-danger">{error}</p>}
    </div>
  );
}

type Tab = "balances" | "txns";

export function WalletsTables({
  balances,
  ledger,
}: {
  balances: WalletBalanceRow[];
  ledger: WalletLedgerRow[];
}) {
  const [tab, setTab] = useState<Tab>("balances");
  const [bPage, setBPage] = useState(1);
  const [tPage, setTPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [search, setSearch] = useState("");
  const [adjustingMemberId, setAdjustingMemberId] = useState<string | null>(null);

  const filteredBalances = balances.filter(
    (b) => !search.trim() || b.name.includes(search) || b.dept.includes(search),
  );

  const b = paginate(filteredBalances, bPage, pageSize);
  const t = paginate(ledger, tPage, pageSize);

  const tabs: { key: Tab; label: string; count: number }[] = [
    { key: "balances", label: "會員餘額", count: balances.length },
    { key: "txns", label: "最近交易", count: ledger.length },
  ];

  const changeSize = (n: number) => {
    setPageSize(n);
    setBPage(1);
    setTPage(1);
  };

  return (
    <Section>
      {tab === "balances" && (
        <AdminHeaderActions>
          <Button variant="secondary">匯出</Button>
        </AdminHeaderActions>
      )}

      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <PillTabs tabs={tabs} value={tab} onChange={setTab} />
        <PageSizeSelect value={pageSize} onChange={changeSize} />
      </div>

      {tab === "balances" ? (
        <>
          <input
            className={`${inputClass} mb-3 w-64`}
            placeholder="搜尋姓名 / 部門"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setBPage(1);
            }}
          />
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
              {b.rows.length === 0 ? (
                <tr>
                  <Td colSpan={6} className="text-center text-muted">
                    沒有符合的會員。
                  </Td>
                </tr>
              ) : (
                b.rows.map((r) => (
                  <Fragment key={r.memberId}>
                    <tr>
                      <Td className="font-medium">{r.name}</Td>
                      <Td className="text-muted">{r.dept}</Td>
                      <Td className={`text-right tabular-nums ${r.balance < 0 ? "text-danger" : ""}`}>
                        NT$ {r.balance}
                      </Td>
                      <Td className="text-right tabular-nums text-muted">NT$ {r.totalTopup}</Td>
                      <Td className="text-right tabular-nums text-muted">NT$ {r.totalSpend}</Td>
                      <Td className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() =>
                            setAdjustingMemberId(adjustingMemberId === r.memberId ? null : r.memberId)
                          }
                        >
                          調整餘額
                        </Button>
                      </Td>
                    </tr>
                    {adjustingMemberId === r.memberId && (
                      <tr>
                        <Td colSpan={6}>
                          <AdjustForm
                            memberId={r.memberId}
                            onDone={() => setAdjustingMemberId(null)}
                            onCancel={() => setAdjustingMemberId(null)}
                          />
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </TableWrap>
          <Pagination
            page={b.current}
            pageCount={b.pageCount}
            total={filteredBalances.length}
            pageSize={pageSize}
            onPage={setBPage}
            unit="筆"
          />
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
              {t.rows.length === 0 ? (
                <tr>
                  <Td colSpan={7} className="text-center text-muted">
                    目前沒有任何交易紀錄。
                  </Td>
                </tr>
              ) : (
                t.rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr>
                      <Td className="font-medium">{r.memberName}</Td>
                      <Td>{ledgerTypeLabel[r.type]}</Td>
                      <Td className={`text-right tabular-nums ${r.amount > 0 ? "text-positive" : ""}`}>
                        {r.amount > 0 ? `+${r.amount}` : r.amount}
                      </Td>
                      <Td className="text-right tabular-nums">{r.balanceAfter}</Td>
                      <Td className="text-muted">{r.by}</Td>
                      <Td className="whitespace-nowrap text-muted">{formatTaiwanDateTime(r.at)}</Td>
                      <Td className="text-right">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => setAdjustingMemberId(adjustingMemberId === r.memberId ? null : r.memberId)}
                        >
                          調整
                        </Button>
                      </Td>
                    </tr>
                    {adjustingMemberId === r.memberId && (
                      <tr>
                        <Td colSpan={7}>
                          <AdjustForm
                            memberId={r.memberId}
                            onDone={() => setAdjustingMemberId(null)}
                            onCancel={() => setAdjustingMemberId(null)}
                          />
                        </Td>
                      </tr>
                    )}
                  </Fragment>
                ))
              )}
            </tbody>
          </TableWrap>
          <Pagination page={t.current} pageCount={t.pageCount} total={ledger.length} pageSize={pageSize} onPage={setTPage} />
        </>
      )}
    </Section>
  );
}
