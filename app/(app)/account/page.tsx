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
import {
  currentMemberId,
  memberLevelInfo,
  memberTaskProgress,
  taskPeriodLabel,
} from "@/lib/mock";
import { listDailyTasks, listExpRules, listMemberLevels } from "@/lib/models/gamification";

export const metadata: Metadata = { title: "會員中心" };

const profile = [
  ["姓名", "林佩珊"],
  ["公司 Email", "peishan.lin@company.com"],
  ["部門", "網路發展部"],
  ["分機", "2317"],
  ["員工編號", "A12345"],
  ["預設取餐地點", "3F 茶水間"],
];

export default async function AccountPage() {
  const [dailyTasks, expRules, memberLevels] = await Promise.all([
    listDailyTasks(),
    listExpRules(),
    listMemberLevels(),
  ]);
  const { exp, level, levelIndex, next, expToNext } = memberLevelInfo(currentMemberId, expRules, memberLevels);
  const tasks = memberTaskProgress(currentMemberId, dailyTasks);
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
              <Badge tone="brand">
                Lv.{levelIndex + 1} {level.name}
              </Badge>
            </div>
            <p className="text-2xl font-bold tabular-nums">
              {exp} <span className="text-sm font-normal text-muted">exp</span>
            </p>
            {next ? (
              <>
                <Progress value={exp - level.minExp} max={next.minExp - level.minExp} />
                <p className="text-xs text-muted">
                  距離 Lv.{levelIndex + 2}「{next.name}」還差 {expToNext} exp
                </p>
              </>
            ) : (
              <p className="text-xs text-muted">已達最高等級</p>
            )}
          </CardBody>
        </Card>
      </div>

      {/* 任務 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">任務進度</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {tasks.map(({ task, progress }) => (
            <Card key={task.id}>
              <CardBody className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{task.name}</span>
                  <Badge>{taskPeriodLabel[task.period]}</Badge>
                </div>
                <Progress value={progress} max={task.targetCount} />
                <div className="flex justify-between text-xs text-muted">
                  <span className="tabular-nums">
                    {progress} / {task.targetCount}
                  </span>
                  <span>完成 +{task.rewardPoints} exp</span>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </section>
    </PageContainer>
  );
}
