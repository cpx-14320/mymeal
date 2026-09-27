const TAIWAN_TIME_ZONE = "Asia/Taipei";

/** 統一用台灣時間（UTC+8）顯示日期時間，不受伺服器/瀏覽器所在時區影響。 */
export function formatTaiwanDateTime(d?: Date | string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("zh-TW", {
    timeZone: TAIWAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 今天的日期字串（台灣時區，YYYY/MM/DD），跟 group_orders.date 存的格式一致，用來查「今日」資料。 */
export function todayTaiwanDateString(): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: TAIWAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}/${get("month")}/${get("day")}`;
}

/** group_orders.date（"YYYY/MM/DD"）跟網址 slug（"YYYY-MM-DD"）互轉，「/」不能放在路由 segment 裡。 */
export const dateToSlug = (date: string) => date.replaceAll("/", "-");
export const slugToDate = (slug: string) => slug.replaceAll("-", "/");

/** 台灣沒有日光節約時間，UTC+8 全年固定，直接減 8 小時換算成 UTC 沒有誤差問題。 */
const TAIWAN_OFFSET_MS = 8 * 60 * 60 * 1000;

/** 週期任務（daily/weekly/monthly）用：算出「現在」所屬週期的起始時間（台灣時區的 00:00），
 *  用來查「這個週期內」做了幾次某個行為——週以週一為起始，跟大多數台灣行事曆習慣一致。 */
export function periodStartTaiwan(period: "daily" | "weekly" | "monthly"): Date {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TAIWAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    weekday: "short",
  }).formatToParts(new Date());
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  const y = Number(get("year"));
  const m = Number(get("month"));
  const d = Number(get("day"));
  const startOfDayUtcMs = Date.UTC(y, m - 1, d) - TAIWAN_OFFSET_MS;

  if (period === "daily") return new Date(startOfDayUtcMs);

  if (period === "monthly") return new Date(Date.UTC(y, m - 1, 1) - TAIWAN_OFFSET_MS);

  const weekdayIndex = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].indexOf(get("weekday"));
  const daysSinceMonday = (weekdayIndex + 6) % 7;
  return new Date(startOfDayUtcMs - daysSinceMonday * 24 * 60 * 60 * 1000);
}
