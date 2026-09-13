import {
  Section,
  Button,
  Badge,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";

export const metadata = { title: "任務與經驗" };

const tasks = [
  { name: "每日訂餐", type: "order", period: "每日", target: 1, points: 10, active: true },
  { name: "每週訂餐", type: "order", period: "每週", target: 4, points: 20, active: true },
  { name: "每週儲值", type: "topup", period: "每週", target: 1, points: 10, active: true },
  { name: "每月評分", type: "rating", period: "每月", target: 5, points: 15, active: true },
  { name: "每月留言", type: "comment", period: "每月", target: 3, points: 10, active: false },
];

const expRules = [
  { type: "order", per: 5, daily: 10, weekly: 40, monthly: null },
  { type: "topup", per: 10, daily: 10, weekly: 20, monthly: 60 },
  { type: "rating", per: 3, daily: 6, weekly: null, monthly: null },
  { type: "comment", per: 3, daily: 6, weekly: null, monthly: null },
  { type: "favorite", per: 1, daily: 5, weekly: null, monthly: null },
];

const levels = [
  { name: "新手", min: 0 },
  { name: "常客", min: 300 },
  { name: "熟客", min: 700 },
  { name: "達人", min: 1500 },
  { name: "傳說", min: 3000 },
];

export default function AdminTasksPage() {
  return (
    <div className="space-y-8">
      <Section title="任務" actions={<Button>新增任務</Button>}>
        <TableWrap>
          <thead>
            <tr>
              <Th>名稱</Th>
              <Th>類型</Th>
              <Th>週期</Th>
              <Th className="text-right">目標次數</Th>
              <Th className="text-right">獎勵 exp</Th>
              <Th>狀態</Th>
              <Th className="text-right">操作</Th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((t, i) => (
              <tr key={i}>
                <Td className="font-medium">{t.name}</Td>
                <Td className="font-mono text-xs text-muted">{t.type}</Td>
                <Td>
                  <Badge>{t.period}</Badge>
                </Td>
                <Td className="text-right tabular-nums">{t.target}</Td>
                <Td className="text-right tabular-nums">+{t.points}</Td>
                <Td>
                  <Badge tone={t.active ? "positive" : "neutral"}>
                    {t.active ? "啟用" : "停用"}
                  </Badge>
                </Td>
                <Td className="text-right">
                  <Button variant="secondary" size="sm">
                    編輯
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <Section
        title="經驗值規則"
        description="每次動作給多少 exp，以及每日 / 每週 / 每月上限（空白 = 不限）。"
        actions={<Button variant="secondary">新增規則</Button>}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>動作類型</Th>
              <Th className="text-right">每次 exp</Th>
              <Th className="text-right">每日上限</Th>
              <Th className="text-right">每週上限</Th>
              <Th className="text-right">每月上限</Th>
            </tr>
          </thead>
          <tbody>
            {expRules.map((r, i) => (
              <tr key={i}>
                <Td className="font-mono text-xs">{r.type}</Td>
                <Td className="text-right tabular-nums">{r.per}</Td>
                <Td className="text-right tabular-nums text-muted">
                  {r.daily ?? "—"}
                </Td>
                <Td className="text-right tabular-nums text-muted">
                  {r.weekly ?? "—"}
                </Td>
                <Td className="text-right tabular-nums text-muted">
                  {r.monthly ?? "—"}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <Section title="等級" actions={<Button variant="secondary">新增等級</Button>}>
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
              <tr key={i}>
                <Td className="font-medium">
                  Lv.{i + 1} {l.name}
                </Td>
                <Td className="text-right tabular-nums">{l.min}</Td>
                <Td className="text-right">
                  <Button variant="secondary" size="sm">
                    編輯
                  </Button>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
