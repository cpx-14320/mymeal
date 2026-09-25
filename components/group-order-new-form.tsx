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
  EmptyState,
} from "@/components/ui/primitives";
import type { TemplateDetail } from "@/lib/models/template";
import type { OrgOption, UnitOption } from "@/lib/models/org";
import { openGroupOrderAction, type OpenGroupOrderState } from "@/app/(app)/group-orders/new/actions";

const initialState: OpenGroupOrderState = {};

export function GroupOrderNewForm({
  hostId,
  hostUnitId,
  templates,
  departments,
  units,
  defaultDate,
  defaultDeadline,
}: {
  hostId: string;
  hostUnitId: string;
  templates: TemplateDetail[];
  departments: OrgOption[];
  units: UnitOption[];
  defaultDate: string;
  defaultDeadline: string;
}) {
  const boundAction = openGroupOrderAction.bind(null, hostId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const [sectionId, setSectionId] = useState(templates[0]?.sections[0]?.id ?? "");
  const selectedSection = selectedTemplate?.sections.find((s) => s.id === sectionId);

  const hostUnit = units.find((u) => u.id === hostUnitId);
  const [departmentId, setDepartmentId] = useState(hostUnit?.departmentId ?? departments[0]?.id ?? "");
  const [unitId, setUnitId] = useState(hostUnitId);
  const unitsInDept = units.filter((u) => u.departmentId === departmentId);

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
      <PageHeader title="開團" description="選一個模板，品項會自動帶入這個團。" />

      <form action={formAction} className="space-y-6">
        <Card>
          <CardBody className="space-y-5">
            <p className="font-medium">開團設定</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="團名">
                <input className={inputClass} name="name" placeholder="例：三樓週三團" required />
              </Field>
              <Field label="部門">
                <select
                  className={inputClass}
                  value={departmentId}
                  onChange={(e) => {
                    const nextDept = e.target.value;
                    setDepartmentId(nextDept);
                    const firstUnit = units.find((u) => u.departmentId === nextDept);
                    setUnitId(firstUnit?.id ?? "");
                  }}
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="單位">
                <select
                  className={inputClass}
                  name="unitId"
                  value={unitId}
                  onChange={(e) => setUnitId(e.target.value)}
                >
                  {unitsInDept.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="取餐日期">
                <input className={inputClass} type="date" name="date" defaultValue={defaultDate} required />
              </Field>
              <Field label="截止時間">
                <input
                  className={inputClass}
                  type="datetime-local"
                  name="deadline"
                  defaultValue={defaultDeadline}
                />
              </Field>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardBody className="space-y-5">
            <p className="font-medium">選模板</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="模板">
                <select
                  className={inputClass}
                  name="templateId"
                  value={templateId}
                  onChange={(e) => {
                    const nextTemplateId = e.target.value;
                    setTemplateId(nextTemplateId);
                    const nextTemplate = templates.find((t) => t.id === nextTemplateId);
                    setSectionId(nextTemplate?.sections[0]?.id ?? "");
                  }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}（{t.categoryName}）
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="分類">
                <select
                  className={inputClass}
                  name="sectionId"
                  value={sectionId}
                  onChange={(e) => setSectionId(e.target.value)}
                >
                  {selectedTemplate?.sections.length ? (
                    selectedTemplate.sections.map((sec) => (
                      <option key={sec.id} value={sec.id}>
                        {sec.name}
                      </option>
                    ))
                  ) : (
                    <option value="">（這個模板還沒有分類）</option>
                  )}
                </select>
              </Field>
            </div>
          </CardBody>
        </Card>

        {selectedTemplate && (
          <Card>
            <CardBody className="space-y-4">
              <p className="font-medium">菜單預覽</p>

              {!selectedSection || selectedSection.items.length === 0 ? (
                <p className="text-sm text-muted">這個分類還沒有品項。</p>
              ) : (
                <ul className="divide-y divide-line rounded-lg border border-line">
                  {selectedSection.items.map((it) => (
                    <li key={it.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                      <span className="flex items-center gap-2">
                        <span>{it.emoji}</span>
                        <span className="font-medium">{it.name}</span>
                      </span>
                      <span className="text-sm tabular-nums text-muted">NT$ {it.price}</span>
                    </li>
                  ))}
                </ul>
              )}
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
