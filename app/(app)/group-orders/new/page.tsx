import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
  ButtonLink,
  Badge,
  Note,
} from "@/components/ui/primitives";
import {
  templates,
  templateById,
  templateKindLabel,
  supplierById,
  itemById,
} from "@/lib/mock";

export const metadata = { title: "開團" };

// 預覽用：預設帶「標準便當週 / 星期三」
const defaultTemplate = templateById("t1")!;
const defaultSection = defaultTemplate.sections[2];

export default function NewGroupOrderPage() {
  return (
    <PageContainer>
      <PageHeader
        title="開團"
        description="選一個模板與分類，品項會自動帶入，可為這個團調整。"
      />

      {/* 步驟 1：開團設定 */}
      <Card>
        <CardBody className="space-y-5">
          <p className="text-sm font-semibold text-muted">1 · 開團設定</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="團名" hint="讓同事看得懂是哪一團">
              <input className={inputClass} placeholder="例：三樓週三團" />
            </Field>
            <Field label="截止時間">
              <input className={inputClass} type="datetime-local" />
            </Field>
          </div>
          <Field label="備註">
            <textarea
              className={`${inputClass} min-h-24`}
              placeholder="例：11:50 前請到 3F 取餐；不吃辣的請在品項備註註明。"
            />
          </Field>
        </CardBody>
      </Card>

      {/* 步驟 2：選模板 */}
      <Card>
        <CardBody className="space-y-5">
          <p className="text-sm font-semibold text-muted">2 · 選模板</p>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="模板">
              <select className={inputClass} defaultValue={defaultTemplate.id}>
                {templates
                  .filter((t) => t.active)
                  .map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}（{templateKindLabel[t.kind]}）
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="分類">
              <select className={inputClass} defaultValue={defaultSection.id}>
                {defaultTemplate.sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <p className="text-xs text-muted">
            也可以不選模板，開一個「臨時團」直接加品項。
          </p>
        </CardBody>
      </Card>

      {/* 步驟 3：這個團的品項 */}
      <Card>
        <CardBody className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-muted">
              3 · 這個團的品項
            </p>
            <Badge>
              來自「{defaultTemplate.name} / {defaultSection.name}」
            </Badge>
          </div>

          <Note>換掉的品項只影響這個團，不會改到模板。</Note>

          <ul className="divide-y divide-line rounded-lg border border-line">
            {defaultSection.itemIds.map((iid) => {
              const it = itemById(iid);
              if (!it) return null;
              return (
                <li
                  key={iid}
                  className="flex items-center justify-between gap-3 px-3 py-2.5"
                >
                  <span className="flex items-center gap-2">
                    <span>{it.emoji}</span>
                    <span className="font-medium">{it.name}</span>
                    <span className="text-xs text-muted">
                      {supplierById(it.supplierId)?.name}
                    </span>
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="text-sm tabular-nums text-muted">
                      NT$ {it.price}
                    </span>
                    <button className="text-muted hover:text-danger">移除</button>
                  </span>
                </li>
              );
            })}
          </ul>
          <Button variant="secondary" size="sm">
            ＋ 從品項加入
          </Button>
        </CardBody>
      </Card>

      <div className="flex justify-end gap-2">
        <ButtonLink href="/group-orders" variant="ghost">
          取消
        </ButtonLink>
        <Button variant="secondary">存成草稿</Button>
        <Button>發佈開團</Button>
      </div>

      <p className="text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </PageContainer>
  );
}
