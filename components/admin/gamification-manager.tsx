"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Section, Button, Badge, TableWrap, Th, Td, PillTabs, BulkActionBar } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { taskTypeLabel, taskPeriodLabel } from "@/lib/mock";
import type {
  DailyTaskView,
  ExpRuleView,
  MemberLevelView,
  TaskType,
  TaskPeriod,
} from "@/lib/models/gamification";
import {
  createDailyTaskAction,
  updateDailyTaskAction,
  deleteDailyTaskAction,
  deleteDailyTasksAction,
  createExpRuleAction,
  updateExpRuleAction,
  deleteExpRuleAction,
  createMemberLevelAction,
  updateMemberLevelAction,
  deleteMemberLevelAction,
} from "@/app/(app)/admin/tasks/actions";

const cellInput = "w-full rounded-md border border-transparent bg-transparent px-1 py-0.5 hover:border-line focus:border-brand focus:outline-none";
/** 數字欄位最多 4~5 位數就好，不用跟其他欄位一樣撐滿——跟品項設定的價錢欄一致，靠左、窄寬。 */
const cellNumberInput = "w-16 rounded-md border border-transparent bg-transparent px-1 py-0.5 text-left hover:border-line focus:border-brand focus:outline-none";
const TASK_TYPES: TaskType[] = ["topup", "order", "favorite", "comment", "rating"];
const TASK_PERIODS: TaskPeriod[] = ["daily", "weekly", "monthly", "achievement"];

type Tab = "tasks" | "rules" | "levels";

function TasksSection({ tasks }: { tasks: DailyTaskView[] }) {
  const router = useRouter();
  const [busy, startTransition] = useTransition();
  const [selected, setSelected] = useState<Set<string>>(() => new Set());

  function patch(id: string, p: Parameters<typeof updateDailyTaskAction>[1]) {
    startTransition(async () => {
      await updateDailyTaskAction(id, p);
      router.refresh();
    });
  }

  const allSelected = tasks.length > 0 && tasks.every((t) => selected.has(t.id));

  const toggleAll = () =>
    setSelected(allSelected ? new Set() : new Set(tasks.map((t) => t.id)));

  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  function bulkDelete() {
    startTransition(async () => {
      await deleteDailyTasksAction([...selected]);
      setSelected(new Set());
      router.refresh();
    });
  }

  return (
    <Section>
      <AdminHeaderActions>
        <Button
          size="sm"
          onClick={() =>
            startTransition(async () => {
              await createDailyTaskAction();
              router.refresh();
            })
          }
        >
          新增任務
        </Button>
      </AdminHeaderActions>

      <BulkActionBar
        count={selected.size}
        unit="項"
        onCancel={() => setSelected(new Set())}
        actions={[{ label: "刪除選取", tone: "danger", onClick: bulkDelete, disabled: busy }]}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th className="w-10">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="全選" />
            </Th>
            <Th>名稱</Th>
            <Th>類型</Th>
            <Th>週期</Th>
            <Th>目標次數</Th>
            <Th>獎勵 exp</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {tasks.map((t) => (
            <tr key={t.id} className={selected.has(t.id) ? "bg-brand-soft" : ""}>
              <Td>
                <input
                  type="checkbox"
                  checked={selected.has(t.id)}
                  onChange={() => toggleOne(t.id)}
                  aria-label={`選取 ${t.name}`}
                />
              </Td>
              <Td>
                <input
                  className={cellInput}
                  defaultValue={t.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== t.name) patch(t.id, { name: v });
                  }}
                />
              </Td>
              <Td className="font-mono text-muted">
                <select
                  className={cellInput}
                  defaultValue={t.type}
                  onChange={(e) => patch(t.id, { type: e.target.value as TaskType })}
                >
                  {TASK_TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {taskTypeLabel[ty]}
                    </option>
                  ))}
                </select>
              </Td>
              <Td>
                <select
                  className={cellInput}
                  defaultValue={t.period}
                  onChange={(e) => patch(t.id, { period: e.target.value as TaskPeriod })}
                >
                  {TASK_PERIODS.map((p) => (
                    <option key={p} value={p}>
                      {taskPeriodLabel[p]}
                    </option>
                  ))}
                </select>
              </Td>
              <Td>
                <input
                  className={cellNumberInput}
                  type="number"
                  defaultValue={t.targetCount}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n !== t.targetCount) patch(t.id, { targetCount: n });
                  }}
                />
              </Td>
              <Td>
                <input
                  className={cellNumberInput}
                  type="number"
                  defaultValue={t.rewardPoints}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n !== t.rewardPoints) patch(t.id, { rewardPoints: n });
                  }}
                />
              </Td>
              <Td>
                <button type="button" onClick={() => patch(t.id, { active: !t.active })}>
                  <Badge tone={t.active ? "positive" : "neutral"}>{t.active ? "啟用" : "停用"}</Badge>
                </button>
              </Td>
              <Td className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteDailyTaskAction(t.id);
                      router.refresh();
                    })
                  }
                >
                  刪除
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Section>
  );
}

