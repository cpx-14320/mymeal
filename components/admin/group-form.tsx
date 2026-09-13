import { Card, CardBody, Field, inputClass } from "@/components/ui/primitives";
import {
  permissionGroups,
  type MemberGroup,
  type PermissionLevel,
} from "@/lib/mock";

const levelLabel: Record<PermissionLevel, string> = {
  none: "無",
  own: "僅限自己",
  full: "具備",
};

/** 新增 / 編輯組別共用的表單。傳 group 就是編輯模式（欄位帶入現值）。 */
export function GroupForm({ group }: { group?: MemberGroup }) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <Field label="組別名稱">
          <input
            className={inputClass}
            defaultValue={group?.name}
            placeholder="例：客服管理員"
          />
        </Field>

        <div>
          <span className="mb-1.5 block text-sm font-medium">權限</span>
          <p className="mb-2 text-xs text-muted">
            這個組別可以使用的權限；套用這個組別的會員都會套用同一份設定。
          </p>
          <div className="divide-y divide-line rounded-lg border border-line">
            {permissionGroups.map((p) => (
              <div
                key={p.key}
                className="flex items-center justify-between gap-4 px-3 py-2.5"
              >
                <span className="font-mono text-xs text-muted">
                  {p.label}
                </span>
                <select
                  className={`${inputClass} w-32`}
                  defaultValue={group?.permissions[p.key] ?? "none"}
                >
                  {(Object.keys(levelLabel) as PermissionLevel[]).map((lv) => (
                    <option key={lv} value={lv}>
                      {levelLabel[lv]}
                    </option>
                  ))}
                </select>
              </div>
            ))}
          </div>
        </div>
      </CardBody>
    </Card>
  );
}
