import { ReportsView } from "@/components/admin/reports-view";
import { getOrderReportData } from "@/lib/models/reports";

export const metadata = { title: "報表" };

const MAX_RANGE_DAYS = 30;

export default async function AdminReportsPage() {
  const data = await getOrderReportData(MAX_RANGE_DAYS);
  return <ReportsView daily={data.daily} byKind={data.byKind} byPage={data.byPage} />;
}