function ExpRulesSection({ rules }: { rules: ExpRuleView[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function patch(id: string, p: Parameters<typeof updateExpRuleAction>[1]) {
    startTransition(async () => {
      await updateExpRuleAction(id, p);
      router.refresh();
    });
  }

  function limitValue(v: number | null) {
    return v === null ? "" : String(v);
  }

  function parseLimit(v: string): number | null {
    const trimmed = v.trim();
    return trimmed === "" ? null : Number(trimmed);
  }

  return (
    <Section>
      <AdminHeaderActions>
        <Button
          size="sm"
          onClick={() =>
            startTransition(async () => {
              await createExpRuleAction();
              router.refresh();
            })
          }
        >
          新增規則
        </Button>
      </AdminHeaderActions>

      <TableWrap>
        <thead>
          <tr>
            <Th>動作類型</Th>
            <Th className="text-right">每次 exp</Th>
            <Th className="text-right">每日上限</Th>
            <Th className="text-right">每週上限</Th>
            <Th className="text-right">每月上限</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rules.map((r) => (
            <tr key={r.id}>
              <Td className="font-mono">
                <select
                  className={cellInput}
                  defaultValue={r.type}
                  onChange={(e) => patch(r.id, { type: e.target.value as TaskType })}
                >
                  {TASK_TYPES.map((ty) => (
                    <option key={ty} value={ty}>
                      {taskTypeLabel[ty]}
                    </option>
                  ))}
                </select>
              </Td>
              <Td className="text-right">
                <input
                  className={`${cellInput} text-right`}
                  type="number"
                  defaultValue={r.expPerAction}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n !== r.expPerAction) patch(r.id, { expPerAction: n });
                  }}
                />
              </Td>
              {(["dailyLimit", "weeklyLimit", "monthlyLimit"] as const).map((field) => (
                <Td key={field} className="text-right text-muted">
                  <input
                    className={`${cellInput} text-right`}
                    placeholder="不限"
                    defaultValue={limitValue(r[field])}
                    onBlur={(e) => {
                      const n = parseLimit(e.target.value);
                      if (n !== r[field]) patch(r.id, { [field]: n });
                    }}
                  />
                </Td>
              ))}
              <Td className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteExpRuleAction(r.id);
                      router.refresh();
                    })
                  }
                >
                  刪除
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Section>
  );
}

function LevelsSection({ levels }: { levels: MemberLevelView[] }) {
  const router = useRouter();
  const [, startTransition] = useTransition();

  function patch(id: string, p: { name?: string; minExp?: number }) {
    startTransition(async () => {
      await updateMemberLevelAction(id, p);
      router.refresh();
    });
  }

  return (
    <Section>
      <AdminHeaderActions>
        <Button
          size="sm"
          onClick={() =>
            startTransition(async () => {
              await createMemberLevelAction();
              router.refresh();
            })
          }
        >
          新增等級
        </Button>
      </AdminHeaderActions>

      <TableWrap>
        <thead>
          <tr>
            <Th>等級</Th>
            <Th className="text-right">所需 exp</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {levels.map((l, i) => (
            <tr key={l.id}>
              <Td>
                <span className="mr-1 text-muted">Lv.{i + 1}</span>
                <input
                  className={cellInput}
                  defaultValue={l.name}
                  onBlur={(e) => {
                    const v = e.target.value.trim();
                    if (v && v !== l.name) patch(l.id, { name: v });
                  }}
                />
              </Td>
              <Td className="text-right">
                <input
                  className={`${cellInput} text-right`}
                  type="number"
                  defaultValue={l.minExp}
                  onBlur={(e) => {
                    const n = Number(e.target.value);
                    if (Number.isFinite(n) && n !== l.minExp) patch(l.id, { minExp: n });
                  }}
                />
              </Td>
              <Td className="text-right">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    startTransition(async () => {
                      await deleteMemberLevelAction(l.id);
                      router.refresh();
                    })
                  }
                >
                  刪除
                </Button>
              </Td>
            </tr>
          ))}
        </tbody>
      </TableWrap>
    </Section>
  );
}

export function GamificationManager({
  tasks,
  rules,
  levels,
}: {
  tasks: DailyTaskView[];
  rules: ExpRuleView[];
  levels: MemberLevelView[];
}) {
  const [tab, setTab] = useState<Tab>("tasks");

  return (
    <div className="space-y-4">
      <PillTabs
        tabs={[
          { key: "tasks", label: "任務", count: tasks.length },
          { key: "rules", label: "經驗值規則", count: rules.length },
          { key: "levels", label: "等級", count: levels.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "tasks" && <TasksSection tasks={tasks} />}
      {tab === "rules" && <ExpRulesSection rules={rules} />}
      {tab === "levels" && <LevelsSection levels={levels} />}
    </div>
  );
}
