"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Button,
  ButtonLink,
  Badge,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  BulkActionBar,
  Note,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import type { InterstitialView, InterstitialStatus } from "@/lib/models/interstitial";
import { setPromosEnabledAction, deletePromosAction } from "@/app/(app)/admin/promos/actions";

const statusMeta: Record<InterstitialStatus, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  showing: { label: "顯示中", tone: "positive" },
  scheduled: { label: "已排程", tone: "warning" },
  ended: { label: "已結束", tone: "neutral" },
  disabled: { label: "已關閉", tone: "neutral" },
};

const freqLabel: Record<string, string> = {
  always: "每次進站",
  daily: "每人每天一次",
  once: "每人只一次",
};

const fmt = (s: string) => s.replace("T", " ");

function statusOf(a: InterstitialView, now: Date): InterstitialStatus {
  if (!a.enabled) return "disabled";
  if (now < new Date(a.startAt)) return "scheduled";
  if (now > new Date(a.endAt)) return "ended";
  return "showing";
}

export function PromosList({ promos }: { promos: InterstitialView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [busy, setBusy] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [deleting, setDeleting] = useState(false);
  const [deletedMessage, setDeletedMessage] = useState<string | null>(null);
  const now = new Date();

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(promos, page, pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((r) => next.delete(r.id));
      else rows.forEach((r) => next.add(r.id));
      return next;
    });

  async function toggleEnabled(a: InterstitialView) {
    setBusy(true);
    await setPromosEnabledAction([a.id], !a.enabled);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setDeleting(true);
    const count = selected.size;
    await deletePromosAction([...selected]);
    setSelected(new Set());
    setDeleting(false);
    setDeletedMessage(`已刪除 ${count} 筆資料`);
    setTimeout(() => setDeletedMessage(null), 3000);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      {deletedMessage && <Note tone="danger">{deletedMessage}</Note>}

      <BulkActionBar
        count={selected.size}
        unit="則"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: deleting ? "刪除中…" : "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy || deleting },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>活動名稱</Th>
            <Th>排程</Th>
            <Th>頻率</Th>
            <Th>倒數</Th>
            <Th>圖片</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const st = statusMeta[statusOf(a, now)];
            return (
              <tr key={a.id} className={selected.has(a.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(a.id)}
                    onChange={() => toggleOne(a.id)}
                    aria-label={`選取 ${a.name}`}
                  />
                </Td>
                <Td>
                  <Link href={`/admin/promos/${a.id}`} className="hover:text-brand">
                    {a.name}
                  </Link>
                </Td>
                <Td className="text-muted tabular-nums">
                  {fmt(a.startAt)} – {fmt(a.endAt)}
                </Td>
                <Td className="text-muted">{freqLabel[a.frequency]}</Td>
                <Td className="text-muted">{a.dismissSeconds > 0 ? `${a.dismissSeconds} 秒` : "不自動關"}</Td>
                <Td className="text-muted">{a.imageUrl ? "已設定" : "尚未設定"}</Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <ButtonLink href={`/admin/promos/${a.id}`} variant="secondary" size="sm">
                      編輯
                    </ButtonLink>
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleEnabled(a)}>
                      {a.enabled ? "關閉" : "開啟"}
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={8}>
                還沒有任何廣告，點右上角「新增廣告」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={promos.length} pageSize={effectiveSize} onPage={setPage} unit="筆" />
    </div>
  );
}
