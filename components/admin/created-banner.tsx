"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DismissibleNote } from "@/components/ui/primitives";

/** 新增（或其他一次性動作）成功、導回列表頁／編輯頁時共用的提示——網址帶 ?{param}=1 進來就跳一次
 *  成功訊息，並把這個參數從網址列拿掉，避免重新整理又跳出一次。
 *  給模板/頁面/通知/會員/組別/廣告這類「動作完成後導頁」共用，不用每個頁面各自重寫一次。
 *  param 預設 "created"；會員編輯完導回列表頁那種非新增的情境，呼叫端可以傳 param="updated" 共用同一套邏輯。
 *  沒有 {param}=1（例如 /new 表單本身、或一般造訪列表/編輯頁）就完全不渲染任何東西。 */
export function CreatedBanner({
  message = "已建立成功，可以繼續編輯以下內容。",
  param = "created",
}: {
  message?: string;
  param?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const justHappened = searchParams.get(param) === "1";
  const [show, setShow] = useState(justHappened);

  useEffect(() => {
    if (!justHappened) return;
    const params = new URLSearchParams(searchParams);
    params.delete(param);
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;
  return (
    <DismissibleNote tone="positive" onClose={() => setShow(false)} autoDismissMs={5000}>
      <p>{message}</p>
    </DismissibleNote>
  );
}
