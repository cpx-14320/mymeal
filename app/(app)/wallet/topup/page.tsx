import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
  ButtonLink,
  Note,
} from "@/components/ui/primitives";

export const metadata: Metadata = { title: "申請儲值" };

export default function TopupPage() {
  return (
    <PageContainer>
      <PageHeader
        title="申請儲值"
        description="填寫金額與付款資訊，送出後由管理員審核入帳。"
      />

      <Card>
        <CardBody className="space-y-5">
          <Field label="儲值金額">
            <input className={inputClass} type="number" min={100} step={100} placeholder="500" />
          </Field>

          <div className="flex flex-wrap gap-2">
            {[100, 300, 500, 1000].map((amt) => (
              <button
                key={amt}
                type="button"
                className="rounded-lg border border-line bg-surface px-4 py-1.5 text-sm hover:bg-surface-2"
              >
                NT$ {amt}
              </button>
            ))}
          </div>

          <Field label="付款方式">
            <div className="flex flex-wrap gap-4 pt-1 text-sm">
              {["銀行轉帳", "現金", "信用卡"].map((m, i) => (
                <label key={m} className="flex items-center gap-2">
                  <input type="radio" name="method" defaultChecked={i === 0} />
                  {m}
                </label>
              ))}
            </div>
          </Field>

          <Field label="匯款後五碼 / 憑證" hint="銀行轉帳請填帳號末五碼，現金可略過">
            <input className={inputClass} placeholder="12345" />
          </Field>

          <Field label="備註">
            <textarea className={`${inputClass} min-h-20`} placeholder="選填" />
          </Field>

          <Note>
            送出後狀態為「待審核」。管理員核准後餘額才會增加，並在交易明細留下一筆「儲值入帳」。
          </Note>

          <div className="flex justify-end gap-2">
            <ButtonLink href="/wallet" variant="ghost">
              取消
            </ButtonLink>
            <Button>送出申請</Button>
          </div>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
