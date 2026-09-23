import { Section, ButtonLink } from "@/components/ui/primitives";
import { AdminHeaderActions } from "@/components/layout/admin-header-actions";
import { PromosList } from "@/components/admin/promos-list";
import { listInterstitials } from "@/lib/models/interstitial";

export const metadata = { title: "蓋台廣告" };

export default async function AdminPromosPage() {
  const promos = await listInterstitials();

  return (
    <Section>
      <AdminHeaderActions>
        <ButtonLink href="/admin/promos/new" size="sm">新增廣告</ButtonLink>
      </AdminHeaderActions>

      <PromosList promos={promos} />
    </Section>
  );
}
