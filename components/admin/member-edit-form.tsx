"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
  ButtonLink,
} from "@/components/ui/primitives";
import { updateMemberAction, type UpdateMemberState } from "@/app/(app)/admin/members/[id]/actions";
import type { MemberListItem } from "@/lib/models/member";
import type { OrgOption, UnitOption } from "@/lib/models/org";

const initialState: UpdateMemberState = {};

interface MemberEditFormProps {
  member: MemberListItem;
  departments: OrgOption[];
  units: UnitOption[];
  roleNames: string[];
}

/** 編輯真實會員用的表單（跟 /admin/members/new 的假資料表單分開，欄位/選項對應真的 member schema）。 */
export function MemberEditForm({ member, departments, units, roleNames }: MemberEditFormProps) {
  const router = useRouter();
  const action = updateMemberAction.bind(null, member.id);
  const [state, formAction, pending] = useActionState(action, initialState);
  const [deptName, setDeptName] = useState(member.dept);
  const [unitName, setUnitName] = useState(member.unit);
  const [password, setPassword] = useState("");
  const [lastHandledState, setLastHandledState] = useState(state);

  const selectedDeptId = departments.find((d) => d.name === deptName)?.id;
  const availableUnits = units.filter((u) => u.departmentId === selectedDeptId);
  // 萬一現有會員的單位跟目前選的部門對不上（舊資料/部門被改過），保留原值當選項，避免存檔時被悄悄改掉。
  const unitOptions = availableUnits.some((u) => u.name === unitName)
    ? availableUnits
    : unitName
      ? [{ id: "__current__", name: unitName, departmentId: "", departmentName: "" }, ...availableUnits]
      : availableUnits;

  // 存檔成功後清空密碼欄位，用「渲染時比對上次處理過的 state」而非 effect 內 setState，避免多一輪 cascading render。
  if (state !== lastHandledState) {
    setLastHandledState(state);
    if (state.success) setPassword("");
  }

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="員工編號">
              <input
                className={inputClass}
                name="employeeId"
                defaultValue={member.employeeId}
                required
              />
            </Field>

            <Field label="姓名">
              <input
                className={inputClass}
                name="name"
                defaultValue={member.name}
                required
              />
            </Field>

            <Field label="帳號(公司email)">
              <input
                className={inputClass}
                type="email"
                name="email"
                defaultValue={member.email}
                required
              />
            </Field>

            <Field label="專屬碼">
              <input
                className={`${inputClass} font-mono`}
                defaultValue={member.memberCode || "—"}
                readOnly
                disabled
              />
            </Field>

            <Field label="推薦人">
              <input
                className={inputClass}
                defaultValue={
                  member.referredByName
                    ? `${member.referredByName}（${member.referredByCode}）`
                    : "—"
                }
                readOnly
                disabled
              />
            </Field>

            <Field label="部門">
              <select
                className={inputClass}
                name="dept"
                value={deptName}
                onChange={(e) => {
                  setDeptName(e.target.value);
                  setUnitName("");
                }}
                required
              >
                {departments.map((d) => (
                  <option key={d.id} value={d.name}>
                    {d.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="單位">
              <select
                className={inputClass}
                name="unit"
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                required
              >
                <option value="" disabled>
                  請選擇單位
                </option>
                {unitOptions.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="權限">
              <select
                className={inputClass}
                name="role"
                defaultValue={member.role ?? roleNames[0]}
                required
              >
                {roleNames.map((r) => (
                  <option key={r}>{r}</option>
                ))}
              </select>
            </Field>

            <Field label="重設密碼" hint="留空則不修改密碼">
              <input
                className={inputClass}
                type="password"
                name="password"
                placeholder="留空則不修改"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="active"
                defaultChecked={member.status === "active"}
              />
              啟用（可登入使用）
            </label>
          </div>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
          {state.success && <p className="text-[13px] lg:text-[14px] text-positive">已儲存變更。</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/members" variant="ghost">
          返回列表
        </ButtonLink>
        <Button disabled={pending}>{pending ? "儲存中…" : "儲存"}</Button>
      </div>
    </form>
  );
}
