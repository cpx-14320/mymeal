"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import { REGISTER_HREF } from "./nav";
import { loginAction, type LoginState } from "@/app/login/actions";

const initialState: LoginState = {};

export function LoginModal({
  open,
  onClose,
  onLoginSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  // Modal 關閉時 <Modal> 直接回傳 null（整個卸載），重新打開會重新掛載，
  // useActionState 也會跟著回到 initialState，不用手動清狀態。
  useEffect(() => {
    if (state.success) {
      onLoginSuccess();
      onClose();
      router.refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.success]);

  return (
    <Modal open={open} onClose={onClose} ariaLabel="登入 MyMeal" className="max-w-sm">
      <ModalHeader
        title="登入 MyMeal"
        subtitle="請使用公司 Email 登入。"
        onClose={onClose}
      />
      <div className="space-y-4 overflow-y-auto p-4">
        <form action={formAction} className="space-y-4">
          <Field label="帳號">
            <input
              className={inputClass}
              type="text"
              name="email"
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
            <Link href="/login" className="text-brand hover:underline" onClick={onClose}>
              忘記密碼？
            </Link>
          </div>

          {state.error && <p className="text-sm text-danger">{state.error}</p>}

          <Button className="w-full" disabled={pending}>
            {pending ? "登入中…" : "登入"}
          </Button>
        </form>
        <p className="text-center text-sm text-muted">
          還沒有帳號？{" "}
          <Link
            href={REGISTER_HREF}
            className="font-medium text-brand hover:underline"
            onClick={onClose}
          >
            申請帳號
          </Link>
        </p>
      </div>
    </Modal>
  );
}
