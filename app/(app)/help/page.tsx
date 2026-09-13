import type { Metadata } from "next";
import { PageContainer, PageHeader, Card, CardBody } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "使用說明" };

const steps = [
  {
    title: "1. 開通帳號",
    body: "用公司 Email 申請帳號，完成 Email 驗證或等管理員審核後即可登入。",
  },
  {
    title: "2. 儲值",
    body: "到「錢包 / 儲值」提出儲值申請，填寫金額與匯款資訊，管理員核准後餘額增加。",
  },
  {
    title: "3. 開團或加入團",
    body: "在「開團訂餐」開一個新團，或加入同事的團，選好便當與備註後送出。",
  },
  {
    title: "4. 截止與取餐",
    body: "截止時間到系統自動結單並扣款，依團主設定的地點與時間取餐。",
  },
];

export default function HelpPage() {
  return (
    <PageContainer>
      <PageHeader title="使用說明" description="第一次使用 MyMeal？照這幾步走。" />
      <div className="space-y-3">
        {steps.map((s) => (
          <Card key={s.title}>
            <CardBody>
              <p className="font-semibold">{s.title}</p>
              <p className="mt-1 text-sm leading-7 text-muted">{s.body}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
