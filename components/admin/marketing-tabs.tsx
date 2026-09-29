"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink, PillTabs, DismissibleNote } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { PromosList } from "@/components/admin/promos-list";
import { NotificationsList } from "@/components/admin/notifications-list";
import type { InterstitialView } from "@/lib/models/interstitial";
import type { NotificationView } from "@/lib/models/notification";

type Tab = "promos" | "notifications";
type Message = { tone: "positive" | "danger"; text: string };

/**
 * 蓋台廣告跟通知訊息都是「前台廣宣版位」的一種，合併成一頁用 tabs 切換——
 * 蓋台廣告固定只有一個版位（進站蓋版），通知訊息之後會陸續增加，各自的清單/表單邏輯不變，
 * 這裡只負責切換要顯示哪一個清單、跟頂部「新增」按鈕要連去哪裡。
 */
export function MarketingTabs({
  promos,
  notifications,
  justCreated = false,
}: {
  promos: InterstitialView[];
  notifications: NotificationView[];
  /** 新增廣告存檔後帶著 ?created=1 導回這頁——跟品項設定同一套邏輯，新增／刪除共用同一個
   *  訊息槽，同一時間只會顯示一則狀態框。 */
  justCreated?: boolean;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("promos");
  const [message, setMessage] = useState<Message | null>(
    justCreated ? { tone: "positive", text: "新增廣告成功。" } : null,
  );

  useEffect(() => {
    if (justCreated) router.replace("/admin/promos");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {message && (
        <DismissibleNote tone={message.tone} onClose={() => setMessage(null)} autoDismissMs={3000}>
          <p>{message.text}</p>
        </DismissibleNote>
      )}

      <AdminHeaderActions>
        {tab === "promos" ? (
          <ButtonLink href="/admin/promos/new" size="sm">新增廣告</ButtonLink>
        ) : (
          <ButtonLink href="/admin/notifications/new" size="sm">新增通知</ButtonLink>
        )}
      </AdminHeaderActions>

      <PillTabs
        tabs={[
          { key: "promos", label: "蓋台廣告", count: promos.length },
          { key: "notifications", label: "通知訊息", count: notifications.length },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "promos" ? (
        <PromosList promos={promos} onMessage={setMessage} />
      ) : (
        <NotificationsList notifications={notifications} />
      )}
    </div>
  );
}
