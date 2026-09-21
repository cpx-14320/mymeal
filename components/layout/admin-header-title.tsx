"use client";

import { usePathname } from "next/navigation";
import { adminNav } from "./nav";

/** 後台頂部標題：依網址從 adminNav 找出對應頁面名稱顯示，取代原本固定的「後台管理」文字，
 *  這樣各頁面內容就不用再重複顯示一次自己的頁面名稱。子頁面（如 /admin/items/new）
 *  會顯示所屬項目的名稱（最長前綴比對）。 */
export function AdminHeaderTitle() {
  const pathname = usePathname();
  const items = adminNav.flatMap((g) => g.items);

  const exact = items.find((item) => pathname === item.href);
  const prefixMatch = !exact
    ? items
        .filter((item) => item.href !== "/admin" && pathname.startsWith(`${item.href}/`))
        .sort((a, b) => b.href.length - a.href.length)[0]
    : undefined;

  const title = exact?.label ?? prefixMatch?.label ?? "後台管理";

  return <h1 className="text-xl font-bold tracking-tight">{title}</h1>;
}
