"use client";

import { useActionState, useState } from "react";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { Field, inputClass, Button } from "@/components/ui/primitives";
import { changePasswordAction, type ChangePasswordState } from "@/app/(app)/account/actions";

const initialState: ChangePasswordState = {};

function ChangePasswordForm({ onClose }: { onClose: () => void }) {
  const [state, formAction, pending] = useActionState(changePasswordAction, initialState);

  if (state.success) {
    return (
      <div className="space-y-3 p-4 text-center">
        <p className="font-semibold text-positive">密碼已更新</p>
        <Button className="w-full" onClick={onClose}>
          完成
        </Button>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4 p-4">
      <Field label="目前密碼">
        <input className={inputClass} type="password" name="oldPassword" required />
      </Field>
      <Field label="新密碼" hint="8-20 碼，需同時包含英文字母與數字，可加常見符號">
        <input
          className={inputClass}
          type="password"
          name="newPassword"
          required
          minLength={8}
          maxLength={20}
        />
      </Field>
      <Field label="確認新密碼">
        <input
          className={inputClass}
          type="password"
          name="confirmNewPassword"
          required
          minLength={8}
          maxLength={20}
        />
      </Field>
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <Button className="w-full" disabled={pending}>
        {pending ? "更新中…" : "更新密碼"}
      </Button>
    </form>
  );
}

/** 會員中心用：登入狀態下自行改密碼。彈窗跟 login-modal 一樣只在 open 時掛載內容，
 *  關閉後整個卸載，下次打開 useActionState 一定是全新狀態，不用手動重置表單。 */
export function AccountChangePasswordModal() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        修改密碼
      </Button>
      {open && (
        <Modal open={open} onClose={close} ariaLabel="修改密碼" className="max-w-sm">
          <ModalHeader title="修改密碼" onClose={close} />
          <ChangePasswordForm onClose={close} />
        </Modal>
      )}
    </>
  );
}
