import { Section } from "@/components/ui/primitives";
import { NotificationForm } from "@/components/admin/notification-form";

export const metadata = { title: "新增通知" };

export default function NewNotificationPage() {
  return (
    <Section
      title="新增通知訊息"
      description="開啟後會出現在前台通知鈴鐺清單裡。"
    >
      <NotificationForm />
    </Section>
  );
}
