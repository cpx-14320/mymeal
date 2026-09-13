import {
  Section,
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
} from "@/components/ui/primitives";

export const metadata = { title: "系統設定" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-8">
      <Section title="訂餐規則">
        <Card>
          <CardBody className="grid gap-5 sm:grid-cols-2">
            <Field label="預設截止時間" hint="相對於供應日">
              <select className={inputClass} defaultValue="前一工作日 17:00">
                <option>前一工作日 17:00</option>
                <option>當日 10:00</option>
                <option>當日 10:30</option>
              </select>
            </Field>
            <Field label="未達成團門檻處理">
              <select className={inputClass} defaultValue="自動取消並全額退款">
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
              <input className={inputClass} defaultValue="@company.com" />
            </Field>
            <Field label="開通方式">
              <select className={inputClass} defaultValue="Email 驗證信自助開通">
                <option>Email 驗證信自助開通</option>
                <option>管理員審核後開通</option>
              </select>
            </Field>
          </CardBody>
        </Card>
      </Section>

      <Section title="清單維護">
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm font-medium">部門</p>
              <textarea
                className={`${inputClass} min-h-28`}
                defaultValue={"網路發展部\n設計部\n行政部\n業務部\n資訊部"}
              />
            </CardBody>
          </Card>
          <Card>
            <CardBody className="space-y-2">
              <p className="text-sm font-medium">取餐地點</p>
              <textarea
                className={`${inputClass} min-h-28`}
                defaultValue={"3F 茶水間\n5F 空中花園\n1F 大廳櫃台"}
              />
            </CardBody>
          </Card>
        </div>
      </Section>

      <Section title="公告">
        <Card>
          <CardBody className="space-y-2">
            <textarea
              className={`${inputClass} min-h-24`}
              placeholder="顯示在使用者首頁與菜單頁上方的公告文字"
            />
          </CardBody>
        </Card>
      </Section>

      <div className="flex justify-end">
        <Button>儲存設定</Button>
      </div>

      <p className="text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </div>
  );
}
