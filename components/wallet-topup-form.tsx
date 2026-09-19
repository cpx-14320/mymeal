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
} from "@/components/ui/primitives";
import { createTopupRequestAction, type TopupState } from "@/app/(app)/wallet/topup/actions";

const initialState: TopupState = {};
const quickAmounts = [100, 250, 500];
const methods = ["銀行轉帳", "現金", "餐券"];

export function TopupForm({ memberId }: { memberId: string }) {
  const boundAction = createTopupRequestAction.bind(null, memberId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState(methods[0]);

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
                {methods.map((m) => (
                  <label key={m} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="method"
                      value={m}
                      checked={method === m}
                      onChange={() => setMethod(m)}
                    />
                    {m}
                  </label>
                ))}
              </div>
            </Field>

            {method === "銀行轉帳" && (
              <Field label="匯款後五碼 / 憑證">
                <input className={inputClass} name="code" placeholder="請輸入後5碼" />
              </Field>
            )}

            <Field label="備註">
              <textarea className={`${inputClass} min-h-20`} name="note" placeholder="請輸入文字" />
            </Field>

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
