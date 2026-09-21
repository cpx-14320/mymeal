import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

/* ── 版面 ────────────────────────────────────────────── */

export function PageContainer({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">
      <div className="space-y-8">{children}</div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-balance">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && (
        <div className="flex flex-wrap items-center gap-2">{actions}</div>
      )}
    </div>
  );
}

export function Section({
  title,
  description,
  /** 覆蓋標題文字樣式，預設 "text-lg font-bold tracking-tight"；用來讓次要標題套用較小的樣式（例如比照 NameListCard 的 "text-base font-medium"）。 */
  titleClassName = "text-lg font-bold tracking-tight",
  actions,
  children,
}: {
  title?: string;
  description?: string;
  titleClassName?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      {(title || description || actions) && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            {title && (
              <h2 className={`leading-none ${titleClassName}`}>{title}</h2>
            )}
            {description && (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            )}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </div>
      )}
      {children}
    </section>
  );
}

/* ── 容器 ────────────────────────────────────────────── */

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-line bg-surface ${className}`}>
      {children}
    </div>
  );
}

export function CardBody({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-10 text-center">
      <p className="font-medium">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted">{hint}</p>}
    </div>
  );
}

/* ── 按鈕 ──────────────────────────────────────────────
   全站按鈕只用 <Button> / <ButtonLink>，靠 variant + size 決定樣式，
   HTML class 結構完全共用（base + size + variant + 版面 class）。
   - variant：primary（主要動作，實心）／secondary（次要，灰框）／
     danger（破壞性，紅框）／ghost（最低調，無框，僅用於表單取消）
   - size：md（預設）／sm（表格「操作」欄用，＝儲值審核核准/退件的大小） */

type BtnVariant = "primary" | "secondary" | "ghost" | "danger";
type BtnSize = "sm" | "md";

const btnBase =
  "btn inline-flex items-center justify-center gap-1.5 rounded-lg text-sm font-semibold transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

const btnSizes: Record<BtnSize, string> = {
  sm: "px-3 py-1",
  md: "px-4 py-2",
};

const btnVariants: Record<BtnVariant, string> = {
  primary: "bg-brand text-brand-fg hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-2",
  ghost: "text-ink hover:bg-surface-2",
  danger: "border border-danger/40 text-danger hover:bg-danger/10",
};

export function buttonClass(
  variant: BtnVariant = "primary",
  size: BtnSize = "md",
  extra = "",
) {
  return `${btnBase} ${btnSizes[size]} ${btnVariants[variant]} ${extra}`;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ComponentProps<"button"> & { variant?: BtnVariant; size?: BtnSize }) {
  return (
    <button className={buttonClass(variant, size, className)} {...props}>
      {children}
    </button>
  );
}

export function ButtonLink({
  variant = "primary",
  size = "md",
  href,
  className = "",
  children,
}: {
  variant?: BtnVariant;
  size?: BtnSize;
  href: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

/* ── 標籤 / 徽章 ─────────────────────────────────────── */

type Tone = "neutral" | "brand" | "positive" | "warning" | "danger";

const toneCls: Record<Tone, string> = {
  neutral: "bg-surface-2 text-muted",
  brand: "bg-brand-soft text-brand",
  positive: "bg-positive/15 text-positive",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
};

export function Badge({
  tone = "neutral",
  children,
}: {
  tone?: Tone;
  children: ReactNode;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${toneCls[tone]}`}
    >
      {children}
    </span>
  );
}

/* ── 數據 ────────────────────────────────────────────── */

export function Stat({
  label,
  value,
  hint,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tracking-tight tabular-nums">{value}</p>
      {hint && <p className="mt-0.5 text-xs text-muted">{hint}</p>}
    </div>
  );
}

