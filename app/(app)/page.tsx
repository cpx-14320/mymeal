import { navIcons } from "@/components/layout/icons";
import { LoginButton } from "@/components/layout/login-button";
import { ItemThumbnailFill } from "@/components/ui/primitives";
import { TemplateMenuSections } from "@/components/template-menu-sections";
import { getHomePreviewConfig } from "@/lib/models/site-settings";
import { findTemplateById } from "@/lib/models/template";
import { listCatalogItemsByIds, type CatalogItemView } from "@/lib/models/catalog-item";
import { getItemStatsByItems } from "@/lib/models/item-review";
import { listFavoritesByMember } from "@/lib/models/favorite";
import { getSessionMemberId } from "@/lib/session";

interface PreviewDish {
  key: string;
  name: string;
  subtitle: string;
  price: number;
  emoji: string;
}

/** 首頁菜單預覽的預設範例假資料——後台「廣宣版位」的「首頁菜單預覽」分頁（/admin/promos）
 *  沒指定模板時才會用到這組，讓區塊不會空著。不是真的品項（沒有 id），沒辦法收藏／看評論，
 *  所以走簡化的靜態卡片，不能套用 ItemCard。 */
const fallbackDishes: PreviewDish[] = [
  { key: "1", name: "招牌雞腿便當", subtitle: "福來鮮食", price: 95, emoji: "🍗" },
  { key: "2", name: "蔥爆牛肉便當", subtitle: "阿明快餐", price: 100, emoji: "🥩" },
  { key: "3", name: "香煎鯖魚便當", subtitle: "福來鮮食", price: 90, emoji: "🐟" },
  { key: "4", name: "三色蔬食便當", subtitle: "素心園", price: 80, emoji: "🥗" },
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

export default async function HomePage() {
  const [{ templateId, sectionId }, memberId] = await Promise.all([
    getHomePreviewConfig(),
    getSessionMemberId(),
  ]);
  const template = templateId ? await findTemplateById(templateId) : null;
  // 有指定區塊就只取那個區塊；沒指定（或那個區塊已經被刪掉）就顯示模板全部區塊——
  // 跟 /pages/[slug] 套用模板時的畫法（TemplateMenuSections）完全同一套，包含卡片樣式、
  // 收藏愛心、評論按鈕、標籤，未登入點收藏一樣會跳登入彈窗（見 TemplateMenuSections 內部）。
  const rawSections = sectionId
    ? (template?.sections.filter((s) => s.id === sectionId) ?? [])
    : (template?.sections ?? []);
  const allItemIds = rawSections.flatMap((sec) => sec.items.map((it) => it.id));

  const [fullItems, stats, favorites] = allItemIds.length
    ? await Promise.all([
        listCatalogItemsByIds(allItemIds),
        getItemStatsByItems(allItemIds),
        memberId ? listFavoritesByMember(memberId) : Promise.resolve([]),
      ])
    : [[] as CatalogItemView[], {}, []];
  const itemById = new Map(fullItems.map((it) => [it.id, it]));
  const templateSections = rawSections
    .map((sec) => ({
      id: sec.id,
      name: sec.name,
      items: sec.items
        .map((it) => itemById.get(it.id))
        .filter((it): it is CatalogItemView => !!it && it.active),
    }))
    .filter((sec) => sec.items.length > 0);

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
          <LoginButton
            mode="register"
            className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
          >
            申請帳號
          </LoginButton>
          <LoginButton className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2">
            登入
          </LoginButton>
        </div>
        <p className="mt-3 text-xs text-muted">
          填寫基本資料即可登入或申請帳號。
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

        {templateSections.length > 0 ? (
          <div className="mt-6">
            <TemplateMenuSections
              sections={templateSections}
              stats={stats}
              initialFavoriteIds={favorites.map((f) => f.itemId)}
            />
          </div>
        ) : (
          <ul className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
            {fallbackDishes.map((dish) => (
              <li
                key={dish.key}
                className="overflow-hidden rounded-xl border border-line bg-surface"
              >
                <ItemThumbnailFill
                  imageUrl={undefined}
                  emoji={dish.emoji}
                  alt={dish.name}
                  sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  containerClassName="relative grid aspect-[3/2] place-items-center overflow-hidden bg-brand-soft text-4xl"
                />
                <div className="p-4">
                  <p className="font-medium">{dish.name}</p>
                  <p className="mt-0.5 text-xs text-muted">{dish.subtitle}</p>
                  <p className="mt-2 text-sm font-semibold text-brand">
                    NT$ {dish.price}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
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
            申請帳號，開通後就能開團、點餐與儲值。
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <LoginButton
              mode="register"
              className="rounded-lg bg-brand px-5 py-2.5 text-sm font-semibold text-brand-fg hover:opacity-90"
            >
              申請帳號
            </LoginButton>
            <LoginButton className="rounded-lg border border-line bg-surface px-5 py-2.5 text-sm font-semibold text-ink hover:bg-surface-2">
              我已經有帳號
            </LoginButton>
          </div>
        </div>
      </section>
    </div>
  );
}
