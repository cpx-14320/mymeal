import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Button,
  Badge,
  Progress,
} from "@/components/ui/primitives";

export const metadata: Metadata = { title: "會員中心" };

const profile = [
  ["姓名", "林佩珊"],
  ["公司 Email", "peishan.lin@company.com"],
  ["部門", "網路發展部"],
  ["分機", "2317"],
  ["員工編號", "A12345"],
  ["預設取餐地點", "3F 茶水間"],
];

const tasks = [
  { name: "每日訂餐", period: "每日", progress: 1, target: 1, points: 10 },
  { name: "每週訂餐", period: "每週", progress: 3, target: 4, points: 20 },
  { name: "每月評分", period: "每月", progress: 2, target: 5, points: 15 },
  { name: "每週儲值", period: "每週", progress: 1, target: 1, points: 10 },
];

export default function AccountPage() {
  return (
    <PageContainer>
      <PageHeader
        title="會員中心"
        description="個人資料、等級與任務進度。"
        actions={<Button variant="secondary">編輯資料</Button>}
      />

      <div className="grid gap-4 lg:grid-cols-3">
        {/* 個人資料 */}
        <Card className="lg:col-span-2">
          <CardBody className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="grid size-16 place-items-center rounded-full bg-brand-soft text-2xl">
                🙂
              </div>
              <div>
                <p className="text-lg font-bold">林佩珊</p>
                <p className="text-sm text-muted">網路發展部．分機 2317</p>
              </div>
            </div>
            <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
              {profile.map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4 border-b border-line py-2 text-sm">
                  <dt className="text-muted">{k}</dt>
                  <dd className="text-right">{v}</dd>
                </div>
              ))}
            </dl>
            <Button variant="secondary">修改密碼</Button>
          </CardBody>
        </Card>

        {/* 等級 */}
        <Card>
          <CardBody className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">目前等級</h2>
              <Badge tone="brand">Lv.3 熟客</Badge>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              820 <span className="text-sm font-normal text-muted">exp</span>
            </p>
            <Progress value={820} max={1000} />
            <p className="text-xs text-muted">距離 Lv.4「常客」還差 180 exp</p>
          </CardBody>
        </Card>
      </div>

      {/* 任務 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">任務進度</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map((t) => (
            <Card key={t.name}>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{t.name}</span>
                  <Badge>{t.period}</Badge>
                </div>
                <Progress value={t.progress} max={t.target} />
                <div className="flex justify-between text-xs text-muted">
                  <span className="tabular-nums">
                    {t.progress} / {t.target}
                  </span>
                  <span>完成 +{t.points} exp</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </PageContainer>
  );
}
