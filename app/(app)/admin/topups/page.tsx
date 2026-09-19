import { TopupsTables } from "@/components/admin/topups-tables";
import { listTopupRequests } from "@/lib/models/topup-request";

export const metadata = { title: "儲值審核" };

export default async function AdminTopupsPage() {
  const requests = await listTopupRequests();

  return (
    <div className="space-y-8">
      <TopupsTables requests={requests} />
    </div>
  );
}
