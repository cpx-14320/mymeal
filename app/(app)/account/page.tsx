import { redirect } from "next/navigation";
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
import { memberLevelInfo, memberTaskProgress } from "@/lib/mock";
import { AccountTaskTabs } from "@/components/account-task-tabs";
import { listDailyTasks, listExpRules, listMemberLevels } from "@/lib/models/gamification";
import { getMemberLifetimeCounts, achievementProgress } from "@/lib/models/achievements";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export const metadata: Metadata = { title: "會員中心" };

export default async function AccountPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const [member, dailyTasks, expRules, memberLevels, lifetimeCounts] = await Promise.all([
    findMemberById(memberId),
    listDailyTasks(),
    listExpRules(),
    listMemberLevels(),
    getMemberLifetimeCounts(memberId),
  ]);
  if (!member) redirect("/login");

  const profile = [
    ["姓名", member.name],
    ["公司 Email", member.email],
    ["部門", member.dept],
    ["單位", member.unit],
    ["員工編號", member.employeeId],
    ["專屬碼", member.memberCode],
  ];

  // exp／等級跟 daily/weekly/monthly 任務進度沒有真的 period-bucketed 活動歷史可用
  // （沒有另存「這週已完成幾次」這種紀錄），所以進度仍是用 lifetimeCounts 取餘數模擬；
  // 但 lifetimeCounts 本身是這位真實登入者的累積次數，不再是 mock 示範會員的假資料。
  const { exp, level, levelIndex, next, expToNext } = memberLevelInfo(lifetimeCounts, expRules, memberLevels);
  const periodicTasks = memberTaskProgress(
    lifetimeCounts,
    dailyTasks.filter((t) => t.period !== "achievement"),
  );
  const achievements = achievementProgress(dailyTasks, lifetimeCounts);
  const tasks = [...periodicTasks, ...achievements];
  return (
    <PageContainer>
      <PageHeader
        title="會員中心"
        description="個人資料、等級與任務進度。"
        actions={<Button variant="secondary">編輯資料</Button>}
      />

      {/* 個人資料 */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="grid size-16 place-items-center rounded-full bg-brand-soft text-2xl">
              🙂
            </div>
            <div>
              <p className="text-lg font-bold">{member.name}</p>
              <p className="text-sm text-muted">{member.role || "一般使用者"}</p>
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

          {/* 等級 */}
          <div className="space-y-3 border-t border-line pt-4">
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
          </div>
        </CardBody>
      </Card>

      {/* 任務 */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold tracking-tight">任務進度</h2>
        <AccountTaskTabs tasks={tasks} />
      </section>
    </PageContainer>
  );
}
