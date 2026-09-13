"use client";

import { useState } from "react";
import Link from "next/link";
import {
  PageContainer,
  PageHeader,
  Badge,
  ButtonLink,
  Card,
  CardBody,
} from "@/components/ui/primitives";
import { ItemCard } from "@/components/item-card";
import {
  templateById,
  templates,
  templateKindLabel,
  itemById,
  supplierById,
} from "@/lib/mock";

const bento = templateById("t1")!;
const weekdayDates = ["09/08", "09/09", "09/10", "09/11", "09/12"];

// 進行中的飲料 / 下午茶團（範例）
const drinkTeams = [
  { id: "10", name: "三多辦公室 星巴克團", templateId: "t2", deadline: "今天 15:00 截止", ordered: 6 },
  { id: "11", name: "設計部下午茶", templateId: "t3", deadline: "明天 14:30 截止", ordered: 4 },
];

type Tab = "bento" | "drinks";

export default function MenuPage() {
  const [tab, setTab] = useState<Tab>("bento");
  const [favorited, setFavorited] = useState<Set<string>>(() => new Set());

  const toggleFavorite = (id: string) =>
    setFavorited((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <PageContainer>
      <PageHeader
        title="本週餐點"
        description="便當、飲料、下午茶都在這裡；同一套流程開團、訂餐、扣款。"
        actions={<ButtonLink href="/group-orders/new">開團</ButtonLink>}
      />

      <div className="flex gap-2">
        {(
          [
            ["bento", "便當"],
            ["drinks", "飲料・下午茶"],
          ] as [Tab, string][]
        ).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={`rounded-full px-4 py-1.5 text-sm ${
              tab === key
                ? "bg-brand text-brand-fg"
                : "border border-line bg-surface text-muted hover:text-ink"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "bento" && (
        <>
          <p className="text-sm text-muted">
            套用模板「{bento.name}」．2026/09/08（一）– 09/12（五）
          </p>
          {bento.sections.map((sec, si) => (
            <section key={sec.id} className="space-y-3">
              <div className="flex items-baseline gap-3">
                <h2 className="text-lg font-bold tracking-tight">{sec.name}</h2>
                <span className="text-sm text-muted">{weekdayDates[si]}</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {sec.itemIds.map((iid) => {
                  const it = itemById(iid);
                  if (!it) return null;
                  return (
                    <ItemCard
                      key={iid}
                      item={it}
                      isFavorited={favorited.has(it.id)}
                      onToggleFavorite={() => toggleFavorite(it.id)}
                    />
                  );
                })}
              </div>
            </section>
          ))}
        </>
      )}

      {tab === "drinks" && (
        <div className="space-y-6">
          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight">進行中的團</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {drinkTeams.map((team) => {
                const tpl = templateById(team.templateId);
                return (
                  <Card key={team.id}>
                    <CardBody className="space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <Link
                          href={`/group-orders/${team.id}`}
                          className="font-semibold hover:text-brand"
                        >
                          {team.name}
                        </Link>
                        <Badge tone="positive">
                          {tpl ? templateKindLabel[tpl.kind] : "飲料"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted">
                        {tpl?.name}．{team.deadline}．已點 {team.ordered} 杯
                      </p>
                      <ButtonLink
                        href={`/group-orders/${team.id}`}
                        variant="secondary"
                        className="w-full"
                      >
                        查看 / 加入
                      </ButtonLink>
                    </CardBody>
                  </Card>
                );
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-bold tracking-tight">可開的飲料模板</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {templates
                .filter((t) => t.kind === "drinks" || t.kind === "tea")
                .map((t) => (
                  <Card key={t.id}>
                    <CardBody className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold">{t.name}</span>
                        <Badge tone="brand">{templateKindLabel[t.kind]}</Badge>
                      </div>
                      <p className="text-sm text-muted">
                        {supplierById(t.supplierId)?.name}．
                        {t.sections.reduce((n, s) => n + s.itemIds.length, 0)} 個品項
                      </p>
                      <ButtonLink
                        href="/group-orders/new"
                        variant="secondary"
                        className="w-full"
                      >
                        用這個模板開團
                      </ButtonLink>
                    </CardBody>
                  </Card>
                ))}
            </div>
          </section>
        </div>
      )}

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
