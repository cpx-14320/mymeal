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
import { memberExp, memberLevelInfo } from "@/lib/mock";
import { AccountTaskTabs } from "@/components/account-task-tabs";
import { AccountAvatarUploader } from "@/components/account-avatar-uploader";
import { listDailyTasks, listExpRules, listMemberLevels } from "@/lib/models/gamification";
import {
  getMemberLifetimeCounts,
  achievementProgress,
  periodTaskProgress,
  checkAndGrantTaskCompletions,
} from "@/lib/models/achievements";
import { getMemberTaskCompletionBonusExp } from "@/lib/models/task-completion";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";

export const metadata: Metadata = { title: "會員中心" };

export default async function AccountPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const dailyTasks = await listDailyTasks();
  // 進頁面就先檢查一輪「有沒有任務剛好達標、還沒發過這個週期/成就的完成獎勵」，有的話補發一筆，
  // 一定要在下面算 exp 之前做，不然這次剛達標的獎勵不會被算進當下顯示的總 exp 裡。
  await checkAndGrantTaskCompletions(memberId, dailyTasks);

  const [member, expRules, memberLevels, lifetimeCounts, periodicTasks, bonusExp] = await Promise.all([
    findMemberById(memberId),
    listExpRules(),
    listMemberLevels(),
    getMemberLifetimeCounts(memberId),
    periodTaskProgress(memberId, dailyTasks),
    getMemberTaskCompletionBonusExp(memberId),
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

  // 總 exp = 行為 exp（依帳號終身累計次數 × 經驗值規則，即時計算，會隨行為被取消/撤銷增減）
  //        + 任務完成獎勵 exp（達標當下發一次、永久保留，見 checkAndGrantTaskCompletions 的說明）。
  // daily/weekly/monthly 任務進度則是「這個週期內」做了幾次，見 periodTaskProgress（查各集合
  // 自己的時間欄位，例如訂單行的 createdAt、儲值/收藏/評分留言各自的時間），不是用取餘數模擬出來的。
  const totalExp = memberExp(lifetimeCounts, expRules) + bonusExp;
  const { exp, level, levelIndex, next, expToNext } = memberLevelInfo(totalExp, memberLevels);
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
