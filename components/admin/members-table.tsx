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
  ListToolbar,
  BulkActionBar,
  paginate,
  DEFAULT_PAGE_SIZE,
} from "@/components/ui/primitives";
import type { MemberListItem, MemberStatus } from "@/lib/models/member";
import { formatTaiwanDateTime } from "@/lib/date";
import { setMembersStatusAction } from "@/app/(app)/admin/members/actions";

const statusMap = {
  active: { label: "啟用", tone: "positive" as const },
  suspended: { label: "停用", tone: "neutral" as const },
  pending: { label: "待審核", tone: "warning" as const },
};

export function MembersTable({ members: initialMembers }: { members: MemberListItem[] }) {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
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

  const { pageRows: rows, pageCount, current, effectiveSize } = paginate(filtered, page, pageSize);

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

  const toggleStatus = (id: string, current: MemberStatus) =>
    applyStatus([id], current === "active" ? "suspended" : "active");

  return (
    <div className="space-y-4">
      <ListToolbar
        search={{
          value: search,
          onChange: (v) => {
            setSearch(v);
            setPage(1);
          },
          placeholder: "搜尋姓名／帳號／部門／單位",
        }}
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      {statusError && <p className="text-[13px] lg:text-[14px] text-danger">{statusError}</p>}

      <BulkActionBar
        count={selected.size}
        unit="人"
        onCancel={() => setSelected(new Set())}
        actions={[
          {
            label: "啟用選取",
            tone: "neutral",
            onClick: () => bulkSetStatus("active"),
            disabled: statusUpdatingIds.size > 0,
          },
          {
            label: "停用選取",
            tone: "neutral",
            onClick: () => bulkSetStatus("suspended"),
            disabled: statusUpdatingIds.size > 0,
          },
        ]}
      />

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
                  <Td>{m.name}</Td>
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
                  <Td className="text-muted">
                    {formatTaiwanDateTime(m.createdAt)}
                  </Td>
                  <Td className="text-muted">
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
        pageSize={effectiveSize}
        onPage={setPage}
        unit="筆"
      />
    </div>
  );
}
