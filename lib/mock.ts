/**
 * 介面預覽用的假資料 —— 之後接後端會整個換掉。
 * 對應 v0.3 模型：品項總表 / 店家 / 模板（分類 → 品項）。
 */

import type { AdminNavKey } from "@/components/layout/nav";

export type ItemKind = "meal" | "drink" | "snack" | "other";

export const itemKindLabel: Record<ItemKind, string> = {
  meal: "餐點",
  drink: "飲料",
  snack: "點心",
  other: "其他",
};

export type TemplateKind = "bento" | "drinks" | "tea" | "other";

export const templateKindLabel: Record<TemplateKind, string> = {
  bento: "便當",
  drinks: "飲料",
  tea: "下午茶",
  other: "其他",
};

/* ── 店家（餐廳泛化） ─────────────────────────────── */

export interface Supplier {
  id: string;
  name: string;
  type: string;
  phone: string;
  active: boolean;
}

export const suppliers: Supplier[] = [
  { id: "s1", name: "福來鮮食", type: "便當店", phone: "07-123-4567", active: true },
  { id: "s2", name: "阿明快餐", type: "便當店", phone: "07-234-5678", active: true },
  { id: "s3", name: "健康廚房", type: "餐盒店", phone: "07-345-6789", active: true },
  { id: "s4", name: "星巴克 三多店", type: "咖啡", phone: "07-999-1234", active: true },
  { id: "s5", name: "五十嵐 中山店", type: "手搖飲", phone: "07-888-5678", active: true },
  { id: "s6", name: "老周麵館", type: "麵食", phone: "07-456-7890", active: false },
  { id: "s7", name: "大埕經濟餐盒", type: "便當店", phone: "07-511-2233", active: true },
  { id: "s8", name: "路易莎 中華店", type: "咖啡", phone: "07-236-4488", active: true },
  { id: "s9", name: "清心福全 光華店", type: "手搖飲", phone: "07-751-6677", active: true },
  { id: "s10", name: "多那之烘焙", type: "烘焙", phone: "07-333-9900", active: true },
  // 大量假資料 —— 讓「店家」分頁看得出效果
  ...[
    "福記便當", "大成餐盒", "品香廚房", "樂食便當", "康廚餐盒", "綠洲蔬食",
    "日初咖啡", "晨光烘焙", "味鮮小館", "家常廚房", "元氣餐盒", "翻轉飲品",
    "小確幸茶坊", "享點心", "初露咖啡", "御膳便當",
  ].map((name, i): Supplier => ({
    id: `s${11 + i}`,
    name,
    type: ["便當店", "餐盒店", "咖啡", "手搖飲", "烘焙", "麵食"][i % 6],
    phone: `07-${String(200 + i * 37).slice(-3)}-${String(1000 + i * 111).slice(-4)}`,
    active: i % 5 !== 0,
  })),
];

export const supplierById = (id?: string) => suppliers.find((s) => s.id === id);

/* ── 品項總表 ────────────────────────────────────── */

export interface CatalogItem {
  id: string;
  name: string;
  kind: ItemKind;
  category: string;
  supplierId: string;
  price: number;
  tags: string[];
  active: boolean;
  /** 沒有圖片時，清單縮圖顯示的備用 emoji */
  emoji: string;
  /** 圖片路徑 / 網址；接後端後由上傳流程寫入 */
  imageUrl?: string;
}

const baseCatalogItems: CatalogItem[] = [
  { id: "c1", name: "招牌雞腿飯", kind: "meal", category: "便當", supplierId: "s1", price: 95, tags: ["飯", "雞", "葷"], active: true, emoji: "🍗" },
  { id: "c2", name: "香煎鯖魚飯", kind: "meal", category: "便當", supplierId: "s1", price: 90, tags: ["飯", "魚", "葷"], active: true, emoji: "🐟" },
  { id: "c3", name: "蔥爆牛肉飯", kind: "meal", category: "便當", supplierId: "s2", price: 100, tags: ["飯", "牛", "葷"], active: true, emoji: "🥩" },
  { id: "c4", name: "宮保雞丁飯", kind: "meal", category: "便當", supplierId: "s2", price: 90, tags: ["飯", "雞", "葷"], active: true, emoji: "🌶️" },
  { id: "c5", name: "三色蔬食飯", kind: "meal", category: "便當", supplierId: "s1", price: 80, tags: ["飯", "素"], active: true, emoji: "🥗" },
  { id: "c6", name: "舒肥雞胸餐盒", kind: "meal", category: "餐盒", supplierId: "s3", price: 110, tags: ["無", "雞", "葷"], active: true, emoji: "🥙" },
  { id: "c7", name: "烤時蔬溫沙拉", kind: "meal", category: "沙拉", supplierId: "s3", price: 95, tags: ["素"], active: true, emoji: "🥬" },
  { id: "c8", name: "咖哩雞飯", kind: "meal", category: "便當", supplierId: "s1", price: 90, tags: ["飯", "雞", "葷"], active: true, emoji: "🍛" },
  { id: "c9", name: "滷排骨飯", kind: "meal", category: "便當", supplierId: "s1", price: 95, tags: ["飯", "豬", "葷"], active: true, emoji: "🍖" },
  { id: "d1", name: "美式咖啡（中）", kind: "drink", category: "咖啡", supplierId: "s4", price: 120, tags: [], active: true, emoji: "☕" },
  { id: "d2", name: "拿鐵（大）", kind: "drink", category: "咖啡", supplierId: "s4", price: 150, tags: [], active: true, emoji: "☕" },
  { id: "d3", name: "摩卡（大）", kind: "drink", category: "咖啡", supplierId: "s4", price: 160, tags: [], active: true, emoji: "🍫" },
  { id: "d4", name: "珍珠奶茶（大）", kind: "drink", category: "手搖飲", supplierId: "s5", price: 65, tags: ["正常"], active: true, emoji: "🧋" },
  { id: "d5", name: "冬瓜青茶（大）", kind: "drink", category: "手搖飲", supplierId: "s5", price: 45, tags: ["正常"], active: true, emoji: "🥤" },
  { id: "d6", name: "四季春茶（大）", kind: "drink", category: "手搖飲", supplierId: "s5", price: 40, tags: ["正常"], active: true, emoji: "🍵" },
  { id: "k1", name: "美式軟餅乾", kind: "snack", category: "點心", supplierId: "s4", price: 65, tags: [], active: true, emoji: "🍪" },
  { id: "k2", name: "紐約起司蛋糕", kind: "snack", category: "點心", supplierId: "s4", price: 120, tags: [], active: true, emoji: "🍰" },
];

