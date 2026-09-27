"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { DismissibleNote } from "@/components/ui/primitives";

/** 新增成功、導到這筆資料自己的編輯頁時共用的提示——網址帶 ?created=1 進來就跳一次
 *  「已建立成功」，並把這個參數從網址列拿掉，避免重新整理又跳出一次。
 *  給模板/頁面/通知/會員/組別/廣告這類「新增後導去它自己的編輯頁」共用，不用每個編輯頁各自重寫一次。
 *  沒有 created=1（例如 /new 表單本身、或一般造訪編輯頁）就完全不渲染任何東西。 */
export function CreatedBanner({ message = "已建立成功，可以繼續編輯以下內容。" }: { message?: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const justCreated = searchParams.get("created") === "1";
  const [show, setShow] = useState(justCreated);

  useEffect(() => {
    if (!justCreated) return;
    const params = new URLSearchParams(searchParams);
    params.delete("created");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!show) return null;
  return (
    <DismissibleNote tone="positive" onClose={() => setShow(false)}>
      <p>{message}</p>
    </DismissibleNote>
  );
}
