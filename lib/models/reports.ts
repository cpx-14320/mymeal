import { connectMongo } from "@/lib/mongoose";
import { GroupOrder, type OrderLineSubdoc } from "@/lib/models/group-order";
import { todayTaiwanDateString } from "@/lib/date";

/**
 * 團訂狀況頁上方「訂單與金流報表」用的每日彙總——資料來源是 group_orders 的 lines，
 * 現場算，不另外存快取表（跟 getItemOrderStats／getMemberFrequentItems 同樣的考量，
 * 量大到查詢變慢再說）。
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

/** rangeDays 天的每日訂單數/金額，由舊到新排序，長度 = rangeDays。 */
export async function getDailyOrderStats(rangeDays: number): Promise<DailyOrderStat[]> {
  await connectMongo();

  const dates = lastNDateStrings(rangeDays);
  const docs = await GroupOrder.find({ date: { $in: dates } });

  const dailyMap = new Map<string, { orders: number; amount: number }>(
    dates.map((date) => [date, { orders: 0, amount: 0 }]),
  );

  for (const d of docs) {
    const totals = lineTotals(d.lines as OrderLineSubdoc[]);
    const dayBucket = dailyMap.get(d.date);
    if (dayBucket) {
      dayBucket.orders += totals.qty;
      dayBucket.amount += totals.amount;
    }
  }

  return dates.map((date) => ({ date: formatDateLabel(date), ...dailyMap.get(date)! }));
}
