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
  | "zones"
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
  | "promos";

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
    items: [{ key: "overview", label: "總覽", href: "/admin" }],
  },
  {
    key: "ordering",
    label: "訂餐與開團",
    items: [
      { key: "zones", label: "訂餐專區", href: "/admin/zones" },
      { key: "grouporders", label: "團訂", href: "/admin/group-orders" },
    ],
  },
  {
    key: "catalog",
    label: "菜單管理",
    items: [
      { key: "pages", label: "頁面設定", href: "/admin/pages" },
      { key: "templates", label: "模板設定", href: "/admin/templates" },
      { key: "itemClassification", label: "類別設定", href: "/admin/classification" },
      { key: "items", label: "品項設定", href: "/admin/items" },
    ],
  },
  {
    key: "finance",
    label: "財務",
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
    ],
  },
  {
    key: "system",
    label: "系統",
    items: [
      { key: "itemStats", label: "餐點統計", href: "/admin/item-stats" },
      { key: "reports", label: "報表", href: "/admin/reports" },
      { key: "audit", label: "稽核紀錄", href: "/admin/audit" },
    ],
  },
];

/** 頁尾次要連結 */
export const footerNav: { label: string; href: string }[] = [
  { label: "關於 MyMeal", href: "/about" },
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
