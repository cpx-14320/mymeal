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
  Badge,
  Note,
  EmptyState,
} from "@/components/ui/primitives";
import type { TemplateDetail } from "@/lib/models/template";
import type { UnitOption } from "@/lib/models/org";
import { openGroupOrderAction, type OpenGroupOrderState } from "@/app/(app)/group-orders/new/actions";

const initialState: OpenGroupOrderState = {};

export function GroupOrderNewForm({
  hostId,
  hostUnitId,
  templates,
  units,
  pickupLocations,
  deadlineDefaultHint,
  underMinPolicy,
}: {
  hostId: string;
  hostUnitId: string;
  templates: TemplateDetail[];
  units: UnitOption[];
  pickupLocations: string[];
  deadlineDefaultHint: string;
  underMinPolicy: string;
}) {
  const boundAction = openGroupOrderAction.bind(null, hostId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((t) => t.id === templateId);

  if (templates.length === 0) {
    return (
      <PageContainer>
        <PageHeader title="開團" description="選一個模板，品項會自動帶入這個團。" />
        <EmptyState title="還沒有可用的模板" hint="請先到後台「模板設定」建立至少一個上架中的模板。" />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <PageHeader title="開團" description="選一個模板，品項會自動帶入這個團；同事點餐時可以從整個模板挑選。" />

      <form action={formAction} className="space-y-6">
        <Card>
          <CardBody className="space-y-5">
            <p className="text-sm font-semibold text-muted">1 · 開團設定</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="團名" hint="讓同事看得懂是哪一團">
                <input className={inputClass} name="name" placeholder="例：三樓週三團" required />
              </Field>
              <Field label="單位">
                <select className={inputClass} name="unitId" defaultValue={hostUnitId}>
                  {units.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.departmentName}．{u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="取餐日期">
                <input className={inputClass} type="date" name="date" required />
              </Field>
              <Field label="截止時間" hint={`系統預設：${deadlineDefaultHint}`}>
                <input className={inputClass} type="datetime-local" name="deadline" />
              </Field>
              <Field label="取餐地點">
                {pickupLocations.length === 0 ? (
                  <input className={inputClass} name="pickupLocation" placeholder="例：3F 茶水間" />
                ) : (
                  <select className={inputClass} name="pickupLocation" defaultValue={pickupLocations[0]}>
                    {pickupLocations.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            </div>
            <Note>未達最低訂購門檻時的處理方式（依後台「系統設定」）：{underMinPolicy}</Note>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <p className="text-sm font-semibold text-muted">2 · 選模板</p>
            <Field label="模板">
              <select
                className={inputClass}
                name="templateId"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
              >
                {templates.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}（{t.kindName}）
                  </option>
                ))}
              </select>
            </Field>
          </CardBody>
        </Card>

        {selectedTemplate && (
          <Card>
            <CardBody className="space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-muted">3 · 當週菜單預覽</p>
                <Badge>來自「{selectedTemplate.name}」</Badge>
              </div>
              <Note>同事點餐時可以從這個模板底下所有分類的品項挑選；換品項請到「模板設定」調整。</Note>

              {selectedTemplate.sections.length === 0 && (
                <p className="text-sm text-muted">這個模板還沒有分類/品項。</p>
              )}

              <div className="space-y-3">
                {selectedTemplate.sections.map((sec) => (
                  <div key={sec.id}>
                    <p className="mb-1.5 text-sm font-medium">{sec.name}</p>
                    {sec.items.length === 0 ? (
                      <p className="pl-1 text-sm text-muted">還沒有品項。</p>
                    ) : (
                      <ul className="divide-y divide-line rounded-lg border border-line">
                        {sec.items.map((it) => (
                          <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                            <span className="flex items-center gap-2">
                              <span>{it.emoji}</span>
                              <span className="font-medium">{it.name}</span>
                              {it.supplierName && <span className="text-xs text-muted">{it.supplierName}</span>}
                            </span>
                            <span className="text-sm tabular-nums text-muted">NT$ {it.price}</span>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            </CardBody>
          </Card>
        )}

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <div className="flex justify-end gap-2">
          <ButtonLink href="/group-orders" variant="ghost">
            取消
          </ButtonLink>
          <Button disabled={pending}>{pending ? "開團中…" : "發佈開團"}</Button>
        </div>
      </form>
    </PageContainer>
  );
}
