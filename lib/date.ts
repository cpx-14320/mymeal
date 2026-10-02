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

/** group_orders.deadline（"YYYY-MM-DD HH:MM"，團主用 datetime-local 輸入的台灣當地時間，
 *  字串本身沒有時區標記）是否已經過了「現在」。把 deadline 當成台灣牆上時間換算成 UTC
 *  再跟 Date.now() 比，不能直接 new Date(deadline) 當 UTC 解析，否則會差 8 小時。 */
export function isDeadlinePassed(deadline: string): boolean {
  if (!deadline) return false;
  const m = deadline.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2})/);
  if (!m) return false;
  const [, y, mo, d, h, mi] = m;
  const deadlineUtcMs =
    Date.UTC(Number(y), Number(mo) - 1, Number(d), Number(h), Number(mi)) - TAIWAN_OFFSET_MS;
  return Date.now() >= deadlineUtcMs;
}

/** 重新開放但沒有逐團輸入新截止時間的介面時（例如後台批次「開放選取」）的預設值：
 *  現在的台灣時間 +1 小時，格式跟 group_orders.deadline 一致（"YYYY-MM-DD HH:MM"）——
 *  跟前台重新開放表單（group-order-host-actions.tsx 的 defaultReopenDeadline）預設的
 *  「現在+1小時」是同一個邏輯，差別只是那支是給 <input type="datetime-local"> 用瀏覽器
 *  本地時間算，這支是伺服器端用明確的台灣時區算。 */
export function defaultReopenDeadlineTaiwan(): string {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TAIWAN_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(Date.now() + 60 * 60 * 1000));
  const get = (type: string) => parts.find((p) => p.type === type)!.value;
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

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
