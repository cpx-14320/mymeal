"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardBody,
  Field,
  inputClass,
  Button,
} from "@/components/ui/primitives";
import { registerAction, type RegisterState } from "./actions";
import { DEMO_AUTH_KEY } from "@/components/layout/app-shell";
import type { OrgOption, UnitOption } from "@/lib/models/org";

const initialState: RegisterState = {};
const REDIRECT_SECONDS = 3;

interface RegisterFormProps {
  departments: OrgOption[];
  units: UnitOption[];
}

export function RegisterForm({ departments, units }: RegisterFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(registerAction, initialState);
  const [countdown, setCountdown] = useState(REDIRECT_SECONDS);
  const [deptName, setDeptName] = useState("");
  const [unitName, setUnitName] = useState("");

  const selectedDeptId = departments.find((d) => d.name === deptName)?.id;
  const availableUnits = selectedDeptId
    ? units.filter((u) => u.departmentId === selectedDeptId)
    : [];

  useEffect(() => {
    if (!state.success) return;

    try {
      localStorage.setItem(DEMO_AUTH_KEY, "1");
    } catch {
      /* 私密視窗等情況忽略 */
    }

    const tick = setInterval(() => {
      setCountdown((n) => Math.max(0, n - 1));
    }, 1000);
    const redirect = setTimeout(() => {
      router.push("/");
      router.refresh();
    }, REDIRECT_SECONDS * 1000);

    return () => {
      clearInterval(tick);
      clearTimeout(redirect);
    };
  }, [state.success, router]);

  if (state.success) {
    return (
      <div className="mx-auto flex max-w-[600px] flex-col gap-4 px-4 py-16 text-center">
        <h1 className="text-2xl font-bold tracking-tight text-positive">註冊成功</h1>
        {state.memberCode && (
          <p className="text-sm text-ink">
            您的專屬碼：<span className="font-mono font-semibold">{state.memberCode}</span>
          </p>
        )}
        <p className="text-sm text-muted">
          {countdown} 秒後將自動跳轉至首頁…
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-[600px] flex-col gap-6 px-4 py-16">
      <div className="text-center">
        <h1 className="text-2xl font-bold tracking-tight">申請 MyMeal 帳號</h1>
        <p className="mt-1 text-sm text-muted">
          填寫以下資料完成申請，送出後直接可用。
        </p>
      </div>

      <Card>
        <CardBody>
          <form action={formAction} className="space-y-4">
            <Field label="帳號(公司email)">
              <input
                className={inputClass}
                type="email"
                name="email"
                placeholder="you@example.com"
                required
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="密碼">
                <input
                  className={inputClass}
                  type="password"
                  name="password"
                  required
                  minLength={8}
                />
              </Field>
              <Field label="確認密碼">
                <input
                  className={inputClass}
                  type="password"
                  name="confirmPassword"
                  required
                  minLength={8}
                />
              </Field>
              <Field label="姓名">
                <input className={inputClass} name="name" placeholder="請輸入姓名" required />
              </Field>
              <Field label="員工編號">
                <input className={inputClass} name="employeeId" placeholder="A12345" required />
              </Field>
              <Field label="部門">
                <select
                  className={inputClass}
                  name="dept"
                  required
                  value={deptName}
                  onChange={(e) => {
                    setDeptName(e.target.value);
                    setUnitName("");
                  }}
                >
                  <option value="" disabled>
                    請選擇部門
                  </option>
                  {departments.map((d) => (
                    <option key={d.id} value={d.name}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="單位">
                <select
                  className={inputClass}
                  name="unit"
                  required
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  disabled={!deptName}
                >
                  <option value="" disabled>
                    {deptName ? "請選擇單位" : "請先選擇部門"}
                  </option>
                  {availableUnits.map((u) => (
                    <option key={u.id} value={u.name}>
                      {u.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="邀請碼（選填）">
              <input
                className={inputClass}
                name="inviteCode"
                placeholder="請輸入邀請碼"
              />
            </Field>

            {state.error && <p className="text-sm text-danger">{state.error}</p>}

            <Button className="w-full" disabled={pending}>
              {pending ? "送出中…" : "送出申請"}
            </Button>
          </form>
        </CardBody>
      </Card>

      <p className="text-center text-sm text-muted">
        已經有帳號？{" "}
        <Link href="/login" className="font-medium text-brand hover:underline">
          登入
        </Link>
      </p>
    </div>
  );
}