/* 大量假資料 —— 讓「品項總表」分頁看得出效果（實際約 130+ 項） */
const mealNames = [
  "招牌雞腿", "蒜香雞腿", "照燒雞腿", "三杯雞", "宮保雞丁", "左宗棠雞", "椒麻雞", "鹽酥雞",
  "日式唐揚雞", "韓式炸雞", "香煎鯖魚", "蒲燒鯛魚", "香酥鱈魚", "塔塔魚排", "味噌鮭魚",
  "乾煎虱目魚肚", "糖醋魚片", "蔥爆牛肉", "黑胡椒牛柳", "沙茶牛肉", "紅燒牛腩", "咖哩牛肉",
  "招牌排骨", "糖醋排骨", "蒜泥排骨", "無錫排骨", "京都排骨", "酥炸豬排", "味噌豬排",
  "蜜汁叉燒", "蒜泥白肉", "梅干扣肉", "客家小炒", "三杯松阪豬", "打拋豬", "京醬肉絲",
  "螞蟻上樹", "沙茶羊肉", "孜然羊小排", "麻婆豆腐", "塔香茄子", "乾煸四季豆", "開陽白菜",
  "三色時蔬", "咖哩野菜", "照燒豆腐排", "南瓜燉飯", "焗烤蔬菜千層", "泰式打拋菇菇",
  "日式咖哩雞", "綠咖哩雞", "紅咖哩牛", "泰式綠咖哩野菜", "牛肉燴飯", "滑蛋蝦仁燴飯",
  "三鮮燴飯", "港式叉燒飯", "星洲炒米粉", "什錦炒麵", "乾拌麻醬麵", "麻辣牛肉麵",
  "紅燒牛肉麵", "雪菜肉絲麵", "餛飩湯麵", "凱薩雞肉沙拉", "鮮蝦酪梨沙拉", "烤時蔬溫沙拉",
  "舒肥雞胸沙拉", "地中海穀物碗", "泰式牛肉沙拉", "煙燻鮭魚沙拉",
];
const drinkNames = [
  "美式咖啡", "拿鐵", "卡布奇諾", "摩卡", "焦糖瑪奇朵", "香草拿鐵", "榛果拿鐵", "抹茶拿鐵",
  "黑糖鮮奶", "燕麥奶拿鐵", "阿薩姆紅茶", "錫蘭紅茶", "四季春青茶", "高山烏龍", "茉莉綠茶",
  "冬瓜茶", "檸檬紅茶", "多多綠", "百香雙響炮", "蜂蜜檸檬", "珍珠奶茶", "波霸紅茶拿鐵",
  "仙草凍奶茶", "芋頭鮮奶", "布丁奶茶", "可可歐蕾",
];
const snackNames = [
  "巧克力豆餅乾", "檸檬磅蛋糕", "提拉米蘇", "經典布朗尼", "檸檬塔", "法式可頌", "原味貝果",
  "英式司康", "巧克力馬芬", "藍莓馬芬", "肉桂捲", "葡式蛋塔", "銅鑼燒", "卡士達泡芙",
  "費南雪", "瑪德蓮", "抹茶生乳捲", "蜂蜜蛋糕",
];

const suppliersByKind: Record<ItemKind, string[]> = {
  meal: ["s1", "s2", "s3", "s7"],
  drink: ["s4", "s8", "s9", "s5"],
  snack: ["s4", "s10", "s8"],
  other: ["s1"],
};
const priceByKind: Record<ItemKind, number[]> = {
  meal: [80, 85, 90, 95, 100, 105, 110, 120],
  drink: [45, 50, 55, 60, 65, 120, 150, 160],
  snack: [55, 60, 65, 75, 95, 120],
  other: [50],
};
const emojiByKind: Record<ItemKind, string[]> = {
  meal: ["🍱", "🍗", "🍛", "🍖", "🐟", "🥩", "🍤", "🍜"],
  drink: ["☕", "🧋", "🥤", "🍵", "🧃"],
  snack: ["🍪", "🍰", "🥐", "🧁", "🍮"],
  other: ["🍽️"],
};
const catByKind: Record<ItemKind, string[]> = {
  meal: ["便當", "餐盒", "麵食", "沙拉"],
  drink: ["咖啡", "茶飲", "手搖飲"],
  snack: ["點心", "烘焙"],
  other: ["其他"],
};
const mealSuffix = ["便當", "飯", "餐盒"];
const drinkSuffix = ["（中）", "（大）"];

