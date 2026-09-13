import type { Metadata } from "next";
import Link from "next/link";
import {
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
} from "@/components/ui/primitives";

export const metadata: Metadata = { title: "登入" };

export default function LoginPage() {
  return (
    <div className="mx-auto flex max-w-sm flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">登入 MyMeal</h1>
        <p className="mt-1 text-sm text-muted">請使用公司 Email 登入。</p>
      </div>

      <Card>
        <CardBody className="space-y-4">
          <Field label="公司 Email">
            <input className={inputClass} type="email" placeholder="you@company.com" />
          </Field>
          <Field label="密碼">
            <input className={inputClass} type="password" placeholder="••••••••" />
          </Field>
          <div className="flex items-center justify-between text-sm">
            <label className="flex items-center gap-2 text-muted">
              <input type="checkbox" /> 記住我
            </label>
            <Link href="/login" className="text-brand hover:underline">
              忘記密碼？
            </Link>
          </div>
          <Button className="w-full">登入</Button>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-muted">
        還沒有帳號？{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          申請帳號
        </Link>
      </p>
      <p className="text-center text-xs text-muted">＊此頁為介面預覽，尚未串接登入。</p>
    </div>
  );
}
