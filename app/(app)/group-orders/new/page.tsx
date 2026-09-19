import { redirect } from "next/navigation";
import { GroupOrderNewForm } from "@/components/group-order-new-form";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";
import { listActiveTemplateDetails } from "@/lib/models/template";
import { listUnits } from "@/lib/models/org";
import { getSettings } from "@/lib/models/settings";

export const metadata = { title: "開團" };

export default async function NewGroupOrderPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const host = await findMemberById(memberId);
  if (!host) redirect("/login");

  const [templates, units, settings] = await Promise.all([
    listActiveTemplateDetails(),
    listUnits(),
    getSettings(),
  ]);

  return (
    <GroupOrderNewForm
      hostId={memberId}
      hostUnitId={host.unitId}
      templates={templates}
      units={units}
      pickupLocations={settings.pickupLocations}
      deadlineDefaultHint={settings.orderDeadlineDefault}
      underMinPolicy={settings.underMinPolicy}
    />
  );
}
