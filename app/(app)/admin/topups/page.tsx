import { TopupsTables } from "@/components/admin/topups-tables";

export const metadata = { title: "儲值審核" };

export default function AdminTopupsPage() {
  return (
    <div className="space-y-8">
      <TopupsTables />
      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
