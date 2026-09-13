"use client";

import Link from "next/link";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import { REGISTER_HREF } from "./nav";

export function LoginModal({
  open,
  onClose,
  onLoginSuccess,
}: {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: () => void;
}) {
  return (
    <Modal open={open} onClose={onClose} ariaLabel="登入 MyMeal" className="max-w-sm">
      <ModalHeader
        title="登入 MyMeal"
        subtitle="請使用公司 Email 登入。"
        onClose={onClose}
      />
      <div className="space-y-4 overflow-y-auto p-4">
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
          <Link href="/login" className="text-brand hover:underline" onClick={onClose}>
            忘記密碼？
          </Link>
        </div>
        <Button
          className="w-full"
          onClick={() => {
            onLoginSuccess();
            onClose();
          }}
        >
          登入
        </Button>
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
        <p className="text-center text-xs text-muted">＊此為介面預覽，尚未串接登入。</p>
      </div>
    </Modal>
  );
}
