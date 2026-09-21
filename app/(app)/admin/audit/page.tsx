import { Section } from "@/components/ui/primitives";
import { AuditTable } from "@/components/admin/audit-table";
import { listAuditLogs } from "@/lib/models/audit-log";

export const metadata = { title: "稽核紀錄" };

export default async function AdminAuditPage() {
  const logs = await listAuditLogs();

  return (
    <Section>
      <AuditTable logs={logs} />
    </Section>
  );
}
