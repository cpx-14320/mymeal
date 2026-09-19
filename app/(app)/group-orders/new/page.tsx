import { redirect } from "next/navigation";
import { GroupOrderNewForm } from "@/components/group-order-new-form";
import { getSessionMemberId } from "@/lib/session";
import { findMemberById } from "@/lib/models/member";
import { listActiveTemplateDetails } from "@/lib/models/template";
import { listDepartments, listUnits } from "@/lib/models/org";
import { todayTaiwanDateString } from "@/lib/date";

export const metadata = { title: "開團" };

export default async function NewGroupOrderPage() {
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const host = await findMemberById(memberId);
  if (!host) redirect("/login");

  const [templates, departments, units] = await Promise.all([
    listActiveTemplateDetails(),
    listDepartments(),
    listUnits(),
  ]);

  const todayDash = todayTaiwanDateString().replaceAll("/", "-");

  return (
    <GroupOrderNewForm
      hostId={memberId}
      hostUnitId={host.unitId}
      templates={templates}
      departments={departments}
      units={units}
      defaultDate={todayDash}
      defaultDeadline={`${todayDash}T10:30`}
    />
  );
}
