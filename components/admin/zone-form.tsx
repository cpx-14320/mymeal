import {
  Card,
  CardBody,
  Field,
  Badge,
  inputClass,
} from "@/components/ui/primitives";
import { templates, templateKindLabel, type OrderZone } from "@/lib/mock";

/** 新增 / 編輯訂餐專區共用的表單。傳 zone 就是編輯模式。 */
export function ZoneForm({ zone }: { zone?: OrderZone }) {
  return (
    <Card>
      <CardBody className="space-y-5">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="專區名稱">
            <input
              className={inputClass}
              defaultValue={zone?.name}
              placeholder="例：下午茶"
            />
          </Field>
          <Field label="代稱 slug" hint="前台網址：/z/{slug}">
            <input
              className={inputClass}
              defaultValue={zone?.slug}
              placeholder="afternoon-tea"
            />
          </Field>
        </div>

        <Field label="說明">
          <textarea
            className={`${inputClass} min-h-20`}
            defaultValue={zone?.description}
            placeholder="顯示在專區頁上方"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="圖示 emoji">
            <input
              className={inputClass}
              maxLength={4}
              defaultValue={zone?.icon}
              placeholder="🧋"
            />
          </Field>
          <Field label="排序" hint="數字小的排前面">
            <input
              className={inputClass}
              type="number"
              min={1}
              defaultValue={zone?.sortOrder ?? 1}
            />
          </Field>
        </div>

        <div>
          <span className="mb-1 block text-sm font-medium">套用的模板</span>
          <p className="mb-2 text-xs text-muted">
            可勾選多個；同一個模板也能被其他專區共用。
          </p>
          <div className="space-y-2.5 rounded-lg border border-line p-3">
            {templates.map((t) => (
              <label
                key={t.id}
                className="flex flex-wrap items-center gap-2 text-sm"
              >
                <input
                  type="checkbox"
                  defaultChecked={zone?.templateIds.includes(t.id) ?? false}
                />
                <span className="font-medium">{t.name}</span>
                <Badge>{templateKindLabel[t.kind]}</Badge>
                <span className="text-xs text-muted">
                  {t.sections.length} 分類．
                  {t.sections.reduce((n, s) => n + s.itemIds.length, 0)} 品項
                </span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <span className="mb-1.5 block text-sm font-medium">狀態</span>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" defaultChecked={zone?.active ?? true} />
            上架（前台可見、可開團）
          </label>
        </div>
      </CardBody>
    </Card>
  );
}
