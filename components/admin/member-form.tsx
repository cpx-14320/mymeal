import { Card, CardBody, Field, inputClass } from "@/components/ui/primitives";
import { ImageField } from "@/components/admin/image-field";
import { memberDepts, memberUnits, memberRoles, type Member } from "@/lib/mock";

/** 新增 / 編輯會員共用的表單。傳 member 就是編輯模式（欄位帶入現值）。 */
export function MemberForm({ member }: { member?: Member }) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <ImageField
          label="頭像"
          defaultPath={member?.avatarUrl}
          fallbackEmoji="👤"
          placeholder="/uploads/avatars/xxx.jpg 或完整網址"
        />

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="員工編號">
            <input
              className={inputClass}
              defaultValue={member?.employeeId}
              placeholder="例：E010001"
            />
          </Field>

          <Field label="姓名">
            <input
              className={inputClass}
              defaultValue={member?.name}
              placeholder="例：林佩珊"
            />
          </Field>

          <Field label="公司Email">
            <input
              className={inputClass}
              type="email"
              defaultValue={member?.email}
              placeholder="user1@company.com"
            />
          </Field>

          <Field label="部門">
            <select className={inputClass} defaultValue={member?.dept ?? ""}>
              <option value="" disabled>
                選擇部門
              </option>
              {memberDepts.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </Field>

          <Field label="單位">
            <select className={inputClass} defaultValue={member?.unit ?? ""}>
              <option value="" disabled>
                選擇單位
              </option>
              {memberUnits.map((u) => (
                <option key={u}>{u}</option>
              ))}
            </select>
          </Field>

          <Field label="權限">
            <select className={inputClass} defaultValue={member?.role ?? memberRoles[0]}>
              {memberRoles.map((r) => (
                <option key={r}>{r}</option>
              ))}
            </select>
          </Field>

          <Field label="修改帳號">
            <input
              className={inputClass}
              defaultValue={member?.account}
              placeholder="例：user1"
            />
          </Field>

          <Field
            label="修改密碼"
            hint={member ? "留空則不修改密碼" : undefined}
          >
            <input
              className={inputClass}
              type="password"
              placeholder={member ? "留空則不修改" : "設定初始密碼"}
            />
          </Field>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">狀態</span>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              defaultChecked={member ? member.status === "active" : true}
            />
            啟用（可登入使用）
          </label>
        </div>
      </CardBody>
    </Card>
  );
}
