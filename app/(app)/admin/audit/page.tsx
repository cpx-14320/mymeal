import { Section, inputClass } from "@/components/ui/primitives";
import { AuditTable } from "@/components/admin/audit-table";

export const metadata = { title: "稽核" };

export default function AdminAuditPage() {
  return (
    <Section
      title="稽核紀錄"
      description="所有後台操作與金流異動，僅新增、不可刪改。"
      actions={
        <input
          className={`${inputClass} w-56`}
          placeholder="搜尋操作者 / 對象"
        />
      }
    >
      <AuditTable />
    </Section>
  );
}
