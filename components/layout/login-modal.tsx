"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import { loginAction, type LoginState } from "@/app/login/actions";
import { registerAction, type RegisterState } from "@/app/register/actions";
import type { OrgOption, UnitOption } from "@/lib/models/org";
import type { LoginModalMode } from "./login-modal-context";

const loginInitialState: LoginState = {};
const registerInitialState: RegisterState = {};

/** 登入／申請帳號共用同一個彈窗，用 mode 切換內容——訪客做了需要登入的動作觸發時，
 *  不管要登入還是申請新帳號都在同一個彈窗內完成，不用跳轉到獨立頁面。
 *  AppShell 只在 open 時才掛載這個元件，關閉時整個卸載——重新打開一定是全新的
 *  mode / 表單狀態，不用手動重置。 */
export function LoginModal({
  open,
  onClose,
  onLoginSuccess,
  departments,
  units,
  initialMode,
}: {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
  departments: OrgOption[];
  units: UnitOption[];
  initialMode: LoginModalMode;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<LoginModalMode>(initialMode);
  const [loginState, loginFormAction, loginPending] = useActionState(loginAction, loginInitialState);
  const [registerState, registerFormAction, registerPending] = useActionState(
    registerAction,
    registerInitialState,
  );
  const [deptName, setDeptName] = useState("");
  const [unitName, setUnitName] = useState("");

  const selectedDeptId = departments.find((d) => d.name === deptName)?.id;
  const availableUnits = selectedDeptId ? units.filter((u) => u.departmentId === selectedDeptId) : [];

  useEffect(() => {
    if (loginState.success) {
      onLoginSuccess();
      onClose();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loginState.success]);

  useEffect(() => {
    if (registerState.success) {
      onLoginSuccess();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerState.success]);

  function handleClose() {
    onClose();
    if (registerState.success) router.refresh();
  }

  const title = mode === "login" ? "登入 MyMeal" : "申請 MyMeal 帳號";
  const subtitle =
    mode === "login" ? "請使用公司 Email 登入。" : "填寫以下資料完成申請，送出後直接可用。";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      ariaLabel={title}
      className={mode === "login" ? "max-w-sm" : "max-w-lg"}
    >
      <ModalHeader title={title} subtitle={subtitle} onClose={handleClose} />

      {mode === "register" && registerState.success ? (
        <div className="space-y-3 overflow-y-auto p-4 text-center">
          <p className="text-lg font-bold text-positive">註冊成功</p>
          {registerState.memberCode && (
            <p className="text-sm text-ink">
              您的專屬碼：<span className="font-mono font-semibold">{registerState.memberCode}</span>
            </p>
          )}
          <Button className="w-full" onClick={handleClose}>
            完成
          </Button>
        </div>
      ) : mode === "login" ? (
        <div className="space-y-4 overflow-y-auto p-4">
          <form action={loginFormAction} className="space-y-4">
            <Field label="帳號">
              <input className={inputClass} type="text" name="email" required />
            </Field>
            <Field label="密碼">
              <input
                className={inputClass}
                type="password"
                name="password"
                required
              />
            </Field>
            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 text-muted">
                <input type="checkbox" name="remember" /> 記住我
              </label>
              <button type="button" className="text-brand hover:underline">
                忘記密碼？
              </button>
            </div>

            {loginState.error && <p className="text-sm text-danger">{loginState.error}</p>}

            <Button className="w-full" disabled={loginPending}>
              {loginPending ? "登入中…" : "登入"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted">
            還沒有帳號？{" "}
            <button
              type="button"
              className="font-medium text-brand hover:underline"
              onClick={() => setMode("register")}
            >
              申請帳號
            </button>
          </p>
        </div>
      ) : (
        <div className="space-y-4 overflow-y-auto p-4">
          <form action={registerFormAction} className="space-y-4">
            <Field label="帳號">
              <input className={inputClass} type="text" name="email" required />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="密碼">
                <input className={inputClass} type="password" name="password" required minLength={8} />
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
                <input className={inputClass} name="name" required />
              </Field>
              <Field label="員工編號">
                <input className={inputClass} name="employeeId" required />
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
              <input className={inputClass} name="inviteCode" />
            </Field>

            {registerState.error && <p className="text-sm text-danger">{registerState.error}</p>}

            <Button className="w-full" disabled={registerPending}>
              {registerPending ? "送出中…" : "送出申請"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted">
            已經有帳號？{" "}
            <button
              type="button"
              className="font-medium text-brand hover:underline"
              onClick={() => setMode("login")}
            >
              登入
            </button>
          </p>
        </div>
      )}
    </Modal>
  );
}
