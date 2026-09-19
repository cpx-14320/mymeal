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
