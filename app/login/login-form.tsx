"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
} from "@/components/ui/primitives";
import { loginAction, type LoginState } from "./actions";
import { DEMO_AUTH_KEY } from "@/components/layout/app-shell";

const initialState: LoginState = {};

export function LoginForm() {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  useEffect(() => {
    if (state.success) {
      try {
        localStorage.setItem(DEMO_AUTH_KEY, "1");
      } catch {
        /* 私密視窗等情況忽略 */
      }
      router.push("/");
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">登入 MyMeal</h1>
        <p className="mt-1 text-sm text-muted">請使用公司 Email 登入。</p>
      </div>

      <Card>
        <CardBody>
          <form action={formAction} className="space-y-4">
            <Field label="公司 Email">
              <input
                className={inputClass}
                type="email"
                name="email"
                placeholder="you@company.com"
                required
              />
            </Field>
            <Field label="密碼">
              <input
                className={inputClass}
                type="password"
                name="password"
                placeholder="••••••••"
                required
              />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" name="remember" /> 記住我
              </label>
              <Link href="/login" className="text-brand hover:underline">
                忘記密碼？
              </Link>
            </div>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button className="w-full" disabled={pending}>
              {pending ? "登入中…" : "登入"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-muted">
        還沒有帳號？{" "}
        <Link href="/register" className="font-medium text-brand hover:underline">
          申請帳號
        </Link>
      </p>
    </div>
  );
}
