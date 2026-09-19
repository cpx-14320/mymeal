import { SettingsForm } from "@/components/admin/settings-form";
import { getSettings } from "@/lib/models/settings";

export const metadata = { title: "系統設定" };

export default async function AdminSettingsPage() {
  const settings = await getSettings();

  return <SettingsForm settings={settings} />;
}
