import { WalletsTables } from "@/components/admin/wallets-tables";

export const metadata = { title: "錢包與交易" };

export default function AdminWalletsPage() {
  return (
    <div className="space-y-8">
      <WalletsTables />
      <p className="text-xs text-muted">＊此頁為介面預覽，資料為範例。</p>
    </div>
  );
}
