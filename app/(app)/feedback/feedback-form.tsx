"use client";

import { useActionState, useEffect, useRef } from "react";
import { Card, CardBody, Field, inputClass, Button } from "@/components/ui/primitives";
import { submitFeedbackAction, type FeedbackState } from "./actions";

const initialState: FeedbackState = {};

export function FeedbackForm() {
  const [state, formAction, pending] = useActionState(submitFeedbackAction, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.success) formRef.current?.reset();
  }, [state.success]);

  return (
    <Card>
      <CardBody className="space-y-4">
        <form ref={formRef} action={formAction} className="space-y-4">
          <Field label="類型">
            <select className={inputClass} name="type" defaultValue="功能建議">
              <option>功能建議</option>
              <option>操作問題</option>
              <option>餐點 / 餐廳問題</option>
              <option>錢包 / 儲值問題</option>
              <option>其他</option>
            </select>
          </Field>
          <Field label="內容">
            <textarea
              className={`${inputClass} min-h-32`}
              name="content"
              placeholder="請描述你遇到的情況或建議…"
              required
            />
          </Field>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}
          {state.success && <p className="text-sm text-positive">已收到你的意見，謝謝回饋！</p>}

          <div className="flex justify-end">
            <Button disabled={pending}>{pending ? "送出中…" : "送出"}</Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
