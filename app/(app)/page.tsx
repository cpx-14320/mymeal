import Link from "next/link";
import { navIcons } from "@/components/layout/icons";
import { REGISTER_HREF } from "@/components/layout/nav";
import { LoginButton } from "@/components/layout/login-button";

/** 首頁菜單預覽（範例資料，登入後改接真實每週菜單） */
const previewDishes = [
  { name: "招牌雞腿便當", restaurant: "福來鮮食", price: 95, emoji: "🍗" },
  { name: "蔥爆牛肉便當", restaurant: "阿明快餐", price: 100, emoji: "🥩" },
  { name: "香煎鯖魚便當", restaurant: "福來鮮食", price: 90, emoji: "🐟" },
  { name: "三色蔬食便當", restaurant: "素心園", price: 80, emoji: "🥗" },
];

const steps = [
  { n: 1, title: "開團", text: "選好日期與餐廳，設定截止時間。" },
  { n: 2, title: "揪同事", text: "分享團連結，大家各自挑便當、備註。" },
  { n: 3, title: "截止結單", text: "系統彙整訂單清單，直接給餐廳。" },
  { n: 4, title: "錢包扣款", text: "從個人餘額自動扣款，餘額不足可線上儲值。" },
];

const features = [
  {
    key: "menu" as const,
    title: "每週排餐",
    text: "每天不同餐廳、不同便當，一週菜單一次看完。",
  },
  {
    key: "group" as const,
    title: "自行開團",
    text: "誰都能當團主，不用再用 Excel 或群組接龍喬單。",
  },
  {
    key: "wallet" as const,
    title: "錢包儲值",
    text: "以餘額付款，儲值、扣款、退款交易明細清清楚楚。",
  },
  {
    key: "favorites" as const,
    title: "評分收藏",
    text: "記錄好吃的便當，下次開團快速點餐。",
  },
];

export default function HomePage() {
  return (
    <div className="mx-auto max-w-5xl px-4 sm:px-6">
      {/* Hero */}
      <section className="py-14 sm:py-20">
        <p className="text-sm font-medium text-brand">公司內部訂餐系統</p>
        <h1 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-balance sm:text-4xl">
          開團、點餐、扣款，
          <br className="hidden sm:block" />
          中午吃什麼一次搞定
        </h1>
        <p className="mt-4 max-w-xl text-base leading-7 text-muted">
          MyMeal 以「週」為單位安排餐廳便當。同事可以自行開團，大家線上點餐，
          截止後系統彙整清單給餐廳，餐費直接從個人錢包扣款。
        </p>
        <div className="mt-7 flex flex-wrap items-center gap-3">
          <Link
            href={REGISTER_HREF}
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
          >
            申請帳號
          </Link>
          <LoginButton className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2">
            登入
          </LoginButton>
        </div>
        <p className="mt-3 text-xs text-muted">
          請使用公司 Email（@company.com）登入或申請帳號。
        </p>
      </section>

      {/* 本週菜單預覽 */}
      <section className="border-t border-line py-12">
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight">本週菜單預覽</h2>
            <p className="mt-1 text-sm text-muted">登入後可看到完整每日菜單並開始訂餐。</p>
          </div>
        </div>

        <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {previewDishes.map((dish) => (
            <li
              key={dish.name}
              className="overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div
                aria-hidden="true"
                className="grid h-28 place-items-center bg-brand-soft text-4xl"
              >
                {dish.emoji}
              </div>
              <div className="p-4">
                <p className="font-medium">{dish.name}</p>
                <p className="mt-0.5 text-xs text-muted">{dish.restaurant}</p>
                <p className="mt-2 text-sm font-semibold text-brand">
                  NT$ {dish.price}
                </p>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">＊以上為範例資料。</p>
      </section>

      {/* 運作方式 */}
      <section className="border-t border-line py-12">
        <h2 className="text-xl font-bold tracking-tight">運作方式</h2>
        <ol className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step) => (
            <li key={step.n}>
              <span className="grid size-9 place-items-center rounded-full border border-line bg-surface text-sm font-semibold text-brand">
                {step.n}
              </span>
              <h3 className="mt-3 font-semibold">{step.title}</h3>
              <p className="mt-1 text-sm leading-6 text-muted">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* 功能亮點 */}
      <section className="border-t border-line py-12">
        <h2 className="text-xl font-bold tracking-tight">功能亮點</h2>
        <ul className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => {
            const Icon = navIcons[feature.key];
            return (
              <li
                key={feature.key}
                className="flex gap-4 rounded-xl border border-line bg-surface p-5"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-brand-soft text-brand">
                  <Icon className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-6 text-muted">
                    {feature.text}
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      </section>

      {/* 底部 CTA */}
      <section className="py-12">
        <div className="rounded-2xl border border-line bg-surface p-8 text-center">
          <h2 className="text-xl font-bold tracking-tight">準備好一起訂餐了嗎？</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            用公司 Email 申請帳號，開通後就能開團、點餐與儲值。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href={REGISTER_HREF}
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
            >
              申請帳號
            </Link>
            <LoginButton className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2">
              我已經有帳號
            </LoginButton>
          </div>
        </div>
      </section>
    </div>
  );
}
