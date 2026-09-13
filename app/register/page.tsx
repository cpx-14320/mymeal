import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
  Note,
} from "@/components/ui/primitives";

export const metadata: Metadata = { title: "申請帳號" };

export default function RegisterPage() {
  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">申請 MyMeal 帳號</h1>
        <p className="mt-1 text-sm text-muted">
          僅開放公司 Email（@company.com）申請。
        </p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <Field label="公司 Email">
            <input className={inputClass} type="email" placeholder="you@company.com" />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="密碼">
              <input className={inputClass} type="password" />
            </Field>
            <Field label="確認密碼">
              <input className={inputClass} type="password" />
            </Field>
            <Field label="姓名">
              <input className={inputClass} placeholder="林佩珊" />
            </Field>
            <Field label="分機">
              <input className={inputClass} placeholder="2317" />
            </Field>
            <Field label="部門">
              <input className={inputClass} placeholder="網路發展部" />
            </Field>
            <Field label="員工編號">
              <input className={inputClass} placeholder="A12345" />
            </Field>
          </div>

          <Note>送出後需經 Email 驗證或管理員審核開通，才能開始使用。</Note>

          <Button className="w-full">送出申請</Button>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-muted">
        已經有帳號？{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          登入
        </Link>
      </p>
      <p className="text-center text-xs text-muted">＊此頁為介面預覽，尚未串接註冊。</p>
    </div>
  );
}
