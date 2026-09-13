import Link from "next/link";

/** MyMeal 標誌（便當圖示 + 字標），Header 與 Footer 共用 */
export function Brand({
  className = "",
  href = "/",
}: {
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 font-bold tracking-tight text-ink ${className}`}
    >
      <span
        aria-hidden="true"
        className="grid size-7 place-items-center rounded-lg bg-brand-soft text-base"
      >
        🍱
      </span>
      <span className="text-lg">
        My<span className="text-brand">Meal</span>
      </span>
    </Link>
  );
}
