import { GamificationManager } from "@/components/admin/gamification-manager";
import { listDailyTasks, listExpRules, listMemberLevels } from "@/lib/models/gamification";

export const metadata = { title: "任務與經驗" };

export default async function AdminTasksPage() {
  const [tasks, rules, levels] = await Promise.all([listDailyTasks(), listExpRules(), listMemberLevels()]);

  return <GamificationManager tasks={tasks} rules={rules} levels={levels} />;
}
