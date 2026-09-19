"use client";

import { useActionState, useState } from "react";
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
import { createTopupRequestAction, type TopupState } from "@/app/(app)/wallet/topup/actions";

const initialState: TopupState = {};
const quickAmounts = [100, 300, 500, 1000];
const methods = ["銀行轉帳", "現金", "信用卡"];

export function TopupForm({ memberId }: { memberId: string }) {
  const boundAction = createTopupRequestAction.bind(null, memberId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [amount, setAmount] = useState("");

  return (
    <PageContainer>
      <PageHeader title="申請儲值" description="填寫金額與付款資訊，送出後由管理員審核入帳。" />

      <form action={formAction}>
        <Card>
          <CardBody className="space-y-5">
            <Field label="儲值金額">
              <input
                className={inputClass}
                type="number"
                min={100}
                step={100}
                name="amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="500"
                required
              />
            </Field>

            <div className="flex flex-wrap gap-2">
              {quickAmounts.map((amt) => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => setAmount(String(amt))}
                  className="rounded-lg border border-line bg-surface px-4 py-1.5 text-sm hover:bg-surface-2"
                >
                  NT$ {amt}
                </button>
              ))}
            </div>

            <Field label="付款方式">
              <div className="flex flex-wrap gap-4 pt-1 text-sm">
                {methods.map((m, i) => (
                  <label key={m} className="flex items-center gap-2">
                    <input type="radio" name="method" value={m} defaultChecked={i === 0} />
                    {m}
                  </label>
                ))}
              </div>
            </Field>

            <Field label="匯款後五碼 / 憑證" hint="銀行轉帳請填帳號末五碼，現金可略過">
              <input className={inputClass} name="code" placeholder="12345" />
            </Field>

            <Field label="備註">
              <textarea className={`${inputClass} min-h-20`} name="note" placeholder="選填" />
            </Field>

            <Note>
              送出後狀態為「待審核」。管理員核准後餘額才會增加，並在交易明細留下一筆「儲值入帳」。
            </Note>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <div className="flex justify-end gap-2">
              <ButtonLink href="/wallet" variant="ghost">
                取消
              </ButtonLink>
              <Button disabled={pending}>{pending ? "送出中…" : "送出申請"}</Button>
            </div>
          </CardBody>
        </Card>
      </form>
    </PageContainer>
  );
}