export function Progress({ value, max = 100 }: { value: number; max?: number }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className="h-2 w-full overflow-hidden rounded-full bg-surface-2"
      role="progressbar"
      aria-valuenow={value}
      aria-valuemax={max}
    >
      <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ── 分頁 ────────────────────────────────────────────
   前三頁 + … + 最後一頁；頁數 ≤ 4 時全部顯示。
   由 client 父層傳入 page / onPage。                     */

function pageList(count: number): (number | "…")[] {
  if (count <= 4) return Array.from({ length: count }, (_, i) => i + 1);
  return [1, 2, 3, "…", count];
}

/** 圓角篩選／頁籤按鈕列，帶選取態與可選計數。用於表格上方的
 *  類型篩選或子分頁切換（品項總表、團訂管理、儲值審核、錢包與交易）。 */
export function PillTabs<T extends string>({
  tabs,
  value,
  onChange,
}: {
  tabs: { key: T; label: string; count?: number }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((t) => {
        const active = t.key === value;
        return (
          <button
            key={t.key}
            type="button"
            onClick={() => onChange(t.key)}
            aria-pressed={active}
            className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
              active
                ? "bg-brand text-brand-fg"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {t.label}
            {t.count !== undefined && (
              <span className="ml-1.5 tabular-nums opacity-70">{t.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100] as const;

/** 「每頁顯示 [10/25/50/100] 筆」下拉，放在表格上方最右邊。 */
export function PageSizeSelect({
  value,
  onChange,
}: {
  value: number;
  onChange: (n: number) => void;
}) {
  return (
    <label className="flex items-center gap-1.5 whitespace-nowrap text-xs text-muted">
      每頁顯示
      <select
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="rounded-lg border border-line bg-surface px-2 py-1 text-xs text-ink outline-none focus:border-brand"
        aria-label="每頁顯示筆數"
      >
        {PAGE_SIZE_OPTIONS.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
      </select>
      筆
    </label>
  );
}

/** 表格上方常見的「搜尋框 + 每頁顯示」並排列——會員列表／稽核紀錄等清單頁共用。 */
export function ListSearchBar({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  pageSize,
  onPageSizeChange,
}: {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  pageSize: number;
  onPageSizeChange: (n: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="w-64">
        <input
          className={inputClass}
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
        />
      </div>
      <PageSizeSelect value={pageSize} onChange={onPageSizeChange} />
    </div>
  );
}

export function Pagination({
  page,
  pageCount,
  total,
  pageSize,
  onPage,
  unit = "筆",
}: {
  page: number;
  pageCount: number;
  total: number;
  pageSize: number;
  onPage: (p: number) => void;
  unit?: string;
}) {
  const start = (page - 1) * pageSize;
  const shown = Math.max(0, Math.min(pageSize, total - start));

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
      <p className="text-xs text-muted tabular-nums">
        第 {total === 0 ? 0 : start + 1}–{start + shown} {unit}，共 {total} {unit}
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onPage(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-muted enabled:hover:text-ink disabled:opacity-40"
        >
          ‹
        </button>
        {pageList(pageCount).map((p, i) =>
          p === "…" ? (
            <span key={`e${i}`} className="px-1.5 text-sm text-muted">
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPage(p)}
              aria-current={p === page ? "page" : undefined}
              className={`min-w-8 rounded-lg px-2.5 py-1.5 text-sm tabular-nums transition-colors ${
                p === page
                  ? "bg-brand text-brand-fg"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {p}
            </button>
          ),
        )}
        <button
          type="button"
          onClick={() => onPage(page + 1)}
          disabled={page >= pageCount}
          className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-sm text-muted enabled:hover:text-ink disabled:opacity-40"
        >
          ›
        </button>
      </div>
    </div>
  );
}

/** 列表用的狀態開關（無文字，綠＝開 / 灰＝關）。onToggle 由 client 父層傳入。 */
export function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onToggle}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors ${
        on ? "bg-positive" : "bg-line"
      }`}
    >
      <span
        className={`inline-block size-4 rounded-full bg-white shadow transition-transform ${
          on ? "translate-x-4" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

/* ── 表格 ────────────────────────────────────────────── */

export function TableWrap({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-line">
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}

export function Th({
  children,
  className = "",
  colSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
}) {
  return (
    <th
      colSpan={colSpan}
      className={`whitespace-nowrap bg-surface-2 px-4 py-2.5 text-left text-xs font-medium text-muted ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({
  children,
  className = "",
  colSpan,
  rowSpan,
}: {
  children?: ReactNode;
  className?: string;
  colSpan?: number;
  rowSpan?: number;
}) {
  return (
    <td
      colSpan={colSpan}
      rowSpan={rowSpan}
      className={`border-t border-line px-4 py-3 text-left align-middle ${className}`}
    >
      {children}
    </td>
  );
}

/* ── 表單 ────────────────────────────────────────────── */

export const inputClass =
  "w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-ink outline-none focus:border-brand";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-line border-l-[3px] border-l-brand bg-surface p-4 text-sm text-muted">
      {children}
    </div>
  );
}
