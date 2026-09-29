"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ButtonLink, PillTabs, DismissibleNote } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { PromosList } from "@/components/admin/promos-list";
import { NotificationsList } from "@/components/admin/notifications-list";
import { HomePreviewForm } from "@/components/admin/home-preview-form";
import type { InterstitialView } from "@/lib/models/interstitial";
import type { NotificationView } from "@/lib/models/notification";
import type { TemplateListItem } from "@/lib/models/template";

type Tab = "promos" | "notifications" | "homePreview";
type Message = { tone: "positive" | "danger"; text: string };

const TAB_KEYS: Tab[] = ["promos", "notifications", "homePreview"];

/**
 * 蓋台廣告、通知訊息、首頁菜單預覽都是「前台廣宣版位」的一種，合併成一頁用 tabs 切換——
 * 首頁菜單預覽欄位只有兩個（選模板、選區塊），功能量太小不值得獨立開一個後台頁面，
 * 併進這裡當第三個分頁；各自的清單/表單邏輯不變，這裡只負責切換要顯示哪一個內容、
 * 跟頂部「新增」按鈕要不要顯示、連去哪裡。
 */
export function MarketingTabs({
  promos,
  notifications,
  templates,
  homePreviewTemplateId,
  homePreviewSectionId,
  justCreated = false,
  justSaved = false,
  initialTab = "promos",
}: {
  promos: InterstitialView[];
  notifications: NotificationView[];
  templates: TemplateListItem[];
  homePreviewTemplateId?: string;
  homePreviewSectionId?: string;
  /** 新增廣告存檔後帶著 ?created=1 導回這頁——跟品項設定同一套邏輯，新增／刪除共用同一個
   *  訊息槽，同一時間只會顯示一則狀態框。 */
  justCreated?: boolean;
  /** 首頁菜單預覽存檔後帶著 ?saved=1&tab=homePreview 導回這頁，同樣共用這個訊息槽。 */
  justSaved?: boolean;
  /** 網址帶的 ?tab= 決定進來時要停在哪個分頁；不是合法的分頁值就退回「蓋台廣告」。 */
  initialTab?: Tab;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>(TAB_KEYS.includes(initialTab) ? initialTab : "promos");
  const [message, setMessage] = useState<Message | null>(
    justCreated
      ? { tone: "positive", text: "新增廣告成功。" }
      : justSaved
        ? { tone: "positive", text: "已儲存首頁菜單預覽設定。" }
        : null,
  );

  useEffect(() => {
    if (justCreated || justSaved) router.replace("/admin/promos");
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
        {tab === "promos" && <ButtonLink href="/admin/promos/new" size="sm">新增廣告</ButtonLink>}
        {tab === "notifications" && <ButtonLink href="/admin/notifications/new" size="sm">新增通知</ButtonLink>}
      </AdminHeaderActions>

      <PillTabs
        tabs={[
          { key: "promos", label: "蓋台廣告", count: promos.length },
          { key: "notifications", label: "通知訊息", count: notifications.length },
          { key: "homePreview", label: "首頁菜單預覽" },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === "promos" && <PromosList promos={promos} onMessage={setMessage} />}
      {tab === "notifications" && <NotificationsList notifications={notifications} />}
      {tab === "homePreview" && (
        <HomePreviewForm
          templates={templates}
          currentTemplateId={homePreviewTemplateId}
          currentSectionId={homePreviewSectionId}
        />
      )}
    </div>
  );
}
