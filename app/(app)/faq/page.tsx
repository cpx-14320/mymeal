import type { Metadata } from "next";
import { PageContainer, PageHeader, Card, CardBody } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "常見問題" };

const faqs = [
  {
    q: "餘額不足可以先點餐嗎？",
    a: "不行，送出訂單時會檢查餘額。請先到「錢包 / 儲值」提出儲值申請。",
  },
  {
    q: "截止後還能改訂單嗎？",
    a: "不能。截止前可以自行修改或取消，截止後訂單鎖定並扣款。",
  },
  {
    q: "團沒成團怎麼辦？",
    a: "若未達團主設定的最低份數，整團會取消，已扣的款項全額退回錢包。",
  },
  {
    q: "儲值多久會入帳？",
    a: "由管理員審核，核准後餘額立即增加，並在交易明細顯示一筆「儲值入帳」。",
  },
  {
    q: "忘記密碼？",
    a: "在登入頁點「忘記密碼」，系統會寄重設連結到你的公司 Email。",
  },
];

export default function FaqPage() {
  return (
    <PageContainer>
      <PageHeader title="常見問題" />
      <div className="space-y-3">
        {faqs.map((f) => (
          <Card key={f.q}>
            <CardBody>
              <p className="font-semibold">{f.q}</p>
              <p className="mt-1 text-sm leading-7 text-muted">{f.a}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </PageContainer>
  );
}
