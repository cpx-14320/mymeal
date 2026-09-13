import type { Metadata } from "next";
import {
  PageContainer,
  PageHeader,
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
} from "@/components/ui/primitives";

export const metadata: Metadata = { title: "意見回饋" };

export default function FeedbackPage() {
  return (
    <PageContainer>
      <PageHeader
        title="意見回饋"
        description="使用上有問題或建議？告訴我們。"
      />
      <Card>
        <CardBody className="space-y-4">
          <Field label="類型">
            <select className={inputClass} defaultValue="功能建議">
              <option>功能建議</option>
              <option>操作問題</option>
              <option>餐點 / 餐廳問題</option>
              <option>錢包 / 儲值問題</option>
              <option>其他</option>
            </select>
          </Field>
          <Field label="內容">
            <textarea
              className={`${inputClass} min-h-32`}
              placeholder="請描述你遇到的情況或建議…"
            />
          </Field>
          <div className="flex justify-end">
            <Button>送出</Button>
          </div>
        </CardBody>
      </Card>
      <p className="text-xs text-muted">＊此頁為介面預覽，表單尚未串接後端。</p>
    </PageContainer>
  );
}
