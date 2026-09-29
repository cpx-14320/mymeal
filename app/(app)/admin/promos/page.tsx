import { Section } from "@/components/ui/primitives";
import { MarketingTabs } from "@/components/admin/marketing-tabs";
import { listInterstitials } from "@/lib/models/interstitial";
import { listNotifications } from "@/lib/models/notification";
import { listTemplates } from "@/lib/models/template";
import { getHomePreviewConfig } from "@/lib/models/site-settings";

export const metadata = { title: "廣宣版位" };

const TAB_KEYS = ["promos", "notifications", "homePreview"] as const;

export default async function AdminMarketingPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; saved?: string; tab?: string }>;
}) {
  const [promos, notifications, templates, homePreview, params] = await Promise.all([
    listInterstitials(),
    listNotifications(),
    listTemplates(),
    getHomePreviewConfig(),
    searchParams,
  ]);

  const initialTab = TAB_KEYS.find((k) => k === params.tab) ?? "promos";

  return (
    <Section>
      <MarketingTabs
        promos={promos}
        notifications={notifications}
        templates={templates}
        homePreviewTemplateId={homePreview.templateId}
        homePreviewSectionId={homePreview.sectionId}
        justCreated={params.created === "1"}
        justSaved={params.saved === "1"}
        initialTab={initialTab}
      />
    </Section>
  );
}