function makeItems(
  names: string[],
  kind: ItemKind,
  prefix: string,
): CatalogItem[] {
  return names.map((n, i) => ({
    id: `${prefix}${i}`,
    name:
      kind === "meal"
        ? n + mealSuffix[i % mealSuffix.length]
        : kind === "drink"
          ? n + drinkSuffix[i % drinkSuffix.length]
          : n,
    kind,
    category: catByKind[kind][i % catByKind[kind].length],
    supplierId: suppliersByKind[kind][i % suppliersByKind[kind].length],
    price: priceByKind[kind][i % priceByKind[kind].length],
    tags:
      kind === "meal"
        ? [
            ["飯", "麵", "冬粉", "無"][i % 4],
            ["雞", "豬", "牛", "羊", "素"][i % 5],
          ]
        : kind === "drink"
          ? [["正常", "去冰", "半糖"][i % 3]]
          : [],
    active: i % 17 !== 0,
    emoji: emojiByKind[kind][i % emojiByKind[kind].length],
  }));
}

export const catalogItems: CatalogItem[] = [
  ...baseCatalogItems,
  ...makeItems(mealNames, "meal", "gm"),
  ...makeItems(drinkNames, "drink", "gd"),
  ...makeItems(snackNames, "snack", "gk"),
];

export const itemById = (id: string) => catalogItems.find((i) => i.id === id);

/* ── 品項標籤群組 ─────────────────────────────────
   標籤依群組管理（主食：飯/麵…；肉類：雞/豬/羊…）。
   後台可增減群組與選項；編輯品項時從這些選項勾選。       */

export interface TagGroup {
  id: string;
  name: string;
  /** 是否可複選（例：肉類可多選；主食單選） */
  multi: boolean;
  options: string[];
}

export const tagGroups: TagGroup[] = [
  { id: "staple", name: "主食", multi: false, options: ["飯", "麵", "冬粉", "無"] },
  { id: "meat", name: "肉類", multi: true, options: ["雞", "豬", "牛", "羊", "魚", "海鮮"] },
  { id: "diet", name: "飲食", multi: false, options: ["葷", "素", "奶蛋素", "五辛素"] },
  { id: "sugar-ice", name: "甜度冰塊", multi: true, options: ["正常", "去冰", "半糖", "微糖", "無糖"] },
];

export const allTagOptions = () => tagGroups.flatMap((g) => g.options);

/* ── 蓋台廣告：已改用真資料庫，見 lib/models/interstitial.ts ── */

/* ── 模板（分類 → 品項） ─────────────────────────── */

export interface TemplateSection {
  id: string;
  name: string;
  itemIds: string[];
}

export interface Template {
  id: string;
  name: string;
  kind: TemplateKind;
  supplierId?: string;
  active: boolean;
  sections: TemplateSection[];
}

export const templates: Template[] = [
  {
    id: "t1",
    name: "標準便當週",
    kind: "bento",
    active: true,
    sections: [
      { id: "t1s1", name: "星期一", itemIds: ["c1", "c2", "c3", "c4", "c5", "c6", "c7"] },
      { id: "t1s2", name: "星期二", itemIds: ["c2", "c3", "c4", "c5", "c6", "c7", "c8"] },
      { id: "t1s3", name: "星期三", itemIds: ["c3", "c4", "c5", "c6", "c7", "c8", "c9"] },
      { id: "t1s4", name: "星期四", itemIds: ["c4", "c5", "c6", "c7", "c8", "c9", "c1"] },
      { id: "t1s5", name: "星期五", itemIds: ["c5", "c6", "c7", "c8", "c9", "c1", "c2"] },
    ],
  },
  {
    id: "t2",
    name: "星巴克團",
    kind: "drinks",
    supplierId: "s4",
    active: true,
    sections: [{ id: "t2s1", name: "飲料 / 點心", itemIds: ["d1", "d2", "d3", "k1", "k2"] }],
  },
  {
    id: "t3",
    name: "手搖下午茶",
    kind: "tea",
    supplierId: "s5",
    active: true,
    sections: [{ id: "t3s1", name: "飲料", itemIds: ["d4", "d5", "d6"] }],
  },
  {
    id: "t4",
    name: "輕食週菜單",
    kind: "bento",
    active: false,
    sections: [
      { id: "t4s1", name: "星期一", itemIds: ["c6", "c7"] },
      { id: "t4s2", name: "星期三", itemIds: ["c7", "c5"] },
      { id: "t4s3", name: "星期五", itemIds: ["c6", "c7"] },
    ],
  },
  // 大量假資料 —— 讓「模板」分頁看得出效果
  ...Array.from({ length: 22 }, (_, i): Template => {
    const kind = (["bento", "drinks", "tea", "other"] as const)[i % 4];
    const secNames =
      kind === "bento"
        ? ["星期一", "星期二", "星期三", "星期四", "星期五"]
        : ["飲料", "點心"];
    const suffix =
      kind === "bento"
        ? "便當週"
        : kind === "drinks"
          ? "飲品單"
          : kind === "tea"
            ? "下午茶"
            : "特別餐";
    return {
      id: `tg${i}`,
      name: `${["季節", "主廚", "精選", "輕食", "經典", "活力", "樂活", "元氣"][i % 8]}${suffix} ${i + 1}`,
      kind,
      supplierId:
        kind === "drinks" ? "s4" : kind === "tea" ? "s5" : undefined,
      active: i % 6 !== 0,
      sections: secNames.map((n, j) => ({
        id: `tg${i}s${j}`,
        name: n,
        itemIds: kind === "bento" ? ["c1", "c3", "c5"] : ["d1", "d2", "k1"],
      })),
    };
  }),
];

export const templateById = (id: string) => templates.find((t) => t.id === id);

/* ── 訂餐專區（前台頁面） ─────────────────────────────
   一個專區 = 前台一個頁面（/z/{slug}），套用一到多個模板（多對多）。
   同一個模板可以被多個專區共用。                              */

export interface OrderZone {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon: string;
  templateIds: string[];
  active: boolean;
  sortOrder: number;
}

