"use client";

import { useActionState, useState } from "react";
import { Card, CardBody, Field, inputClass, Button, ButtonLink } from "@/components/ui/primitives";
import { createMemberAction, type CreateMemberState } from "@/app/(app)/admin/members/new/actions";
import type { OrgOption, UnitOption } from "@/lib/models/org";

const initialState: CreateMemberState = {};

interface MemberCreateFormProps {
  departments: OrgOption[];
  units: UnitOption[];
  roleNames: string[];
}

/** 新增會員用的表單：部門/單位/權限選項都來自真實的 org / role collection，送出後直接寫進 member。 */
export function MemberCreateForm({ departments, units, roleNames }: MemberCreateFormProps) {
  const [state, formAction, pending] = useActionState(createMemberAction, initialState);
  const [deptName, setDeptName] = useState("");
  const [unitName, setUnitName] = useState("");

  const selectedDeptId = departments.find((d) => d.name === deptName)?.id;
  const availableUnits = selectedDeptId
    ? units.filter((u) => u.departmentId === selectedDeptId)
    : [];

  return (
    <form action={formAction}>
      <Card>
        <CardBody className="space-y-5">
          <Field label="帳號" hint="4-20 碼英數字，第一碼須為英文字母，不分大小寫">
            <input
              className={inputClass}
              type="text"
              name="email"
              required
              minLength={4}
              maxLength={20}
              pattern="[A-Za-z][A-Za-z0-9]{3,19}"
            />
          </Field>

          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="密碼" hint="8-20 碼，需同時包含英文字母與數字，可加常見符號">
              <input
                className={inputClass}
                type="password"
                name="password"
                required
                minLength={8}
                maxLength={20}
              />
            </Field>

            <Field label="確認密碼">
              <input
                className={inputClass}
                type="password"
                name="confirmPassword"
                required
                minLength={8}
                maxLength={20}
              />
            </Field>

            <Field label="姓名" hint="2-20 個中文或英文字">
              <input className={inputClass} name="name" required minLength={2} maxLength={20} />
            </Field>

            <Field label="員工編號" hint="4-20 碼英數字">
              <input
                className={inputClass}
                name="employeeId"
                required
                minLength={4}
                maxLength={20}
                pattern="[A-Za-z0-9]{4,20}"
              />
            </Field>

            <Field label="部門">
              <select
                className={inputClass}
                name="dept"
                required
                value={deptName}
                onChange={(e) => {
                  setDeptName(e.target.value);
                  setUnitName("");
                }}
              >
                <option value="" disabled>
                  請選擇部門
                </option>
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
                required
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                disabled={!deptName}
              >
                <option value="" disabled>
                  {deptName ? "請選擇單位" : "請先選擇部門"}
                </option>
                {availableUnits.map((u) => (
                  <option key={u.id} value={u.name}>
                    {u.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="邀請碼（選填）" hint="4-20 碼；填對某位會員的專屬碼會記為推薦人，權限請直接用下面的「權限」欄位設定">
            <input className={inputClass} name="inviteCode" minLength={4} maxLength={20} />
          </Field>

          <Field label="權限">
            <select className={inputClass} name="role" defaultValue={roleNames[0]} required>
              {roleNames.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>

          <div>
            <span className="mb-1.5 block text-sm font-medium">狀態</span>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="active" defaultChecked />
              啟用（可登入使用）
            </label>
          </div>

          {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
        </CardBody>
      </Card>

      <div className="mt-4 flex justify-end gap-2">
        <ButtonLink href="/admin/members" variant="ghost">
          取消
        </ButtonLink>
        <Button disabled={pending}>{pending ? "建立中…" : "建立會員"}</Button>
      </div>
    </form>
  );
}
