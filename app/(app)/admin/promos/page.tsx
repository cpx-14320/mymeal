import { Section } from "@/components/ui/primitives";
import { MarketingTabs } from "@/components/admin/marketing-tabs";
import { listInterstitials } from "@/lib/models/interstitial";
import { listNotifications } from "@/lib/models/notification";

export const metadata = { title: "廣宣版位" };

export default async function AdminMarketingPage() {
  const [promos, notifications] = await Promise.all([listInterstitials(), listNotifications()]);

  return (
    <Section>
      <MarketingTabs promos={promos} notifications={notifications} />
    </Section>
  );
}
