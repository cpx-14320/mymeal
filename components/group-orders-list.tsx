"use client";

import { Fragment, useState } from "react";
import Link from "next/link";
import {
  ButtonLink,
  Badge,
  Card,
  CardBody,
  PillTabs,
  Pagination,
} from "@/components/ui/primitives";
import {
  groupOrders,
  groupOrderTotals,
  templateById,
  templateKindLabel,
  unitById,
  departmentById,
  units,
  dateToSlug,
  type GroupOrder,
} from "@/lib/mock";

const statusMap = {
  open: { label: "開放中", tone: "positive" as const },
  closed: { label: "已截止", tone: "warning" as const },
  completed: { label: "已完成", tone: "neutral" as const },
};

const weekdayNames = ["日", "一", "二", "三", "四", "五", "六"];

function formatDateWithWeekday(dateStr: string) {
  const [y, m, d] = dateStr.split("/").map(Number);
  const date = new Date(y, m - 1, d);
  return `${dateStr}（${weekdayNames[date.getDay()]}）`;
}

const isDrinkKind = (g: GroupOrder) => {
  const kind = templateById(g.templateId)?.kind;
  return kind === "drinks" || kind === "tea";
};

const dayPageSizeOptions = [7, 14, 31] as const;

const filters: { label: string; test: (g: GroupOrder) => boolean }[] = [
  { label: "全部", test: () => true },
  { label: "便當", test: (g) => templateById(g.templateId)?.kind === "bento" },
  { label: "飲料・下午茶", test: isDrinkKind },
  { label: "開放中", test: (g) => g.status === "open" },
  { label: "我開的團", test: (g) => g.host === "林佩珊" },
];

export function GroupOrdersList() {
  const [filterLabel, setFilterLabel] = useState("全部");
  const [unitFilter, setUnitFilter] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(dayPageSizeOptions[0]);

  const activeFilter =
    filters.find((f) => f.label === filterLabel) ?? filters[0];
  const filtered = groupOrders
    .filter(activeFilter.test)
    .filter((g) => !unitFilter || g.unitId === unitFilter)
    .sort((a, b) => a.date.localeCompare(b.date));

  // 分頁以「天」為單位（而非卡片張數），跟畫面上依日期分區塊的呈現一致，
  // 也避免同一天的卡片被硬切到下一頁。
  const uniqueDates = [...new Set(filtered.map((g) => g.date))];
  const pageCount = Math.max(1, Math.ceil(uniqueDates.length / pageSize));
  const current = Math.min(page, pageCount);
  const dateStart = (current - 1) * pageSize;
  const pageDates = new Set(uniqueDates.slice(dateStart, dateStart + pageSize));
  const rows = filtered.filter((g) => pageDates.has(g.date));

  const dateGroups: { date: string; items: GroupOrder[] }[] = [];
  for (const g of rows) {
    const last = dateGroups[dateGroups.length - 1];
    if (last && last.date === g.date) last.items.push(g);
    else dateGroups.push({ date: g.date, items: [g] });
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          tabs={filters.map((f) => ({
            key: f.label,
            label: f.label,
            count: groupOrders.filter(f.test).length,
          }))}
          value={filterLabel}
          onChange={(key) => {
            setFilterLabel(key);
            setPage(1);
          }}
        />
        <div className="flex items-center gap-2">
          <select
            value={unitFilter}
            onChange={(e) => {
              setUnitFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-line bg-surface px-2 py-1.5 text-xs text-ink outline-none focus:border-brand"
            aria-label="依單位篩選"
          >
            <option value="">全部單位</option>
            {units.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name}
              </option>
            ))}
          </select>
          <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
            每頁顯示
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
              aria-label="每頁顯示天數"
            >
              {dayPageSizeOptions.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
            天
          </label>
        </div>
      </div>

      <div className="space-y-6">
        {dateGroups.map(({ date, items }) => {
          const byTemplate = new Map<string, GroupOrder[]>();
          for (const it of items) {
            const arr = byTemplate.get(it.templateId) ?? [];
            arr.push(it);
            byTemplate.set(it.templateId, arr);
          }

          return (
            <div key={date} className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-muted">
                  {formatDateWithWeekday(date)}
                </h2>
                <Link
                  href={`/group-orders/cluster/${dateToSlug(date)}`}
                  className="text-xs font-medium text-brand hover:underline"
                >
                  查看所有 →
                </Link>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {[...byTemplate.entries()].map(([templateId, group]) => {
                  const tpl = templateById(templateId);
                  return (
                    <Fragment key={templateId}>
                      {group.map((g) => {
                        const unit = unitById(g.unitId);
                        const dept = unit ? departmentById(unit.departmentId) : undefined;
                        const totals = groupOrderTotals(g);
                        return (
                          <Card key={g.id}>
                            <CardBody className="space-y-3">
                              <div className="flex items-start justify-between gap-2">
                                <div>
                                  <Link
                                    href={`/group-orders/${g.id}`}
                                    className="font-semibold hover:text-brand"
                                  >
                                    {g.name}
                                  </Link>
                                  <p className="mt-0.5 text-sm text-muted">
                                    {tpl?.name}
                                    {dept && unit ? `．${dept.name} ${unit.name}` : ""}
                                  </p>
                                </div>
                                <div className="flex shrink-0 gap-1.5">
                                  <Badge tone={isDrinkKind(g) ? "positive" : "brand"}>
                                    {tpl ? templateKindLabel[tpl.kind] : ""}
                                  </Badge>
                                  <Badge tone={statusMap[g.status].tone}>
                                    {statusMap[g.status].label}
                                  </Badge>
                                </div>
                              </div>

                              <dl className="grid grid-cols-2 gap-y-1 text-sm">
                                <dt className="text-muted">團主</dt>
                                <dd>{g.host}</dd>
                                <dt className="text-muted">已點份數</dt>
                                <dd className="tabular-nums">{totals.qty}</dd>
                                <dt className="text-muted">截止</dt>
                                <dd>{g.deadline}</dd>
                              </dl>

                              <ButtonLink
                                href={`/group-orders/${g.id}`}
                                variant="secondary"
                                className="w-full"
                              >
                                {g.status === "open" ? "查看 / 加入" : "查看明細"}
                              </ButtonLink>
                            </CardBody>
                          </Card>
                        );
                      })}
                    </Fragment>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      <Pagination
        page={current}
        pageCount={pageCount}
        total={uniqueDates.length}
        pageSize={pageSize}
        onPage={setPage}
        unit="天"
      />
    </div>
  );
}
