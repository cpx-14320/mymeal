import { SuppliersManager } from "@/components/admin/suppliers-manager";
import { listSuppliers } from "@/lib/models/supplier";

export const metadata = { title: "店家" };

export default async function AdminSuppliersPage() {
  const suppliers = await listSuppliers();

  return <SuppliersManager suppliers={suppliers} />;
}
