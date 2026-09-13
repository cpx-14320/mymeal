"use client";

import { useState } from "react";
import {
  Badge,
  Button,
  ButtonLink,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
} from "@/components/ui/primitives";
import { members as initialMembers, type MemberStatus } from "@/lib/mock";

const statusMap = {
  active: { label: "啟用", tone: "positive" as const },
  suspended: { label: "停用", tone: "neutral" as const },
};

export function MembersTable() {
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  const pageCount = Math.max(1, Math.ceil(members.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = members.slice(start, start + pageSize);

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

  const bulkSetStatus = (status: MemberStatus) => {
    setMembers((prev) =>
      prev.map((m) => (selected.has(m.id) ? { ...m, status } : m)),
    );
    setSelected(new Set());
  };

  const bulkDelete = () => {
    setMembers((prev) => prev.filter((m) => !selected.has(m.id)));
    setSelected(new Set());
  };

  const toggleStatus = (id: string) =>
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id
          ? { ...m, status: m.status === "active" ? "suspended" : "active" }
          : m,
      ),
    );

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
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              啟用選取
            </button>
            <button
              type="button"
              onClick={() => bulkSetStatus("suspended")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface"
            >
              停用選取
            </button>
            <button
              type="button"
              onClick={bulkDelete}
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
            <Th>最後登入</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
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
                  <Badge tone={m.role.includes("管理") ? "brand" : "neutral"}>
                    {m.role}
                  </Badge>
                </Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
                <Td className="whitespace-nowrap text-muted">{m.last}</Td>
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
                      onClick={() => toggleStatus(m.id)}
                    >
                      {m.status === "active" ? "停用" : "啟用"}
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
        </tbody>
      </TableWrap>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={members.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="人"
      />

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
