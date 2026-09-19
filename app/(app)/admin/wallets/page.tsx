import { WalletsTables } from "@/components/admin/wallets-tables";
import { listMemberBalances, listRecentLedger } from "@/lib/models/wallet";

export const metadata = { title: "錢包與交易" };

export default async function AdminWalletsPage() {
  const [balances, ledger] = await Promise.all([listMemberBalances(), listRecentLedger()]);

  return (
    <div className="space-y-8">
      <WalletsTables balances={balances} ledger={ledger} />
    </div>
  );
}
