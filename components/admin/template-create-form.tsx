"use client";

import { useActionState } from "react";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import { createTemplateAction, type CreateTemplateState } from "@/app/(app)/admin/templates/new/actions";

const initialState: CreateTemplateState = {};

/** 新增模板表單——跟新增頁面同一個節奏：先填名稱、按「建立模板」才真的存進資料庫，
 *  不是進這頁就馬上建立一個空模板；建立成功後導回列表頁顯示成功訊息，可以再點進去繼續編輯區塊與品項。 */
export function TemplateCreateForm() {
  const [state, formAction, pending] = useActionState(createTemplateAction, initialState);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="模板名稱">
            <input className={inputClass} name="name" placeholder="例：第 1 週菜單" required />
          </Field>
          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/templates" variant="ghost">
          取消
        </ButtonLink>
        <Button disabled={pending}>{pending ? "建立中…" : "建立模板"}</Button>
      </div>
    </form>
  );
}
