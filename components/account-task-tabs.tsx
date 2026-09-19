"use client";

import { useState } from "react";
import { PillTabs, Card, CardBody, Badge, Progress } from "@/components/ui/primitives";
import { taskPeriodLabel, type TaskConfig, type TaskPeriod } from "@/lib/mock";

type Tab = TaskPeriod | "achievement";

const TAB_LABELS: Record<Tab, string> = {
  daily: "每日",
  weekly: "每週",
  monthly: "每月",
  achievement: "成就",
};

export function AccountTaskTabs({
  tasks,
}: {
  tasks: { task: TaskConfig; progress: number }[];
}) {
  const [tab, setTab] = useState<Tab>("daily");

  const byPeriod = (period: TaskPeriod) => tasks.filter((t) => t.task.period === period);
  const daily = byPeriod("daily");
  const weekly = byPeriod("weekly");
  const monthly = byPeriod("monthly");
  const achievement = byPeriod("achievement");

  const tabs = [
    { key: "daily" as Tab, label: TAB_LABELS.daily, count: daily.length },
    { key: "weekly" as Tab, label: TAB_LABELS.weekly, count: weekly.length },
    { key: "monthly" as Tab, label: TAB_LABELS.monthly, count: monthly.length },
    { key: "achievement" as Tab, label: TAB_LABELS.achievement, count: achievement.length },
  ];

  const rows =
    tab === "daily" ? daily : tab === "weekly" ? weekly : tab === "monthly" ? monthly : achievement;

  return (
    <div className="space-y-3">
      <PillTabs tabs={tabs} value={tab} onChange={setTab} />

      {rows.length === 0 ? (
        <p className="text-sm text-muted">目前沒有這個分類的任務。</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map(({ task, progress }) => (
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
      )}
    </div>
  );
}
