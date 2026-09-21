import { SuppliersManager } from "@/components/admin/suppliers-manager";
import { listSuppliers } from "@/lib/models/supplier";

export const metadata = { title: "頁面設定" };

export default async function AdminSuppliersPage() {
  const suppliers = await listSuppliers();

  return <SuppliersManager suppliers={suppliers} />;
}
