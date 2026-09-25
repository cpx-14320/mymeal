/**
 * 蓋台廣告可以指定要在前台哪些版位出現的清單——獨立成不依賴 mongoose 的純資料檔，
 * 讓 client component（表單、前台蓋版元件）也能安全 import，不會把 mongoose 一起打進瀏覽器端。
 */
export const PROMO_PAGE_OPTIONS = [
  { key: "group-orders", label: "開團訂餐", prefix: "/group-orders" },
  { key: "orders", label: "我的訂單", prefix: "/orders" },
  { key: "favorites", label: "我的收藏", prefix: "/favorites" },
  { key: "wallet", label: "錢包 / 儲值", prefix: "/wallet" },
  { key: "account", label: "會員資料", prefix: "/account" },
  { key: "pages", label: "頁面子項目", prefix: "/pages" },
] as const;

export type PromoPageKey = (typeof PROMO_PAGE_OPTIONS)[number]["key"];
