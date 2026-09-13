import {
  Section,
  Stat,
  Card,
  CardBody,
  Badge,
  Button,
  TableWrap,
  Th,
  Td,
} from "@/components/ui/primitives";

const pendingTopups = [
  { who: "王建豪", unit: "五樓", amount: 300, method: "現金", at: "2026/09/10 09:12:07" },
  { who: "陳怡君", unit: "三樓", amount: 1000, method: "銀行轉帳", at: "2026/09/10 08:40:53" },
  { who: "張家瑋", unit: "七樓", amount: 500, method: "銀行轉帳", at: "2026/09/09 18:02:31" },
];

const todayGroups = [
  { name: "三樓週三團", restaurant: "健康廚房", ordered: 8, min: 6, status: "成團" },
  { name: "設計部揪團", restaurant: "阿明快餐", ordered: 3, min: 10, status: "未達標" },
];

const recentAudit = [
  { at: "09/10 10:05", who: "admin", action: "核准儲值申請 #1042" },
  { at: "09/10 09:30", who: "catering", action: "編輯模板：標準便當週 / 星期五" },
  { at: "09/09 17:10", who: "finance", action: "手動退款 NT$95（團訂 #6）" },
];

export default function AdminDashboard() {
  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="今日團數" value="2" hint="1 成團 · 1 未達標" />
        <Stat label="今日訂餐份數" value="11" />
        <Stat label="今日金額" value="NT$ 1,050" />
        <Stat label="待審儲值" value="3" hint="最舊：09/09" />
      </div>

      <Section
        title="待審儲值"
        actions={<Button variant="secondary">前往審核</Button>}
      >
        <TableWrap>
          <thead>
            <tr>
              <Th>申請人</Th>
              <Th>單位</Th>
              <Th className="text-right">金額</Th>
              <Th>方式</Th>
              <Th>時間</Th>
              <Th className="text-right">操作</Th>
            </tr>
          </thead>
          <tbody>
            {pendingTopups.map((t, i) => (
              <tr key={i}>
                <Td>{t.who}</Td>
                <Td className="text-muted">{t.unit}</Td>
                <Td className="text-right tabular-nums">NT$ {t.amount}</Td>
                <Td>{t.method}</Td>
                <Td className="whitespace-nowrap text-muted">{t.at}</Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button size="sm">核准</Button>
                    <Button variant="danger" size="sm">
                      退件
                    </Button>
                  </div>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableWrap>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="今日成團狀況">
          <div className="space-y-3">
            {todayGroups.map((g) => (
              <Card key={g.name}>
                <CardBody className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{g.name}</p>
                    <p className="text-sm text-muted">
                      {g.restaurant}．{g.ordered}/{g.min} 份
                    </p>
                  </div>
                  <Badge tone={g.status === "成團" ? "positive" : "warning"}>
                    {g.status}
                  </Badge>
                </CardBody>
              </Card>
            ))}
          </div>
        </Section>

        <Section title="近期稽核">
          <Card>
            <CardBody className="space-y-3">
              {recentAudit.map((a, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="whitespace-nowrap text-muted">{a.at}</span>
                  <span className="text-muted">{a.who}</span>
                  <span>{a.action}</span>
                </div>
              ))}
            </CardBody>
          </Card>
        </Section>
      </div>

      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
