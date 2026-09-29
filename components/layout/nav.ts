/**
 * 全站共用的導覽設定 —— Header / Sidebar / Footer 都從這裡取用，
 * 之後要增減頁面或改文案，只改這一個檔案即可全站同步。
 */

export type NavKey =
  | "menu"
  | "catalog"
  | "group"
  | "orders"
  | "favorites"
  | "wallet"
  | "account"
  | "admin";

/** 前台側欄動態頁面連結——後台新增頁面就會同步多一個，見 sidebar.tsx / app-shell.tsx。 */
export interface PageNavItem {
  id: string;
  name: string;
  description: string;
  icon: string;
  iconSvg: string;
  slug: string;
  openInNewTab: boolean;
}

export interface NavItem {
  key: NavKey;
  label: string;
  href: string;
  /** 側欄項目的一行說明 */
  description: string;
  /** 需登入才能使用；訪客點擊會被導到登入頁 */
  requiresAuth: boolean;
  /** 僅管理者可見（已登入但非管理者會隱藏此項） */
  requiresAdmin?: boolean;
}

/** 側欄主導覽 */
export const primaryNav: NavItem[] = [
  {
    key: "group",
    label: "開團訂餐",
    href: "/group-orders",
    description: "開團或加入同事的團",
    requiresAuth: true,
  },
  {
    key: "orders",
    label: "我的訂單",
    href: "/orders",
    description: "查看與修改餐點",
    requiresAuth: true,
  },
  {
    key: "favorites",
    label: "我的收藏",
    href: "/favorites",
    description: "收藏的菜色",
    requiresAuth: true,
  },
  {
    key: "wallet",
    label: "錢包 / 儲值",
    href: "/wallet",
    description: "餘額、交易明細、儲值申請",
    requiresAuth: true,
  },
  {
    key: "account",
    label: "會員資料",
    href: "/account",
    description: "個人資料與等級",
    requiresAuth: true,
  },
  {
    key: "admin",
    label: "後台管理",
    href: "/admin",
    description: "管理者專用功能",
    requiresAuth: true,
    requiresAdmin: true,
  },
];

export type AdminNavKey =
  | "overview"
  | "pages"
  | "items"
  | "itemClassification"
  | "templates"
  | "grouporders"
  | "topups"
  | "wallets"
  | "members"
  | "memberInsights"
  | "roles"
  | "orgUnits"
  | "itemStats"
  | "gamification"
  | "reports"
  | "audit"
  | "promos"
  | "feedback"
  | "homePreview"
  | "guide";

export interface AdminNavItem {
  key: AdminNavKey;
  label: string;
  href: string;
}

export interface AdminNavGroup {
  /** 分組識別，用於記住收合狀態。沒有 label 的分組（總覽）不顯示標題、不可收合。 */
  key: string;
  label?: string;
  items: AdminNavItem[];
}

/** 後台管理導覽 —— 進入 /admin 後，側欄改顯示這組（取代前台項目）。
 *  依功能性質分組，各組可個別收合；要增減項目或調整分組只改這裡。 */
export const adminNav: AdminNavGroup[] = [
  {
    key: "overview",
    items: [
      { key: "overview", label: "總覽", href: "/admin" },
      { key: "guide", label: "功能說明", href: "/admin/guide" },
    ],
  },
  {
    key: "catalog",
    label: "品項管理",
    items: [
      { key: "pages", label: "頁面設定", href: "/admin/pages" },
      { key: "templates", label: "模板設定", href: "/admin/templates" },
      { key: "itemClassification", label: "類別設定", href: "/admin/classification" },
      { key: "items", label: "品項設定", href: "/admin/items" },
    ],
  },
  {
    key: "finance",
    label: "財務管理",
    items: [
      { key: "topups", label: "儲值審核", href: "/admin/topups" },
      { key: "wallets", label: "錢包與交易", href: "/admin/wallets" },
    ],
  },
  {
    key: "people",
    label: "會員與權限",
    items: [
      { key: "members", label: "會員列表", href: "/admin/members" },
      {
        key: "memberInsights",
        label: "會員洞察",
        href: "/admin/insights",
      },
      { key: "roles", label: "會員權限", href: "/admin/roles" },
      { key: "orgUnits", label: "部門與單位", href: "/admin/org" },
    ],
  },
  {
    key: "engagement",
    label: "互動與行銷",
    items: [
      { key: "gamification", label: "任務與經驗", href: "/admin/tasks" },
      { key: "promos", label: "廣宣版位", href: "/admin/promos" },
      { key: "feedback", label: "意見列表", href: "/admin/feedback" },
      { key: "homePreview", label: "首頁菜單預覽", href: "/admin/home-preview" },
    ],
  },
  {
    key: "system",
    label: "數據統計",
    items: [
      { key: "grouporders", label: "團訂狀況", href: "/admin/group-orders" },
      { key: "itemStats", label: "餐點統計", href: "/admin/item-stats" },
      { key: "reports", label: "報表", href: "/admin/reports" },
      { key: "audit", label: "稽核紀錄", href: "/admin/audit" },
    ],
  },
];

/** 頁尾次要連結 */
export const footerNav: { label: string; href: string }[] = [
  { label: "使用說明", href: "/help" },
  { label: "常見問題", href: "/faq" },
  { label: "意見回饋", href: "/feedback" },
];

export const LOGIN_HREF = "/login";
export const REGISTER_HREF = "/register";

/** 訪客狀態下，需登入的項目一律指向登入頁 */
export function resolveHref(item: NavItem, isAuthed: boolean): string {
  return item.requiresAuth && !isAuthed ? LOGIN_HREF : item.href;
}

/** 依目前網址找出這個後台頁面需要哪個權限鍵——跟 sidebar.tsx 判斷「目前 active 項目」同一套
 *  「取最長（最精確）符合的 href」邏輯，這樣巢狀路由（例如 /admin/pages/[id]）會對應到
 *  正確的父層項目（pages），不會被 href 比較短的其他項目搶走。
 *  找不到符合的項目（例如未來新增的頁面忘了註冊進 adminNav）回傳 null——呼叫端對 null
 *  的處理方式是「只要求有任一後台權限即可」，不會因為漏掛而直接把整個功能擋死。 */
export function resolveAdminNavKey(pathname: string): AdminNavKey | null {
  const items = adminNav.flatMap((g) => g.items);
  const matches = items.filter((item) =>
    item.href === "/admin"
      ? pathname === "/admin"
      : pathname === item.href || pathname.startsWith(`${item.href}/`),
  );
  if (matches.length === 0) return null;
  return matches.reduce((best, item) =>
    item.href.length > best.href.length ? item : best,
  ).key;
}
