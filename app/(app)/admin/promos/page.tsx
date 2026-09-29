import { Section } from "@/components/ui/primitives";
import { MarketingTabs } from "@/components/admin/marketing-tabs";
import { listInterstitials } from "@/lib/models/interstitial";
import { listNotifications } from "@/lib/models/notification";

export const metadata = { title: "廣宣版位" };

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const [promos, notifications, params] = await Promise.all([
    listInterstitials(),
    listNotifications(),
    searchParams,
  ]);

  return (
    <Section>
      <MarketingTabs promos={promos} notifications={notifications} justCreated={params.created === "1"} />
    </Section>
  );
}
