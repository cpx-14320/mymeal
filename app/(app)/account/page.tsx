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
import { memberLevelInfo } from "@/lib/mock";
import { AccountTaskTabs } from "@/components/account-task-tabs";
import { AccountAvatarUploader } from "@/components/account-avatar-uploader";
import { listDailyTasks, listExpRules, listMemberLevels } from "@/lib/models/gamification";
import { getMemberLifetimeCounts, achievementProgress, periodTaskProgress } from "@/lib/models/achievements";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export const metadata: Metadata = { title: "會員中心" };

export default async function AccountPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const dailyTasks = await listDailyTasks();
  const [member, expRules, memberLevels, lifetimeCounts, periodicTasks] = await Promise.all([
    findMemberById(memberId),
    listExpRules(),
    listMemberLevels(),
    getMemberLifetimeCounts(memberId),
    periodTaskProgress(memberId, dailyTasks),
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

  // exp／等級是累積型指標，用 lifetimeCounts（帳號註冊至今的真實累積次數）換算沒有問題；
  // daily/weekly/monthly 任務進度則是「這個週期內」做了幾次，見 periodTaskProgress（查各集合
  // 自己的時間欄位，例如訂單行的 createdAt、儲值/收藏/評分留言各自的時間），不是用取餘數模擬出來的。
  const { exp, level, levelIndex, next, expToNext } = memberLevelInfo(lifetimeCounts, expRules, memberLevels);
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
          <AccountAvatarUploader
            initialAvatarUrl={member.avatarUrl}
            name={member.name}
            role={member.role || "一般使用者"}
          />
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
