import { Section, Stat, Card, CardBody, Badge } from "@/components/ui/primitives";
import { DashboardPendingTopups } from "@/components/admin/dashboard-pending-topups";
import { listGroupOrdersByDate } from "@/lib/models/group-order";
import { listTopupRequests } from "@/lib/models/topup-request";
import { todayTaiwanDateString, formatTaiwanDateTime } from "@/lib/date";

const groupStatusLabel: Record<string, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  open: { label: "開放中", tone: "positive" },
  closed: { label: "已截止", tone: "warning" },
  completed: { label: "已完成", tone: "neutral" },
};

export default async function AdminDashboard() {
  const today = todayTaiwanDateString();
  const [todayGroups, topups] = await Promise.all([listGroupOrdersByDate(today), listTopupRequests()]);

  const pendingTopups = topups
    .filter((t) => t.status === "pending")
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  const todayQty = todayGroups.reduce((sum, g) => sum + g.qty, 0);
  const todayAmount = todayGroups.reduce((sum, g) => sum + g.amount, 0);
  const statusCounts = todayGroups.reduce<Record<string, number>>((acc, g) => {
    acc[g.status] = (acc[g.status] ?? 0) + 1;
    return acc;
  }, {});
  const groupsHint = Object.entries(statusCounts)
    .map(([status, count]) => `${count} ${groupStatusLabel[status]?.label ?? status}`)
    .join(" · ");

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="今日團數" value={todayGroups.length} hint={groupsHint || undefined} />
        <Stat label="今日訂餐份數" value={todayQty} />
        <Stat label="今日金額" value={`NT$ ${todayAmount.toLocaleString()}`} />
        <Stat
          label="待審儲值"
          value={pendingTopups.length}
          hint={pendingTopups[0] ? `最舊：${formatTaiwanDateTime(pendingTopups[0].at)}` : undefined}
        />
      </div>

      <Section title="待審儲值">
        <DashboardPendingTopups requests={pendingTopups.slice(0, 5)} />
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="今日成團狀況">
          {todayGroups.length === 0 ? (
            <p className="text-sm text-muted">今天還沒有團訂。</p>
          ) : (
            <div className="space-y-3">
              {todayGroups.map((g) => (
                <Card key={g.id}>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{g.name}</p>
                      <p className="text-sm text-muted">
                        {g.templateName}．{g.qty} 份
                      </p>
                    </div>
                    <Badge tone={groupStatusLabel[g.status]?.tone ?? "neutral"}>
                      {groupStatusLabel[g.status]?.label ?? g.status}
                    </Badge>
                  </CardBody>
                </Card>
              ))}
            </div>
          )}
        </Section>

        <Section title="近期稽核">
          <Card>
            <CardBody>
              <p className="text-sm text-muted">稽核紀錄功能還沒串接，之後會顯示最近的管理操作。</p>
            </CardBody>
          </Card>
        </Section>
      </div>
    </div>
  );
}
