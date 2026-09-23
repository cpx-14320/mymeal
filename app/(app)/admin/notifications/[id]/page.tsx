import { notFound } from "next/navigation";
import { Section } from "@/components/ui/primitives";
import { NotificationForm } from "@/components/admin/notification-form";
import { findNotificationById } from "@/lib/models/notification";

export const metadata = { title: "編輯通知" };

export default async function EditNotificationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const notification = await findNotificationById(id);
  if (!notification) notFound();

  return (
    <Section
      title={`編輯通知：${notification.title}`}
      description="修改標題、訊息內容或連結。"
    >
      <NotificationForm notification={notification} />
    </Section>
  );
}
