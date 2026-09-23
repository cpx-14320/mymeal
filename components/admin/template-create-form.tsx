"use client";

import { useActionState } from "react";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import type { PageView } from "@/lib/models/page";
import type { ItemKindOption } from "@/lib/models/item-kind";
import { createTemplateAction, type CreateTemplateState } from "@/app/(app)/admin/templates/actions";

const initialState: CreateTemplateState = {};

export function TemplateCreateForm({ pages, kinds }: { pages: PageView[]; kinds: ItemKindOption[] }) {
  const [state, formAction, pending] = useActionState(createTemplateAction, initialState);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="模板名稱">
            <input className={inputClass} name="name" placeholder="例：標準便當週" required />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="類型">
              <select className={inputClass} name="kindId" defaultValue="" required>
                <option value="" disabled>
                  選擇類型
                </option>
                {kinds.map((k) => (
                  <option key={k.id} value={k.id}>
                    {k.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="頁面" hint="選填，多個頁面混合就留空">
              <select className={inputClass} name="pageId" defaultValue="">
                <option value="">選擇頁面</option>
                {pages.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

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
