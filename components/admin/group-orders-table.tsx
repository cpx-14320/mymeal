"use client";

import { useActionState, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Badge,
  Card,
  CardBody,
  Field,
  inputClass,
  Note,
  TableWrap,
  Th,
  Td,
  Pagination,
  PageSizeSelect,
  PillTabs,
} from "@/components/ui/primitives";
import type { GroupOrderListItem, GroupOrderStatus } from "@/lib/models/group-order";
import {
  createGroupOrderAction,
  setGroupOrdersStatusAction,
  deleteGroupOrdersAction,
  type CreateGroupOrderState,
} from "@/app/(app)/admin/group-orders/actions";

const statusMap: Record<GroupOrderStatus, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  open: { label: "開放中", tone: "positive" },
  closed: { label: "已截止", tone: "warning" },
  completed: { label: "已完成", tone: "neutral" },
};

const filters: { label: string; test: (r: GroupOrderListItem) => boolean }[] = [
  { label: "全部", test: () => true },
  { label: "開放中", test: (r) => r.status === "open" },
  { label: "已截止", test: (r) => r.status === "closed" },
  { label: "已完成", test: (r) => r.status === "completed" },
];

function CreateGroupOrderForm({
  templates,
  units,
  members,
  pickupLocations,
  deadlineDefaultHint,
  underMinPolicy,
  onDone,
}: {
  templates: { id: string; name: string }[];
  units: { id: string; name: string; departmentName: string }[];
  members: { id: string; name: string }[];
  pickupLocations: string[];
  deadlineDefaultHint: string;
  underMinPolicy: string;
  onDone: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<CreateGroupOrderState, FormData>(
    createGroupOrderAction,
    {},
  );

  if (state.success) {
    router.refresh();
    onDone();
  }

  return (
    <Card>
      <CardBody>
        <form action={formAction} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="團名">
              <input className={inputClass} name="name" placeholder="例：業務一組 週三便當團" required />
            </Field>
            <Field label="取餐日期">
              <input className={inputClass} type="date" name="date" required />
            </Field>
            <Field label="模板">
              <select className={inputClass} name="templateId" required>
                {templates.length === 0 && <option value="">（尚無模板）</option>}
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="單位">
              <select className={inputClass} name="unitId" required>
                {units.length === 0 && <option value="">（尚無單位）</option>}
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.departmentName} {u.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="團主">
              <select className={inputClass} name="hostId" required>
                {members.length === 0 && <option value="">（尚無會員）</option>}
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="截止時間" hint={`自由文字，例：今天 17:00 截止｜系統預設：${deadlineDefaultHint}`}>
              <input className={inputClass} name="deadline" placeholder="今天 17:00 截止" />
            </Field>
            <Field label="取餐地點">
              {pickupLocations.length === 0 ? (
                <input className={inputClass} name="pickupLocation" placeholder="例：3F 茶水間" />
              ) : (
                <select className={inputClass} name="pickupLocation" defaultValue={pickupLocations[0]}>
                  {pickupLocations.map((loc) => (
                    <option key={loc} value={loc}>
                      {loc}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
          <Note>未達最低訂購門檻時的處理方式（依後台「系統設定」）：{underMinPolicy}</Note>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDone}>
              取消
            </Button>
            <Button disabled={pending}>{pending ? "建立中…" : "建立團訂"}</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

export function GroupOrdersTable({
  rows,
  templates,
  units,
  members,
  pickupLocations,
  deadlineDefaultHint,
  underMinPolicy,
}: {
  rows: GroupOrderListItem[];
  templates: { id: string; name: string }[];
  units: { id: string; name: string; departmentName: string }[];
  members: { id: string; name: string }[];
  pickupLocations: string[];
  deadlineDefaultHint: string;
  underMinPolicy: string;
}) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [filterLabel, setFilterLabel] = useState("全部");
  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState(false);

  const activeFilter = filters.find((f) => f.label === filterLabel) ?? filters[0];
  const filtered = rows.filter(activeFilter.test);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const pageRows = filtered.slice(start, start + pageSize);

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const pageAllSelected = pageRows.length > 0 && pageRows.every((r) => selected.has(r.id));

  const togglePageAll = () =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (pageAllSelected) pageRows.forEach((r) => next.delete(r.id));
      else pageRows.forEach((r) => next.add(r.id));
      return next;
    });

  async function bulkSetStatus(status: GroupOrderStatus) {
    setBusy(true);
    await setGroupOrdersStatusAction([...selected], status);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  async function bulkDelete() {
    setBusy(true);
    await deleteGroupOrdersAction([...selected]);
    setSelected(new Set());
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={filters.map((f) => ({ key: f.label, label: f.label, count: rows.filter(f.test).length }))}
          value={filterLabel}
          onChange={(key) => {
            setFilterLabel(key);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <PageSizeSelect
            value={pageSize}
            onChange={(n) => {
              setPageSize(n);
              setPage(1);
            }}
          />
          <Button variant="secondary" onClick={() => setCreating((v) => !v)}>
            代開團
          </Button>
        </div>
      </div>

      {creating && (
        <CreateGroupOrderForm
          templates={templates}
          units={units}
          members={members}
          pickupLocations={pickupLocations}
          deadlineDefaultHint={deadlineDefaultHint}
          underMinPolicy={underMinPolicy}
          onDone={() => setCreating(false)}
        />
      )}

      {selected.size > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-surface-2 px-4 py-2.5 text-sm">
          <span>
            已選 <b className="tabular-nums">{selected.size}</b> 團
          </span>
          <div className="flex items-center gap-3">
            <button type="button" onClick={() => setSelected(new Set())} className="text-muted hover:text-ink">
              取消選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("open")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              開放選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("closed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              截止選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={() => bulkSetStatus("completed")}
              className="rounded-lg border border-line px-3 py-1 font-semibold text-ink hover:bg-surface disabled:opacity-50"
            >
              完成選取
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={bulkDelete}
              className="rounded-lg border border-danger/40 px-3 py-1 font-semibold text-danger hover:bg-danger/10 disabled:opacity-50"
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
              <input type="checkbox" checked={pageAllSelected} onChange={togglePageAll} aria-label="選取本頁全部" />
            </Th>
            <Th>團名</Th>
            <Th>部門 / 單位</Th>
            <Th>套用模板</Th>
            <Th>團主</Th>
            <Th>日期</Th>
            <Th className="text-right">份數</Th>
            <Th className="text-right">金額</Th>
            <Th>狀態</Th>
          </tr>
        </thead>
        <tbody>
          {pageRows.length === 0 ? (
            <tr>
              <Td colSpan={9} className="text-center text-muted">
                還沒有任何團訂，點「代開團」建立第一筆。
              </Td>
            </tr>
          ) : (
            pageRows.map((r) => (
              <tr key={r.id} className={selected.has(r.id) ? "bg-brand-soft" : ""}>
                <Td>
                  <input
                    type="checkbox"
                    checked={selected.has(r.id)}
                    onChange={() => toggleOne(r.id)}
                    aria-label={`選取 ${r.name}`}
                  />
                </Td>
                <Td className="font-medium">{r.name}</Td>
                <Td>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge tone="brand">{r.departmentName || "—"}</Badge>
                    <span className="text-muted">{r.unitName}</span>
                  </div>
                </Td>
                <Td className="text-muted">{r.templateName}</Td>
                <Td className="text-muted">{r.hostName}</Td>
                <Td className="tabular-nums">{r.date}</Td>
                <Td className="text-right tabular-nums">{r.qty}</Td>
                <Td className="text-right tabular-nums">NT$ {r.amount}</Td>
                <Td>
                  <Badge tone={statusMap[r.status].tone}>{statusMap[r.status].label}</Badge>
                </Td>
              </tr>
            ))
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={filtered.length} pageSize={pageSize} onPage={setPage} unit="團" />
    </div>
  );
}
