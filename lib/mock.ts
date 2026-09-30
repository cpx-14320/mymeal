/**
 * 共用的小型設定/工具函式——不是資料庫模型，也不是假資料，是幾個橫跨多個頁面共用、
 * 沒有自己資料庫集合的型別與計算邏輯（團訂匯出彙總、經驗值換算、權限勾選清單的分類結構）。
 * 真正的假資料已經清掉了；資料庫欄位對應的型別請看 lib/models/*.ts。
 */

import type { AdminNavKey } from "@/components/layout/nav";

/* ── 開團訂餐（團訂）匯出彙總 ───────────────────────────── */

export type RiceLevel = "normal" | "half" | "none";
export const riceLevelLabel: Record<RiceLevel, string> = {
  normal: "正常",
  half: "半飯",
  none: "不飯",
};

export interface DishOrderSummary {
  itemName: string;
  riceBreakdown: string;
  totalQty: number;
}

// 匯出彙總用：同一個餐點合併成一列，飯量顯示各飯量各幾份（例：正常x1、半飯x1）
export function summarizeOrderLines(lines: { itemName: string; qty: number; rice: RiceLevel }[]): DishOrderSummary[] {
  const map = new Map<string, Record<RiceLevel, number>>();
  for (const l of lines) {
    const counts = map.get(l.itemName) ?? { normal: 0, half: 0, none: 0 };
    counts[l.rice] += l.qty;
    map.set(l.itemName, counts);
  }
  return [...map.entries()].map(([itemName, counts]) => {
    const riceOrder: RiceLevel[] = ["normal", "half", "none"];
    const riceBreakdown = riceOrder
      .filter((r) => counts[r] > 0)
      .map((r) => `${riceLevelLabel[r]}x${counts[r]}`)
      .join("、");
    const totalQty = counts.normal + counts.half + counts.none;
    return { itemName, riceBreakdown, totalQty };
  });
}

export interface OrderLine {
  memberId: string;
  memberName: string;
  itemId: string;
  itemName: string;
  price: number;
  qty: number;
  note: string;
  rice: RiceLevel;
}

/* ── 會員權限（組別） ──────────────────────────────────
   組別＝權限鍵的組合，指派給會員；不同會員可以套用同一個組別。
   權限鍵跟後台側欄連結一對一對應（見 nav.ts 的 adminNav）：
   有這把權限鍵，側欄才會顯示對應連結、也才能瀏覽該頁面；
   「總覽」是後台的固定首頁，不受權限鍵管控，所有能進後台的人都看得到。 */

export interface PermissionGroup {
  key: AdminNavKey;
  label: string;
}

/** 權限鍵分類——比照後台側欄的分組（見 nav.ts 的 adminNav），
 *  讓「編輯權限」的勾選介面跟側欄一樣好對照。 */
export interface PermissionCategory {
  key: string;
  label: string;
  items: PermissionGroup[];
}

export const permissionCategories: PermissionCategory[] = [
  {
    key: "catalog",
    label: "菜單與訂餐",
    items: [
      { key: "templates", label: "模板" },
      { key: "pages", label: "頁面" },
      { key: "itemClassification", label: "分類與標籤" },
      { key: "items", label: "品項" },
    ],
  },
  {
    key: "finance",
    label: "財務管理",
    items: [
      { key: "topups", label: "儲值審核" },
      { key: "wallets", label: "錢包與交易" },
    ],
  },
  {
    key: "people",
    label: "會員與權限",
    items: [
      { key: "members", label: "會員列表" },
      { key: "memberInsights", label: "會員洞察" },
      { key: "roles", label: "會員權限" },
      { key: "orgUnits", label: "部門與單位" },
    ],
  },
  {
    key: "engagement",
    label: "互動與行銷",
    items: [
      { key: "gamification", label: "任務與經驗" },
      { key: "promos", label: "廣宣版位" },
      { key: "feedback", label: "意見列表" },
      { key: "homePreview", label: "首頁菜單預覽" },
    ],
  },
  {
    key: "system",
    label: "數據統計",
    items: [
      { key: "grouporders", label: "團訂狀況" },
      { key: "itemStats", label: "餐點統計" },
      { key: "audit", label: "稽核" },
    ],
  },
];

/* ── 任務與經驗值（遊戏化） ────────────────────────────
   task_type 沿用舊系統 enum('topup','order','favorite','comment','rating')。
   任務/規則/等級的「設定」本身已經是真資料（見 lib/models/gamification.ts，
   後台 /admin/tasks 直接編輯那三個 collection）；但會員的 exp 不另外存一份歷程，
   直接從既有的 orders/topups/ratings/comments/favorites 數量依規則算出來
   （簡化：忽略每日/每週/每月上限，只算「總計」，避免無中生有一份任務完成歷程）。
   下面這幾個函式吃 config 參數（呼叫端從 gamification.ts 撈真資料傳進來），
   不會各自 import 寫死的假規則。 */

export type TaskType = "topup" | "order" | "favorite" | "comment" | "rating";
export const taskTypeLabel: Record<TaskType, string> = {
  topup: "儲值",
  order: "訂餐",
  favorite: "收藏",
  comment: "評論",
  rating: "評分",
};

export type TaskPeriod = "daily" | "weekly" | "monthly" | "achievement";
export const taskPeriodLabel: Record<TaskPeriod, string> = {
  daily: "每日",
  weekly: "每週",
  monthly: "每月",
  achievement: "成就",
};

export interface ExpRuleConfig {
  id: string;
  type: TaskType;
  expPerAction: number;
}

export interface LevelConfig {
  id: string;
  name: string;
  minExp: number;
}

/** 行為 exp：依 expRules 把該會員各類動作次數（真實累積次數）換算成經驗值加總（不套用上限，只看總量）。
 *  這是總 exp 的其中一部分，另一部分是任務完成獎勵，見 lib/models/task-completion.ts 的
 *  getMemberTaskCompletionBonusExp——兩者相加才是會員實際總 exp，呼叫端（帳號頁）負責加總。 */
export function memberExp(counts: Record<TaskType, number>, expRules: ExpRuleConfig[]): number {
  return expRules.reduce((sum, rule) => sum + (counts[rule.type] ?? 0) * rule.expPerAction, 0);
}

export interface MemberLevelInfo {
  exp: number;
  level: LevelConfig;
  levelIndex: number;
  next: LevelConfig | null;
  expToNext: number | null;
  progressInLevel: number; // 0~1，在目前這一級裡的進度
}

/** 依總 exp（行為 exp + 任務完成獎勵 exp，呼叫端算好傳進來）換算目前等級、距下一級還差多少 exp。 */
export function memberLevelInfo(exp: number, levels: LevelConfig[]): MemberLevelInfo {
  const sorted = [...levels].sort((a, b) => a.minExp - b.minExp);
  let levelIndex = 0;
  for (let i = 0; i < sorted.length; i++) {
    if (exp >= sorted[i].minExp) levelIndex = i;
  }
  const level = sorted[levelIndex];
  const next = sorted[levelIndex + 1] ?? null;
  const expToNext = next ? next.minExp - exp : null;
  const progressInLevel = next ? (exp - level.minExp) / (next.minExp - level.minExp) : 1;
  return { exp, level, levelIndex, next, expToNext, progressInLevel };
}