export const orderZones: OrderZone[] = [
  {
    id: "z1",
    name: "本週便當",
    slug: "lunch",
    description: "每天中午的便當團，套用當週便當菜單。",
    icon: "🍱",
    templateIds: ["t1", "t4"],
    active: true,
    sortOrder: 1,
  },
  {
    id: "z2",
    name: "下午茶",
    slug: "afternoon-tea",
    description: "手搖飲、咖啡、點心的下午茶團。",
    icon: "🧋",
    templateIds: ["t2", "t3"],
    active: true,
    sortOrder: 2,
  },
  {
    id: "z3",
    name: "星巴克揪團",
    slug: "starbucks",
    description: "揪一波星巴克，滿額外送。",
    icon: "☕",
    templateIds: ["t2"],
    active: true,
    sortOrder: 3,
  },
  {
    id: "z4",
    name: "尾牙飲料（12月限定）",
    slug: "year-end-drinks",
    description: "尾牙月限定，活動後下架。",
    icon: "🎉",
    templateIds: ["t3"],
    active: false,
    sortOrder: 4,
  },
  // 大量假資料 —— 讓「訂餐專區」分頁看得出效果
  ...[
    "研發部午餐", "設計部揪團", "行政週一便當", "業務部星巴克", "資訊部下午茶",
    "客服部訂餐", "五樓便當團", "三樓飲料團", "跨部門聚餐", "加班宵夜團",
    "週五輕食日", "健康餐盒週", "新人歡迎茶會", "專案衝刺補給", "訪客便當",
    "董事會茶點", "早餐訂購團", "週三素食日", "端午肉粽團", "中秋月餅團",
    "尾牙前哨團", "季會便當",
  ].map((name, i): OrderZone => ({
    id: `zg${i}`,
    name,
    slug: `zone-${i + 5}`,
    description: `${name}的訂購專區。`,
    icon: ["🍱", "🧋", "☕", "🍜", "🥗", "🍰"][i % 6],
    templateIds: [["t1"], ["t2"], ["t3"], ["t1", "t4"], ["t2", "t3"]][i % 5],
    active: i % 7 !== 0,
    sortOrder: 5 + i,
  })),
];

// 一個模板最多只會被 3 個專區使用；超過的部分移除，不留假資料。
const MAX_ZONES_PER_TEMPLATE = 3;
const zonesPerTemplateUsage: Record<string, number> = {};
for (const zone of orderZones) {
  zone.templateIds = zone.templateIds.filter((tid) => {
    zonesPerTemplateUsage[tid] = (zonesPerTemplateUsage[tid] ?? 0) + 1;
    return zonesPerTemplateUsage[tid] <= MAX_ZONES_PER_TEMPLATE;
  });
}

export const zoneById = (id: string) => orderZones.find((z) => z.id === id);

export const zonesUsingTemplate = (templateId: string) =>
  orderZones.filter((z) => z.templateIds.includes(templateId));

/* ── 會員 ──────────────────────────────────────────── */

export type MemberStatus = "active" | "suspended";

export interface Member {
  id: string;
  employeeId: string;
  name: string;
  account: string;
  email: string;
  dept: string;
  unit: string;
  role: string;
  status: MemberStatus;
  last: string;
  avatarUrl?: string;
}

const memberNames = [
  "林佩珊", "王建豪", "陳怡君", "張家瑋", "黃志明", "李冠廷", "吳雅婷", "蔡孟儒",
  "鄭凱文", "許家豪", "周宜蓁", "謝旻軒", "洪世昌", "江佩蓉", "曾柏翰", "邱瑋倫",
  "賴品妍", "蕭子涵", "羅偉誠", "高鈺婷", "潘冠宇", "簡淑芬", "范植偉", "杜曉琪", "藍柏勳",
];
export const memberDepts = [
  "網路發展部", "設計部", "行政部", "業務部", "資訊部", "客服部", "財務部", "人資部",
];
export const memberUnits = ["三樓", "五樓", "七樓", "九樓"];

/* ── 會員權限（組別） ──────────────────────────────────
   組別＝權限鍵的組合，指派給會員；不同會員可以套用同一個組別。
   權限鍵跟後台側欄連結一對一對應（見 nav.ts 的 adminNav）：
   有這把權限鍵，側欄才會顯示對應連結、也才能瀏覽該頁面；
   「總覽」是後台的固定首頁，不受權限鍵管控，所有能進後台的人都看得到。
   （側欄實際依權限顯示/隱藏的邏輯之後再接上，這裡先把資料模型對齊。） */

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
      { key: "zones", label: "訂餐專區" },
      { key: "templates", label: "模板" },
      { key: "pages", label: "頁面" },
      { key: "itemClassification", label: "分類與標籤" },
      { key: "items", label: "品項" },
      { key: "grouporders", label: "團訂" },
    ],
  },
  {
    key: "finance",
    label: "財務",
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
    ],
  },
  {
    key: "system",
    label: "系統",
    items: [
      { key: "itemStats", label: "餐點統計" },
      { key: "reports", label: "報表" },
      { key: "audit", label: "稽核" },
    ],
  },
];

export const permissionGroups: PermissionGroup[] = permissionCategories.flatMap(
  (c) => c.items,
);

function memberTimestamp(
  day: number,
  hour: number,
  minute: number,
  second: number,
) {
  return `2026/09/${String(day).padStart(2, "0")} ${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:${String(second).padStart(2, "0")}`;
}

const memberRoleCycle = [
  "一般使用者", "一般使用者", "一般使用者", "餐飲管理員", "財務管理員",
  "客服管理員", "一般使用者", "超級管理員",
];

export const members: Member[] = memberNames.map((name, i) => {
  const status: MemberStatus = i % 11 === 3 ? "suspended" : "active";
  return {
    id: `m${i + 1}`,
    employeeId: `E${String(10001 + i).padStart(6, "0")}`,
    name,
    account: `user${i + 1}`,
    email: `user${i + 1}@company.com`,
    dept: memberDepts[i % memberDepts.length],
    unit: memberUnits[i % memberUnits.length],
    role: memberRoleCycle[i % memberRoleCycle.length],
    status,
    last: memberTimestamp(10 - (i % 8), 8 + (i % 10), (i * 7) % 60, (i * 19) % 60),
  };
});

