"use client";

import { useActionState } from "react";
import { Section, Card, CardBody, Field, inputClass, Button } from "@/components/ui/primitives";
import type { SettingsView } from "@/lib/models/settings";
import { updateSettingsAction, type SettingsActionState } from "@/app/(app)/admin/settings/actions";

const initialState: SettingsActionState = {};

export function SettingsForm({ settings }: { settings: SettingsView }) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, initialState);

  return (
    <form action={formAction} className="space-y-8">
      <Section>
        <Section title="訂餐規則">
          <Card>
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <Field label="預設截止時間" hint="相對於供應日">
                <select
                  className={inputClass}
                  name="orderDeadlineDefault"
                  defaultValue={settings.orderDeadlineDefault}
                >
                  <option>前一工作日 17:00</option>
                  <option>當日 10:00</option>
                  <option>當日 10:30</option>
                </select>
              </Field>
              <Field label="未達成團門檻處理">
                <select className={inputClass} name="underMinPolicy" defaultValue={settings.underMinPolicy}>
                  <option>自動取消並全額退款</option>
                  <option>保留由團主決定</option>
                </select>
              </Field>
            </CardBody>
          </Card>
        </Section>

        <Section title="帳號">
          <Card>
            <CardBody className="grid gap-5 sm:grid-cols-2">
              <Field label="Email 網域白名單" hint="以逗號分隔">
                <input className={inputClass} name="emailWhitelist" defaultValue={settings.emailWhitelist} />
              </Field>
              <Field label="開通方式">
                <select className={inputClass} name="activationMethod" defaultValue={settings.activationMethod}>
                  <option>Email 驗證信自助開通</option>
                  <option>管理員審核後開通</option>
                </select>
              </Field>
            </CardBody>
          </Card>
        </Section>

        <Section title="清單維護" description="部門請到「部門與單位」頁管理，這裡只放還沒有獨立管理頁面的清單。">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm font-medium">取餐地點</p>
              <textarea
                className={`${inputClass} min-h-28`}
                name="pickupLocations"
                defaultValue={settings.pickupLocations.join("\n")}
                placeholder={"3F 茶水間\n5F 空中花園\n1F 大廳櫃台"}
              />
            </CardBody>
          </Card>
        </Section>

        <Section title="公告" description="顯示在全站頁面最上方的公告文字，留空就不顯示。">
          <Card>
            <CardBody className="space-y-2">
              <textarea
                className={`${inputClass} min-h-24`}
                name="announcement"
                defaultValue={settings.announcement}
                placeholder="顯示在使用者首頁與菜單頁上方的公告文字"
              />
            </CardBody>
          </Card>
        </Section>
      </Section>

      {state.error && <p className="text-[13px] lg:text-[14px] text-danger">{state.error}</p>}
      {state.success && <p className="text-[13px] lg:text-[14px] text-positive">已儲存。</p>}

      <div className="flex justify-end">
        <Button disabled={pending}>{pending ? "儲存中…" : "儲存設定"}</Button>
      </div>
    </form>
  );
}
