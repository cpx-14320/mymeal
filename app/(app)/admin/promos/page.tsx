import Link from "next/link";
import { Section, ButtonLink, Badge, Card, CardBody } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { listInterstitials, interstitialStatus } from "@/lib/models/interstitial";

export const metadata = { title: "蓋台廣告" };

const statusMeta = {
  showing: { label: "顯示中", tone: "positive" as const },
  scheduled: { label: "已排程", tone: "warning" as const },
  ended: { label: "已結束", tone: "neutral" as const },
  disabled: { label: "已關閉", tone: "neutral" as const },
};

const freqLabel: Record<string, string> = {
  always: "每次進站",
  daily: "每人每天一次",
  once: "每人只一次",
};

const fmt = (s: string) => s.replace("T", " ");

export default async function AdminPromosPage() {
  const interstitials = await listInterstitials();

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/promos/new">新增廣告</ButtonLink>
      </AdminHeaderActions>

      {interstitials.length === 0 ? (
        <p className="text-sm text-muted">還沒有任何廣告，點右上角「新增廣告」開始建立。</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {interstitials.map((a) => {
            const st = statusMeta[interstitialStatus(a)];
            return (
              <Card key={a.id}>
                <CardBody className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <Link href={`/admin/promos/${a.id}`} className="font-semibold hover:text-brand">
                      {a.name}
                    </Link>
                    <Badge tone={st.tone}>{st.label}</Badge>
                  </div>

                  <dl className="grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-muted">排程</dt>
                    <dd className="tabular-nums">
                      {fmt(a.startAt)} – {fmt(a.endAt)}
                    </dd>
                    <dt className="text-muted">倒數</dt>
                    <dd>{a.dismissSeconds > 0 ? `${a.dismissSeconds} 秒` : "不自動關"}</dd>
                    <dt className="text-muted">連結</dt>
                    <dd className="truncate">{a.linkUrl || "—"}</dd>
                    <dt className="text-muted">頻率</dt>
                    <dd>{freqLabel[a.frequency]}</dd>
                    <dt className="text-muted">圖片</dt>
                    <dd>{a.imageUrl ? "已設定" : "尚未設定"}</dd>
                  </dl>

                  <ButtonLink href={`/admin/promos/${a.id}`} variant="secondary" className="w-full">
                    編輯
                  </ButtonLink>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </Section>
  );
}