// 目前登入的會員（介面預覽固定用第一位）——錢包餘額、「我開的團」等前台個人化顯示都以這位為準
export const currentMemberId = members[0].id;

export const memberById = (id: string) => members.find((m) => m.id === id);

export const membersInGroup = (groupName: string) =>
  members.filter((m) => m.role === groupName).length;

/* ── 組織架構：部門 → 單位（→ 課員，見上面的 members）──
   之後會是真的資料庫表、跟著註冊會員資料變動；這裡先用固定假資料
   demo「一個模板被多個單位各自開團、部門負責人可跨單位彙總」的邏輯。
   跟 Member.dept / Member.unit（樓層字串）是不同概念，先不互相參照。 */

export interface Department {
  id: string;
  name: string;
}

export interface Unit {
  id: string;
  name: string;
  departmentId: string;
}

export const departments: Department[] = [
  { id: "dep1", name: "業務部" },
  { id: "dep2", name: "研發部" },
  { id: "dep3", name: "行政部" },
  { id: "dep4", name: "財務部" },
];

export const units: Unit[] = [
  { id: "u1", name: "業務一組", departmentId: "dep1" },
  { id: "u2", name: "業務二組", departmentId: "dep1" },
  { id: "u3", name: "前端組", departmentId: "dep2" },
  { id: "u4", name: "後端組", departmentId: "dep2" },
  { id: "u5", name: "總務組", departmentId: "dep3" },
  { id: "u6", name: "人資組", departmentId: "dep3" },
  { id: "u7", name: "會計組", departmentId: "dep4" },
  { id: "u8", name: "出納組", departmentId: "dep4" },
];

export const departmentById = (id: string) => departments.find((d) => d.id === id);
export const unitById = (id: string) => units.find((u) => u.id === id);
export const unitsInDepartment = (departmentId: string) =>
  units.filter((u) => u.departmentId === departmentId);

/* ── 開團訂餐（團訂）───────────────────────────────────
   一個 Template 可以同時被多個單位各自開團（同一天也可以），
   每團有自己的訂單明細（逐人品項，snapshot 名稱/價格）。 */

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

export type PaymentMethod = "wallet" | "cash" | "voucher" | "free";
export const paymentMethods: PaymentMethod[] = ["wallet", "cash", "voucher", "free"];
export const paymentMethodLabel: Record<PaymentMethod, string> = {
  wallet: "儲值扣款",
  cash: "現金付款",
  voucher: "餐券付款",
  free: "免費",
};

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

export type GroupOrderStatus = "open" | "closed" | "completed";

export interface GroupOrder {
  id: string;
  name: string;
  templateId: string;
  unitId: string;
  host: string;
  date: string;
  deadline: string;
  status: GroupOrderStatus;
  lines: OrderLine[];
}

function groupOrderDate(offsetDays: number) {
  const base = new Date(2026, 8, 16);
  base.setDate(base.getDate() + offsetDays);
  return `${base.getFullYear()}/${String(base.getMonth() + 1).padStart(2, "0")}/${String(base.getDate()).padStart(2, "0")}`;
}

const riceLevelCycle: RiceLevel[] = ["normal", "normal", "half", "none"];

function buildOrderLines(templateId: string, seedIndex: number): OrderLine[] {
  const tpl = templateById(templateId);
  const allItemIds = tpl ? tpl.sections.flatMap((s) => s.itemIds) : [];
  const lineCount = 4 + (seedIndex % 5);
  return Array.from({ length: lineCount }, (_, j) => {
    const member = members[(seedIndex * 5 + Math.floor(j / 2)) % members.length];
    const itemId = allItemIds.length
      ? allItemIds[(seedIndex + j) % allItemIds.length]
      : "c1";
    const item = itemById(itemId);
    return {
      memberId: member.id,
      memberName: member.name,
      itemId,
      itemName: item?.name ?? itemId,
      price: item?.price ?? 0,
      qty: 1 + ((seedIndex + j) % 2),
      note: j % 4 === 0 ? "少鹽" : "",
      rice: riceLevelCycle[(seedIndex + j) % riceLevelCycle.length],
    };
  });
}

const groupOrderSeeds: {
  name: string;
  templateId: string;
  unitId: string;
  hostIdx: number;
  dateOffset: number;
  status: GroupOrderStatus;
}[] = [
  { name: "業務一組 週三便當團", templateId: "t1", unitId: "u1", hostIdx: 0, dateOffset: 0, status: "open" },
  { name: "業務二組 週三便當團", templateId: "t1", unitId: "u2", hostIdx: 1, dateOffset: 0, status: "open" },
  { name: "前端組 週三便當團", templateId: "t1", unitId: "u3", hostIdx: 2, dateOffset: 0, status: "open" },
  { name: "總務組 週三便當團", templateId: "t1", unitId: "u5", hostIdx: 3, dateOffset: 0, status: "closed" },
  { name: "人資組 週三便當團", templateId: "t1", unitId: "u6", hostIdx: 7, dateOffset: 0, status: "completed" },
  { name: "後端組 星巴克團", templateId: "t2", unitId: "u4", hostIdx: 4, dateOffset: 1, status: "open" },
  { name: "會計組 手搖下午茶", templateId: "t3", unitId: "u7", hostIdx: 5, dateOffset: 1, status: "completed" },
  { name: "業務一組 輕食週便當", templateId: "t4", unitId: "u1", hostIdx: 6, dateOffset: 2, status: "open" },
  { name: "總務組 星巴克團", templateId: "t2", unitId: "u5", hostIdx: 3, dateOffset: 2, status: "completed" },
  { name: "出納組 星巴克團", templateId: "t2", unitId: "u8", hostIdx: 0, dateOffset: 3, status: "open" },
  { name: "人資組 星巴克團", templateId: "t2", unitId: "u6", hostIdx: 9, dateOffset: 3, status: "open" },
  { name: "業務二組 手搖下午茶", templateId: "t3", unitId: "u2", hostIdx: 1, dateOffset: 3, status: "closed" },
  { name: "後端組 手搖下午茶", templateId: "t3", unitId: "u4", hostIdx: 10, dateOffset: 3, status: "open" },
  { name: "前端組 輕食週便當", templateId: "t4", unitId: "u3", hostIdx: 2, dateOffset: 4, status: "open" },
];

