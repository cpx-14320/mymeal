import Link from "next/link";
import { footerNav } from "./nav";

export function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1400px] flex-col gap-3 px-4 py-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p>MyMeal v0.1 · 內部系統</p>
        <ul className="flex flex-wrap gap-x-4 gap-y-1">
          {footerNav.map((item) => (
            <li key={item.href}>
              <Link href={item.href} className="hover:text-ink">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
