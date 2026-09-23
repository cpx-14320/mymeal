import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { NotificationsList } from "@/components/admin/notifications-list";
import { listNotifications } from "@/lib/models/notification";

export const metadata = { title: "通知訊息" };

export default async function AdminNotificationsPage() {
  const notifications = await listNotifications();

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/notifications/new" size="sm">新增通知</ButtonLink>
      </AdminHeaderActions>

      <NotificationsList notifications={notifications} />
    </Section>
  );
}