export const groupOrders: GroupOrder[] = groupOrderSeeds.map((seed, i) => ({
  id: `go${i + 1}`,
  name: seed.name,
  templateId: seed.templateId,
  unitId: seed.unitId,
  host: members[seed.hostIdx % members.length].name,
  date: groupOrderDate(seed.dateOffset),
  deadline:
    seed.status === "open"
      ? "今天 17:00 截止"
      : seed.status === "closed"
        ? "已截止"
        : "已完成",
  status: seed.status,
  lines: buildOrderLines(seed.templateId, i),
}));

export const groupOrderById = (id: string) =>
  groupOrders.find((g) => g.id === id);

export const groupOrdersByUnit = (unitId: string) =>
  groupOrders.filter((g) => g.unitId === unitId);

export const groupOrdersByDepartment = (departmentId: string) => {
  const unitIds = new Set(unitsInDepartment(departmentId).map((u) => u.id));
  return groupOrders.filter((g) => unitIds.has(g.unitId));
};

// 同一模板＋同一天，被多個單位分別開團的「同團」——前台可彙總查看／勾選匯出
export const dateToSlug = (date: string) => date.replaceAll("/", "-");
export const slugToDate = (slug: string) => slug.replaceAll("-", "/");

export const groupOrdersByTemplateAndDate = (templateId: string, date: string) =>
  groupOrders.filter((g) => g.templateId === templateId && g.date === date);

export interface ClusterableTemplate {
  templateId: string;
  orders: GroupOrder[];
}

// 某一天裡有開團的每個模板（不論該模板當天是 1 團還是多團）——彙總頁用來決定當天要顯示哪些 tabs
export function clusterableTemplatesForDate(date: string): ClusterableTemplate[] {
  const map = new Map<string, GroupOrder[]>();
  for (const g of groupOrders) {
    if (g.date !== date) continue;
    const arr = map.get(g.templateId) ?? [];
    arr.push(g);
    map.set(g.templateId, arr);
  }
  return [...map.entries()].map(([templateId, orders]) => ({ templateId, orders }));
}

export function groupOrderTotals(order: GroupOrder) {
  return order.lines.reduce(
    (acc, l) => ({ qty: acc.qty + l.qty, amount: acc.amount + l.price * l.qty }),
    { qty: 0, amount: 0 },
  );
}

export interface DepartmentExportSummary {
  departmentId: string;
  departmentName: string;
  unitCount: number;
  orderCount: number;
  totalQty: number;
  totalAmount: number;
  byUnit: {
    unitId: string;
    unitName: string;
    orderCount: number;
    qty: number;
    amount: number;
  }[];
}

export function departmentExportSummary(
  departmentId: string,
): DepartmentExportSummary | undefined {
  const dept = departmentById(departmentId);
  if (!dept) return undefined;
  const byUnit = unitsInDepartment(departmentId).map((u) => {
    const orders = groupOrdersByUnit(u.id);
    const totals = orders.reduce(
      (acc, o) => {
        const t = groupOrderTotals(o);
        return { qty: acc.qty + t.qty, amount: acc.amount + t.amount };
      },
      { qty: 0, amount: 0 },
    );
    return {
      unitId: u.id,
      unitName: u.name,
      orderCount: orders.length,
      qty: totals.qty,
      amount: totals.amount,
    };
  });
  return {
    departmentId: dept.id,
    departmentName: dept.name,
    unitCount: byUnit.length,
    orderCount: byUnit.reduce((s, u) => s + u.orderCount, 0),
    totalQty: byUnit.reduce((s, u) => s + u.qty, 0),
    totalAmount: byUnit.reduce((s, u) => s + u.amount, 0),
    byUnit,
  };
}

/* ── 會員洞察 ──────────────────────────────────────────
   分析單一會員的訂餐習慣（訂餐紀錄／收藏／評論／評分），
   用於「訂餐沒想法時，看這個人平常都點什麼」。全部由品項總表衍生，
   不重複儲存品項名稱／價格以外的欄位。                        */

export interface MemberOrderRecord {
  itemId: string;
  itemName: string;
  price: number;
  quantity: number;
  date: string;
}

export interface MemberComment {
  itemId: string;
  text: string;
  stars: number;
  at: string;
}

export interface MemberRating {
  itemId: string;
  stars: number;
}

export interface MemberTopupRecord {
  amount: number;
  method: string;
  at: string;
}

export interface MemberFavorite {
  itemId: string;
  at: string;
}

export interface MemberInsight {
  balance: number;
  orders: MemberOrderRecord[];
  favorites: MemberFavorite[];
  comments: MemberComment[];
  ratings: MemberRating[];
  topups: MemberTopupRecord[];
}

/** 品項的標籤裡，屬於某個標籤群組（例：主食、肉類）的那一個值；沒有就回傳 "—"。 */
export function itemTagForGroup(item: CatalogItem, groupId: string): string {
  const group = tagGroups.find((g) => g.id === groupId);
  if (!group) return "—";
  const tag = item.tags.find((t) => group.options.includes(t));
  return tag ?? "—";
}

