import { Section } from "@/components/ui/primitives";
import { GuideTabs } from "@/components/admin/guide-tabs";
import { adminGuideCategories } from "@/lib/admin-guide-content";

export const metadata = { title: "功能說明" };

export default function AdminPage() {
  return (
    <Section description="給後台管理者看的內部參考——講的是操作介面上看不出來的隱藏邏輯，不是操作教學。">
      <GuideTabs categories={adminGuideCategories} />
    </Section>
  );
}
