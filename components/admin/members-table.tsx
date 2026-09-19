"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  inputClass,
} from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import type { MemberListItem, MemberStatus } from "@/lib/models/member";
import { formatTaiwanDateTime } from "@/lib/date";
import { bulkDeleteMembersAction, setMembersStatusAction } from "@/app/(app)/admin/members/actions";

const statusMap = {
  active: { label: "啟用", tone: "positive" as const },
  suspended: { label: "停用", tone: "neutral" as const },
  pending: { label: "待審核", tone: "warning" as const },
};

export function MembersTable({ members: initialMembers }: { members: MemberListItem[] }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | undefined>();
  const [search, setSearch] = useState("");
  const [statusUpdatingIds, setStatusUpdatingIds] = useState<Set<string>>(() => new Set());
  const [statusError, setStatusError] = useState<string | undefined>();

  const query = search.trim().toLowerCase();
  const filtered = query
    ? members.filter((m) =>
        [m.name, m.account, m.dept, m.unit].some((field) =>
          field.toLowerCase().includes(query),
        ),
      )
    : members;

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = filtered.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected =
    rows.length > 0 && rows.every((m) => selected.has(m.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) rows.forEach((m) => next.delete(m.id));
      else rows.forEach((m) => next.add(m.id));
      return next;
    });

  const applyStatus = async (ids: string[], status: MemberStatus) => {
    setStatusError(undefined);
    setStatusUpdatingIds((prev) => new Set([...prev, ...ids]));
    const result = await setMembersStatusAction(ids, status);
    setStatusUpdatingIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.delete(id));
      return next;
    });
    if (result.error) {
      setStatusError(result.error);
      return;
    }
    setMembers((prev) =>
      prev.map((m) => (ids.includes(m.id) ? { ...m, status } : m)),
    );
    router.refresh();
  };

  const bulkSetStatus = async (status: MemberStatus) => {
    const ids = Array.from(selected);
    await applyStatus(ids, status);
    setSelected(new Set());
  };

  const bulkDelete = async () => {
    setDeleting(true);
    setDeleteError(undefined);
    const ids = selected;
    const result = await bulkDeleteMembersAction(Array.from(ids));
    if (result.error) {
      setDeleteError(result.error);
      setDeleting(false);
      return;
    }
    setMembers((prev) => prev.filter((m) => !ids.has(m.id)));
    setConfirmDelete(false);
    setDeleting(false);
    setSelected(new Set());
    router.refresh();
  };

  const toggleStatus = (id: string, current: MemberStatus) =>
    applyStatus([id], current === "active" ? "suspended" : "active");

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <input
          className={`${inputClass} w-64`}
          placeholder="搜尋姓名／帳號／部門／單位"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
        <PageSizeSelect
          value={pageSize}
          onChange={(n) => {
            setPageSize(n);
            setPage(1);
          }}
        />
      </div>

      {statusError && <p className="text-sm text-danger">{statusError}</p>}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
          <span>
            已選 <b className="tabular-nums">{selected.size}</b> 人
          </span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setSelected(new Set())}
              className="text-muted hover:text-ink"
            >
              取消選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("active")}
              disabled={statusUpdatingIds.size > 0}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              啟用選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("suspended")}
              disabled={statusUpdatingIds.size > 0}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              停用選取
            </button>
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="rounded-lg border border-danger/40 px-3 py-1 font-semibold text-danger hover:bg-danger/10"
            >
              刪除選取
            </button>
          </div>
        </div>
      )}

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input
                type="checkbox"
                checked={pageAllSelected}
                onChange={togglePageAll}
                aria-label="選取本頁全部"
              />
            </Th>
            <Th>姓名</Th>
            <Th>帳號</Th>
            <Th>部門</Th>
            <Th>單位</Th>
            <Th>權限</Th>
            <Th>狀態</Th>
            <Th>建立時間</Th>
            <Th>最後登入</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-muted">
                {query ? "找不到符合條件的會員。" : "目前沒有會員資料。"}
              </Td>
            </tr>
          ) : (
            rows.map((m) => {
              const st = statusMap[m.status];
              return (
                <tr
                  key={m.id}
                  className={selected.has(m.id) ? "bg-brand-soft" : ""}
                >
                  <Td>
                    <input
                      type="checkbox"
                      checked={selected.has(m.id)}
                      onChange={() => toggleOne(m.id)}
                      aria-label={`選取 ${m.name}`}
                    />
                  </Td>
                  <Td className="font-medium">{m.name}</Td>
                  <Td className="text-muted">{m.account}</Td>
                  <Td className="text-muted">{m.dept}</Td>
                  <Td className="text-muted">{m.unit}</Td>
                  <Td>
                    <Badge tone={m.role && m.role !== "一般使用者" ? "brand" : "neutral"}>
                      {m.role || "一般使用者"}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatTaiwanDateTime(m.createdAt)}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">
                    {formatTaiwanDateTime(m.lastLoginAt)}
                  </Td>
                  <Td className="text-right">
                    <div className="flex justify-end gap-2">
                      <ButtonLink
                        href={`/admin/members/${m.id}`}
                        variant="secondary"
                        size="sm"
                      >
                        編輯
                      </ButtonLink>
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={statusUpdatingIds.has(m.id)}
                        onClick={() => toggleStatus(m.id, m.status)}
                      >
                        {statusUpdatingIds.has(m.id)
                          ? "處理中…"
                          : m.status === "active"
                            ? "停用"
                            : "啟用"}
                      </Button>
                    </div>
                  </Td>
                </tr>
              );
            })
          )}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={filtered.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="人"
      />

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        ariaLabel="確認刪除會員"
        className="max-w-sm"
      >
        <ModalHeader title="確認刪除會員" onClose={() => setConfirmDelete(false)} />
        <div className="space-y-4 p-4">
          <p className="text-sm text-ink">
            確定要刪除選取的 <b className="tabular-nums">{selected.size}</b>{" "}
            位會員嗎？此動作無法復原。
          </p>
          {deleteError && <p className="text-sm text-danger">{deleteError}</p>}
          <div className="flex justify-end gap-2">
            <Button
              variant="secondary"
              onClick={() => setConfirmDelete(false)}
              disabled={deleting}
            >
              否
            </Button>
            <Button variant="danger" onClick={bulkDelete} disabled={deleting}>
              {deleting ? "刪除中…" : "是"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