const insightCommentTexts = [
  "很好吃，下次還要點！",
  "份量剛好，推薦。",
  "有點油但味道不錯。",
  "偏鹹，希望可以少鹽。",
  "CP值很高。",
  "配菜很豐富。",
];

function toDate(offset: number) {
  return `09/${(offset % 27) + 1}`;
}

function toFullDate(offset: number) {
  return `2026/09/${String((offset % 27) + 1).padStart(2, "0")}`;
}

const memberInsightsMap: Record<string, MemberInsight> = {};

members.forEach((m, i) => {
  const orderCount = 30 + (i % 40);
  const orders: MemberOrderRecord[] = Array.from(
    { length: orderCount },
    (_, j) => {
      const item = catalogItems[(i * 3 + j) % catalogItems.length];
      return {
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        quantity: 1 + ((i + j) % 3),
        date: toFullDate(i + j),
      };
    },
  );

  const favoriteCount = 12 + (i % 20);
  const favorites: MemberFavorite[] = Array.from(
    { length: favoriteCount },
    (_, j) => ({
      itemId: catalogItems[(i * 5 + j * 2) % catalogItems.length].id,
      at: memberTimestamp(
        ((i + j * 2) % 27) + 1,
        9 + ((i + j) % 10),
        (i * 5 + j) % 60,
        (i * 11 + j) % 60,
      ),
    }),
  );

  const commentCount = 12 + (i % 15);
  // 評論集中在前 15 個熱門品項（而非均攤在全部 132 個品項），
  // 這樣熱門品項才會累積出夠多評論，可以看出分頁效果。
  const commentedItemPool = catalogItems.slice(0, 15);
  const comments: MemberComment[] = Array.from(
    { length: commentCount },
    (_, j) => ({
      itemId: commentedItemPool[(i + j) % commentedItemPool.length].id,
      text: insightCommentTexts[(i + j) % insightCommentTexts.length],
      stars: 3 + ((i + j) % 3),
      at: memberTimestamp(
        ((i + j + 3) % 27) + 1,
        10 + ((i + j) % 11),
        (i * 9 + j) % 60,
        (i * 17 + j) % 60,
      ),
    }),
  );

  const ratingCount = 15 + (i % 25);
  const ratings: MemberRating[] = Array.from(
    { length: ratingCount },
    (_, j) => ({
      itemId: catalogItems[(i * 4 + j) % catalogItems.length].id,
      stars: 3 + ((i + j) % 3),
    }),
  );

  const topupCount = 15 + (i % 20);
  const topups: MemberTopupRecord[] = Array.from(
    { length: topupCount },
    (_, j) => ({
      amount: [300, 500, 1000, 1500][(i + j) % 4],
      method: ["現金", "銀行轉帳", "信用卡"][(i + j) % 3],
      at: memberTimestamp(
        ((i + j) % 27) + 1,
        8 + ((i + j) % 12),
        (i * 7 + j) % 60,
        (i * 13 + j) % 60,
      ),
    }),
  );

  const spent = orders.reduce((s, o) => s + o.price * o.quantity, 0);
  const toppedUp = topups.reduce((s, t) => s + t.amount, 0);
  const balance = Math.max(0, toppedUp - spent + 500);

  memberInsightsMap[m.id] = {
    balance,
    orders,
    favorites,
    comments,
    ratings,
    topups,
  };
});

export const memberInsightById = (id: string) => memberInsightsMap[id];

export interface MemberItemBreakdown {
  itemId: string;
  itemName: string;
  category: string;
  tags: string[];
  totalQuantity: number;
  orderCount: number;
}

/** 把訂餐紀錄依品項彙總——分類/標籤 + 總訂購數量/訂單次數一目了然，
 *  用來判斷這位會員偏好哪一種品項（飯/麵、豬/牛…）。 */
export function memberItemBreakdown(id: string): MemberItemBreakdown[] {
  const insight = memberInsightsMap[id];
  const byItem = new Map<string, MemberItemBreakdown>();
  for (const o of insight.orders) {
    const item = itemById(o.itemId);
    if (!item) continue;
    const existing = byItem.get(o.itemId);
    if (existing) {
      existing.totalQuantity += o.quantity;
      existing.orderCount += 1;
    } else {
      byItem.set(o.itemId, {
        itemId: o.itemId,
        itemName: item.name,
        category: item.category,
        tags: item.tags,
        totalQuantity: o.quantity,
        orderCount: 1,
      });
    }
  }
  return [...byItem.values()].sort(
    (a, b) => b.totalQuantity - a.totalQuantity,
  );
}

export type MemberLedgerType = "topup" | "spend";

export interface MemberLedgerRecord {
  id: string;
  type: MemberLedgerType;
  detail: string;
  amount: number;
  at: string;
  balanceAfter: number;
}

/** 儲值紀錄＝儲值 + 消費混合的流水帳，依時間排序並算出每筆之後的剩餘金額。 */
export function memberLedger(id: string): MemberLedgerRecord[] {
  const insight = memberInsightsMap[id];
  const events = [
    ...insight.topups.map((t) => ({
      type: "topup" as MemberLedgerType,
      detail: t.method,
      amount: t.amount,
      at: t.at,
    })),
    ...insight.orders.map((o) => ({
      type: "spend" as MemberLedgerType,
      detail: o.itemName,
      amount: o.price * o.quantity,
      at: o.date,
    })),
  ].sort((a, b) => a.at.localeCompare(b.at));

  let balance = 500;
  return events.map((e, i) => {
    balance += e.type === "topup" ? e.amount : -e.amount;
    return { ...e, id: `${id}-ledger-${i}`, balanceAfter: Math.max(0, balance) };
  });
}

