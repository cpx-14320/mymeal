"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import type { TemplateDetail } from "@/lib/models/template";
import type { OrgOption, UnitOption } from "@/lib/models/org";
import { updateGroupOrderSettingsAction } from "@/app/(app)/group-orders/[id]/actions";

interface GroupOrderSettingsEditorProps {
  groupOrderId: string;
  current: { name: string; templateId: string; sectionId: string; unitId: string; deadline: string };
  templates: TemplateDetail[];
  departments: OrgOption[];
  units: UnitOption[];
}

/** "YYYY-MM-DD HH:mm"（後端存的格式）轉成 datetime-local 欄位要的 "YYYY-MM-DDTHH:mm"；格式對不上就回傳空字串。 */
function toDatetimeLocalValue(deadline: string): string {
  const m = deadline.match(/^(\d{4}-\d{2}-\d{2}) (\d{2}:\d{2})/);
  return m ? `${m[1]}T${m[2]}` : "";
}

/** 團主專用：修正開團時設錯的套用模板／區塊／單位／團名——不影響大家已經點好的餐點，
 *  因為每一行點餐記錄的是自己的品項/價格快照，跟模板/區塊/單位無關。 */
export function GroupOrderSettingsEditor({
  groupOrderId,
  current,
  templates,
  departments,
  units,
}: GroupOrderSettingsEditorProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(current.name);
  const [templateId, setTemplateId] = useState(current.templateId);
  const [sectionId, setSectionId] = useState(current.sectionId);
  const [departmentId, setDepartmentId] = useState(
    units.find((u) => u.id === current.unitId)?.departmentId ?? departments[0]?.id ?? "",
  );
  const [unitId, setUnitId] = useState(current.unitId);
  const [deadline, setDeadline] = useState(toDatetimeLocalValue(current.deadline));
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const selectedTemplate = templates.find((t) => t.id === templateId);
  const unitsInDept = units.filter((u) => u.departmentId === departmentId);

  function openModal() {
    setName(current.name);
    setTemplateId(current.templateId);
    setSectionId(current.sectionId);
    setDepartmentId(units.find((u) => u.id === current.unitId)?.departmentId ?? departments[0]?.id ?? "");
    setUnitId(current.unitId);
    setDeadline(toDatetimeLocalValue(current.deadline));
    setError(undefined);
    setOpen(true);
  }

  async function handleSubmit() {
    setPending(true);
    setError(undefined);
    const result = await updateGroupOrderSettingsAction(groupOrderId, {
      name,
      templateId,
      sectionId: sectionId || undefined,
      unitId,
      deadline,
    });
    setPending(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" variant="secondary" onClick={openModal}>
        編輯團訂設定
      </Button>

      {open && (
        <Modal open onClose={() => setOpen(false)} ariaLabel="編輯團訂設定" className="max-w-lg">
          <ModalHeader
            title="編輯團訂設定"
            subtitle="調整套用模板／區塊／單位／團名／截止時間，不會影響大家目前已經點好的餐點。"
            onClose={() => setOpen(false)}
          />
          <div className="space-y-4 overflow-y-auto p-4">
            <Field label="團名">
              <input className={inputClass} value={name} onChange={(e) => setName(e.target.value)} required />
            </Field>

            <Field label="截止時間">
              <input
                className={inputClass}
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                required
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="套用模板">
                <select
                  className={inputClass}
                  value={templateId}
                  onChange={(e) => {
                    const nextTemplateId = e.target.value;
                    setTemplateId(nextTemplateId);
                    setSectionId("");
                  }}
                >
                  {templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.categoryName ? `${t.name}（${t.categoryName}）` : t.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="區塊">
                <select className={inputClass} value={sectionId} onChange={(e) => setSectionId(e.target.value)}>
                  <option value="">（不限區塊，整個模板都能點）</option>
                  {selectedTemplate?.sections.map((sec) => (
                    <option key={sec.id} value={sec.id}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="部門">
                <select
                  className={inputClass}
                  value={departmentId}
                  onChange={(e) => {
                    const nextDeptId = e.target.value;
                    setDepartmentId(nextDeptId);
                    const firstUnit = units.find((u) => u.departmentId === nextDeptId);
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
                <select className={inputClass} value={unitId} onChange={(e) => setUnitId(e.target.value)}>
                  {unitsInDept.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            {error && <p className="text-[13px] lg:text-[14px] text-danger">{error}</p>}

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)} disabled={pending}>
                取消
              </Button>
              <Button type="button" onClick={handleSubmit} disabled={pending}>
                {pending ? "儲存中…" : "儲存變更"}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
}
