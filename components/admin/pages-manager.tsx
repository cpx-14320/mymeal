"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Section,
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  ListToolbar,
  BulkActionBar,
  DismissibleNote,
  EmptyTableRow,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { formatTaiwanDateTime } from "@/lib/date";
import type { PageView } from "@/lib/models/page";
import { setPagesActiveAction, deletePagesAction } from "@/app/(app)/admin/pages/actions";

type Message = { tone: "positive" | "danger"; content: React.ReactNode };

export function PagesManager({
  pages,
  justCreated = false,
}: {
  pages: PageView[];
  /** 新增頁面存檔後帶著 ?created=1 導回這頁——進來就跳成功訊息，並把網址列的參數清掉，
   *  避免使用者重新整理這一頁時又跳出一次「新增成功」。 */
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // 新增／刪除共用同一個訊息槽——跟品項設定同一套邏輯，同一時間只會顯示一則狀態框，
  // 不會像分開管兩個 state 那樣，新增訊息還沒消失、又跳出一則刪除訊息，兩個同時疊在一起。
  const [message, setMessage] = useState<Message | null>(
    justCreated ? { tone: "positive", content: <p>新增頁面成功。</p> } : null,
  );

  useEffect(() => {
    if (justCreated) router.replace("/admin/pages");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(pages, page, pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = rows.length > 0 && rows.every((s) => selected.has(s.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((s) => next.delete(s.id));
      else rows.forEach((s) => next.add(s.id));
      return next;
    });

  async function bulkSetActive(active: boolean) {
    setBusy(true);
    await setPagesActiveAction([...selected], active);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function toggleActive(s: PageView) {
    setBusy(true);
    await setPagesActiveAction([s.id], !s.active);
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setDeleting(true);
    const count = selected.size;
    await deletePagesAction([...selected]);
    setSelected(new Set());
    setDeleting(false);
    setMessage({ tone: "positive", content: <p>已刪除 {count} 個頁面。</p> });
    router.refresh();
  }

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/pages/new" size="sm">新增頁面</ButtonLink>
      </AdminHeaderActions>

      {message && (
        <DismissibleNote tone={message.tone} onClose={() => setMessage(null)} autoDismissMs={3000}>
          {message.content}
        </DismissibleNote>
      )}

      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <BulkActionBar
        count={selected.size}
        unit="家"
        onCancel={() => setSelected(new Set())}
        actions={[
          { label: "啟用選取", tone: "neutral", onClick: () => bulkSetActive(true), disabled: busy || deleting },
          { label: "停用選取", tone: "neutral", onClick: () => bulkSetActive(false), disabled: busy || deleting },
          { label: deleting ? "刪除中…" : "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy || deleting },
        ]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>名稱</Th>
            <Th>網址代稱</Th>
            <Th>排序</Th>
            <Th>狀態</Th>
            <Th>本頁開啟</Th>
            <Th>建立者</Th>
            <Th>最後更新時間</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((s) => (
            <tr key={s.id} className={selected.has(s.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(s.id)}
                  onChange={() => toggleOne(s.id)}
                  aria-label={`選取 ${s.name}`}
                />
              </Td>
              <Td>
                <Link href={`/admin/pages/${s.id}`} className="hover:text-brand">
                  {s.name}
                </Link>
              </Td>
              <Td className="text-muted">{s.slug}</Td>
              <Td className="tabular-nums text-muted">{s.sortOrder}</Td>
              <Td>
                <Badge tone={s.active ? "positive" : "neutral"}>{s.active ? "啟用" : "停用"}</Badge>
              </Td>
              <Td className="text-muted">{s.openInNewTab ? "否" : "是"}</Td>
              <Td className="text-muted">
                <span className="inline-flex items-center gap-1.5">
                  {s.createdBy}
                  {s.createdByLabel && (
                    <Badge tone={s.createdByLabel === "帳號已刪除" ? "danger" : "warning"}>
                      {s.createdByLabel}
                    </Badge>
                  )}
                </span>
              </Td>
              <Td className="text-muted">{formatTaiwanDateTime(s.updatedAt)}</Td>
              <Td className="text-right">
                <div className="flex justify-end gap-2">
                  <ButtonLink href={`/admin/pages/${s.id}`} variant="secondary" size="sm">
                    編輯
                  </ButtonLink>
                  <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleActive(s)}>
                    {s.active ? "停用" : "啟用"}
                  </Button>
                </div>
              </Td>
            </tr>
          ))}
          {rows.length === 0 && <EmptyTableRow colSpan={9} />}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={pages.length} pageSize={effectiveSize} onPage={setPage} unit="筆" />
    </Section>
  );
}
