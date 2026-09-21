import { Types } from "mongoose";
import { connectMongo } from "@/lib/mongoose";
import { GroupOrder, type OrderLineSubdoc } from "@/lib/models/group-order";
import { todayTaiwanDateString } from "@/lib/date";

/**
 * 後台「報表」頁用的統計彙總——資料來源是 group_orders 的 lines，現場算，不另外存快取表
 * （跟 getItemOrderStats／getMemberFrequentItems 同樣的考量，量大到查詢變慢再說）。
 * 依類型統計以「場次」（一筆團訂）為單位分組；依店家統計以「品項」為單位分組，
 * 因為一個模板可能混合多個店家的品項，template.supplierId 不可靠（見 catalog-item.ts 的註解）。
 */

const WEEKDAY_LABELS = ["日", "一", "二", "三", "四", "五", "六"];

/** 回傳最近 n 天的 "YYYY/MM/DD" 字串（含今天），跟 group_orders.date 格式一致，由舊到新排序。 */
function lastNDateStrings(n: number): string[] {
  const [y, m, d] = todayTaiwanDateString().split("/").map(Number);
  const todayUtcMs = Date.UTC(y, m - 1, d);
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const dt = new Date(todayUtcMs - i * 86400000);
    out.push(
      `${dt.getUTCFullYear()}/${String(dt.getUTCMonth() + 1).padStart(2, "0")}/${String(dt.getUTCDate()).padStart(2, "0")}`,
    );
  }
  return out;
}

function formatDateLabel(dateStr: string): string {
  const [y, m, d] = dateStr.split("/").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${String(m).padStart(2, "0")}/${String(d).padStart(2, "0")}（${WEEKDAY_LABELS[dt.getUTCDay()]}）`;
}

function lineTotals(lines: OrderLineSubdoc[]) {
  return lines.reduce(
    (acc, l) => ({ qty: acc.qty + l.qty, amount: acc.amount + l.price * l.qty }),
    { qty: 0, amount: 0 },
  );
}

export interface DailyOrderStat {
  date: string;
  orders: number;
  amount: number;
}
export interface KindOrderStat {
  name: string;
  sessions: number;
  count: number;
  amount: number;
}
export interface SupplierOrderStat {
  name: string;
  orders: number;
  amount: number;
}
export interface OrderReportData {
  daily: DailyOrderStat[]; // 舊到新，長度 = rangeDays
  byKind: KindOrderStat[];
  bySupplier: SupplierOrderStat[];
}

interface PopulatedKindTemplate {
  _id: Types.ObjectId;
  kindId?: { _id: Types.ObjectId; name: string } | null;
}

/** rangeDays 天的每日訂單數/金額 + 同一段期間的依類型／依店家彙總，供報表頁的三個區塊共用一次查詢。 */
export async function getOrderReportData(rangeDays: number): Promise<OrderReportData> {
  await connectMongo();
  await Promise.all([import("@/lib/models/template"), import("@/lib/models/item-kind")]);
  const { CatalogItem } = await import("@/lib/models/catalog-item");

  const dates = lastNDateStrings(rangeDays);

  const docs = await GroupOrder.find({ date: { $in: dates } }).populate<{
    templateId: PopulatedKindTemplate | null;
  }>({ path: "templateId", populate: { path: "kindId" } });

  const itemIds = new Set<string>();
  for (const d of docs) for (const l of d.lines as OrderLineSubdoc[]) itemIds.add(String(l.itemId));
  const itemDocs = await CatalogItem.find({
    _id: { $in: [...itemIds].map((id) => new Types.ObjectId(id)) },
  }).populate<{ supplierId?: { _id: Types.ObjectId; name: string } }>("supplierId");
  const supplierNameByItem = new Map(
    itemDocs.map((it) => [
      String(it._id),
      (it.supplierId as unknown as { name: string } | undefined)?.name ?? "未標註店家",
    ]),
  );

  const dailyMap = new Map<string, { orders: number; amount: number }>(
    dates.map((date) => [date, { orders: 0, amount: 0 }]),
  );
  const kindMap = new Map<string, KindOrderStat>();
  const supplierMap = new Map<string, SupplierOrderStat>();

  for (const d of docs) {
    const lines = d.lines as OrderLineSubdoc[];
    const totals = lineTotals(lines);

    const dayBucket = dailyMap.get(d.date);
    if (dayBucket) {
      dayBucket.orders += totals.qty;
      dayBucket.amount += totals.amount;
    }

    const kindName = d.templateId?.kindId?.name ?? "未分類";
    const kEntry = kindMap.get(kindName) ?? { name: kindName, sessions: 0, count: 0, amount: 0 };
    kEntry.sessions += 1;
    kEntry.count += totals.qty;
    kEntry.amount += totals.amount;
    kindMap.set(kindName, kEntry);

    for (const l of lines) {
      const supplierName = supplierNameByItem.get(String(l.itemId)) ?? "未標註店家";
      const sEntry = supplierMap.get(supplierName) ?? { name: supplierName, orders: 0, amount: 0 };
      sEntry.orders += l.qty;
      sEntry.amount += l.price * l.qty;
      supplierMap.set(supplierName, sEntry);
    }
  }

  return {
    daily: dates.map((date) => ({ date: formatDateLabel(date), ...dailyMap.get(date)! })),
    byKind: [...kindMap.values()].sort((a, b) => b.amount - a.amount),
    bySupplier: [...supplierMap.values()].sort((a, b) => b.amount - a.amount),
  };
}