export function memberInsightSummary(id: string) {
  const insight = memberInsightsMap[id];
  return {
    orderCount: insight.orders.length,
    mealCount: insight.orders.filter((o) => itemById(o.itemId)?.kind === "meal")
      .length,
    favoriteCount: insight.favorites.length,
    commentCount: insight.comments.length,
    ratingCount: insight.ratings.length,
    balance: insight.balance,
  };
}

/* ── 任務與經驗值（遊戏化） ────────────────────────────
   task_type 沿用舊系統 enum('topup','order','favorite','comment','rating')。
   任務/規則/等級的「設定」本身已經是真資料（見 lib/models/gamification.ts，
   後台 /admin/tasks 直接編輯那三個 collection）；但會員的 exp 不另外存一份歷程，
   直接從既有的 orders/topups/ratings/comments/favorites 數量依規則算出來
   （簡化：忽略每日/每週/每月上限，只算「總計」，避免無中生有一份任務完成歷程）。
   下面這幾個函式改成吃 config 參數（呼叫端從 gamification.ts 撈真資料傳進來），
   不再各自 import 寫死的假規則。 */

export type TaskType = "topup" | "order" | "favorite" | "comment" | "rating";
export const taskTypeLabel: Record<TaskType, string> = {
  topup: "儲值",
  order: "訂餐",
  favorite: "收藏",
  comment: "留言",
  rating: "評分",
};

export type TaskPeriod = "daily" | "weekly" | "monthly" | "achievement";
export const taskPeriodLabel: Record<TaskPeriod, string> = {
  daily: "每日",
  weekly: "每週",
  monthly: "每月",
  achievement: "成就",
};

export interface TaskConfig {
  id: string;
  name: string;
  type: TaskType;
  period: TaskPeriod;
  targetCount: number;
  rewardPoints: number;
  active: boolean;
}

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

/** 會員總 exp：依 expRules 把該會員各類動作次數（真實累積次數）換算成經驗值加總（不套用上限，只看總量）。 */
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

/** 依 exp 換算目前等級、距下一級還差多少 exp。 */
export function memberLevelInfo(
  counts: Record<TaskType, number>,
  expRules: ExpRuleConfig[],
  levels: LevelConfig[],
): MemberLevelInfo {
  const exp = memberExp(counts, expRules);
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

/** 會員目前各任務的期間內完成進度——簡化模擬（沒有另存 daily/weekly/monthly 期間內的任務完成歷程），
 *  用會員真實的累積活動次數對任務目標取餘數，做出看起來合理、會隨真實活動變化的進度展示。 */
export function memberTaskProgress(counts: Record<TaskType, number>, tasks: TaskConfig[]) {
  return tasks
    .filter((t) => t.active)
    .map((t) => ({
      task: t,
      progress: (counts[t.type] ?? 0) % (t.targetCount + 1),
    }));
}

/* ── 餐點統計 ──────────────────────────────────────────
   把所有會員的訂餐/評分/評論彙總到品項上，看哪個品項最受歡迎。 */

export interface ItemStat {
  itemId: string;
  itemName: string;
  price: number;
  totalQuantity: number;
  orderCount: number;
  avgRating: number | null;
  commentCount: number;
}

interface ItemStatAccumulator {
  totalQuantity: number;
  orderCount: number;
  ratingSum: number;
  ratingCount: number;
  commentCount: number;
}

function accumulateItemStats(): Map<string, ItemStatAccumulator> {
  const acc = new Map<string, ItemStatAccumulator>();
  const get = (itemId: string) => {
    let a = acc.get(itemId);
    if (!a) {
      a = { totalQuantity: 0, orderCount: 0, ratingSum: 0, ratingCount: 0, commentCount: 0 };
      acc.set(itemId, a);
    }
    return a;
  };
  for (const m of members) {
    const insight = memberInsightsMap[m.id];
    for (const o of insight.orders) {
      const a = get(o.itemId);
      a.totalQuantity += o.quantity;
      a.orderCount += 1;
    }
    for (const r of insight.ratings) {
      const a = get(r.itemId);
      a.ratingSum += r.stars;
      a.ratingCount += 1;
    }
    for (const c of insight.comments) {
      get(c.itemId).commentCount += 1;
    }
  }
  return acc;
}

export function itemStatsList(): ItemStat[] {
  const acc = accumulateItemStats();
  return catalogItems
    .map((item): ItemStat => {
      const a = acc.get(item.id);
      return {
        itemId: item.id,
        itemName: item.name,
        price: item.price,
        totalQuantity: a?.totalQuantity ?? 0,
        orderCount: a?.orderCount ?? 0,
        avgRating: a && a.ratingCount > 0 ? a.ratingSum / a.ratingCount : null,
        commentCount: a?.commentCount ?? 0,
      };
    })
    .sort((a, b) => b.totalQuantity - a.totalQuantity);
}

export function itemStatById(itemId: string): ItemStat | undefined {
  return itemStatsList().find((s) => s.itemId === itemId);
}

export interface ItemCommentEntry {
  memberId: string;
  memberName: string;
  text: string;
  stars: number;
  at: string;
}

export function itemComments(itemId: string): ItemCommentEntry[] {
  const list: ItemCommentEntry[] = [];
  for (const m of members) {
    for (const c of memberInsightsMap[m.id].comments) {
      if (c.itemId === itemId) {
        list.push({
          memberId: m.id,
          memberName: m.name,
          text: c.text,
          stars: c.stars,
          at: c.at,
        });
      }
    }
  }
  return list.sort((a, b) => b.at.localeCompare(a.at));
}

export const itemCategories = [
  "便當",
  "餐盒",
  "麵食",
  "沙拉",
  "咖啡",
  "茶飲",
  "手搖飲",
  "點心",
  "烘焙",
];
