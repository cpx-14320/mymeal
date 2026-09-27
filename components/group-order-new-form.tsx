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
  ItemLabel,
} from "@/components/ui/primitives";
import type { TemplateDetail } from "@/lib/models/template";
import type { OrgOption, UnitOption } from "@/lib/models/org";
import { openGroupOrdersAction, type OpenGroupOrderState } from "@/app/(app)/group-orders/new/actions";
import { slugToDate } from "@/lib/date";

const initialState: OpenGroupOrderState = {};

interface Row {
  key: string;
  departmentId: string;
  unitId: string;
  name: string;
  nameTouched: boolean;
}

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
  const boundAction = openGroupOrdersAction.bind(null, hostId);
  const [state, formAction, pending] = useActionState(boundAction, initialState);
  const [templateId, setTemplateId] = useState(templates[0]?.id ?? "");
  const selectedTemplate = templates.find((t) => t.id === templateId);
  const [sectionId, setSectionId] = useState(templates[0]?.sections[0]?.id ?? "");
  const selectedSection = selectedTemplate?.sections.find((s) => s.id === sectionId);

  const hostUnit = units.find((u) => u.id === hostUnitId);

  // 團名預設帶入「單位．日期」，還沒手動改過名稱前，切單位／改日期都會即時跟著更新；
  // 使用者一旦自己打過字，就不再自動覆蓋，尊重使用者的輸入。日期是所有列共用的。
  const [date, setDate] = useState(defaultDate);
  const buildDefaultName = (uId: string, dashDate: string) => {
    const unitName = units.find((u) => u.id === uId)?.name;
    return unitName ? `${unitName}．${slugToDate(dashDate)}` : "";
  };

  const [rows, setRows] = useState<Row[]>(() => [
    {
      key: "0",
      departmentId: hostUnit?.departmentId ?? departments[0]?.id ?? "",
      unitId: hostUnitId,
      name: buildDefaultName(hostUnitId, defaultDate),
      nameTouched: false,
    },
  ]);
  let nextRowKey = rows.length;

  function updateDate(nextDate: string) {
    setDate(nextDate);
    setRows((prev) =>
      prev.map((r) => (r.nameTouched ? r : { ...r, name: buildDefaultName(r.unitId, nextDate) })),
    );
  }

  function updateRowUnit(key: string, nextUnitId: string) {
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? { ...r, unitId: nextUnitId, name: r.nameTouched ? r.name : buildDefaultName(nextUnitId, date) }
          : r,
      ),
    );
  }

  function updateRowDepartment(key: string, nextDeptId: string) {
    const firstUnit = units.find((u) => u.departmentId === nextDeptId);
    setRows((prev) =>
      prev.map((r) =>
        r.key === key
          ? {
              ...r,
              departmentId: nextDeptId,
              unitId: firstUnit?.id ?? "",
              name: r.nameTouched ? r.name : buildDefaultName(firstUnit?.id ?? "", date),
            }
          : r,
      ),
    );
  }

  function updateRowName(key: string, value: string) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, name: value, nameTouched: true } : r)));
  }

  function addRow() {
    const last = rows[rows.length - 1];
    const departmentId = last?.departmentId ?? departments[0]?.id ?? "";
    const firstUnit = units.find((u) => u.departmentId === departmentId);
    const unitId = firstUnit?.id ?? "";
    setRows((prev) => [
      ...prev,
      {
        key: String(nextRowKey++),
        departmentId,
        unitId,
        name: buildDefaultName(unitId, date),
        nameTouched: false,
      },
    ]);
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((r) => r.key !== key)));
  }

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
      <PageHeader title="開團" description="選一個模板，品項會自動帶入這個團；可以一次幫多個單位開團。" />

      <form action={formAction} className="space-y-6">
        <Card>
          <CardBody className="space-y-5">
            <p className="font-medium">開團設定</p>
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="取餐日期">
                <input
                  className={inputClass}
                  type="date"
                  name="date"
                  value={date}
                  onChange={(e) => updateDate(e.target.value)}
                  required
                />
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

        <Card>
          <CardBody className="space-y-5">
            <div className="flex items-center justify-between">
              <p className="font-medium">開團單位</p>
              <Button type="button" variant="secondary" size="sm" onClick={addRow}>
                ＋ 新增單位
              </Button>
            </div>

            <div className="space-y-4">
              {rows.map((row, i) => {
                const unitsInDept = units.filter((u) => u.departmentId === row.departmentId);
                const rowError = state.rowErrors?.[i];
                return (
                  <div key={row.key} className="space-y-2 rounded-lg border border-line p-4">
                    <div className="flex items-start gap-3">
                      <div className="grid flex-1 gap-3 sm:grid-cols-3">
                        <Field label="部門">
                          <select
                            className={inputClass}
                            value={row.departmentId}
                            onChange={(e) => updateRowDepartment(row.key, e.target.value)}
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
                            value={row.unitId}
                            onChange={(e) => updateRowUnit(row.key, e.target.value)}
                          >
                            {unitsInDept.map((u) => (
                              <option key={u.id} value={u.id}>
                                {u.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label="團名">
                          <input
                            className={inputClass}
                            name="name"
                            placeholder="例：三樓週三團"
                            value={row.name}
                            onChange={(e) => updateRowName(row.key, e.target.value)}
                            required
                          />
                        </Field>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeRow(row.key)}
                        disabled={rows.length <= 1}
                        className="mt-6 shrink-0 text-sm text-muted hover:text-danger disabled:opacity-30"
                        aria-label="移除這個單位"
                      >
                        移除
                      </button>
                    </div>
                    {rowError && <p className="text-[13px] lg:text-[14px] text-danger">{rowError}</p>}
                  </div>
                );
              })}
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
                      <ItemLabel imageUrl={it.imageUrl} emoji={it.emoji} name={it.name} />
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
          <Button disabled={pending}>{pending ? "開團中…" : rows.length > 1 ? `發佈開團（${rows.length}）` : "發佈開團"}</Button>
        </div>
      </form>
    </PageContainer>
  );
}
