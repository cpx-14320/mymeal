"use client";

import { useState } from "react";
import { ButtonLink, PillTabs } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { PromosList } from "@/components/admin/promos-list";
import { NotificationsList } from "@/components/admin/notifications-list";
import type { InterstitialView } from "@/lib/models/interstitial";
import type { NotificationView } from "@/lib/models/notification";

type Tab = "promos" | "notifications";

/**
 * 蓋台廣告跟通知訊息都是「前台廣宣版位」的一種，合併成一頁用 tabs 切換——
 * 蓋台廣告固定只有一個版位（進站蓋版），通知訊息之後會陸續增加，各自的清單/表單邏輯不變，
 * 這裡只負責切換要顯示哪一個清單、跟頂部「新增」按鈕要連去哪裡。
 */
export function MarketingTabs({
  promos,
  notifications,
}: {
  promos: InterstitialView[];
  notifications: NotificationView[];
}) {
  const [tab, setTab] = useState<Tab>("promos");

  return (
    <div className="space-y-4">
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
        <PromosList promos={promos} />
      ) : (
        <NotificationsList notifications={notifications} />
      )}
    </div>
  );
}
