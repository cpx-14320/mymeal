import { Section } from "@/components/ui/primitives";
import { TagGroupsManager } from "@/components/admin/tag-groups";

export const metadata = { title: "品項標籤" };

export default function AdminItemTagsPage() {
  return (
    <Section
      title="品項標籤"
      description="主食（飯／麵…）、肉類（雞／豬／羊…）、飲食、甜度冰塊…。編輯品項時從這些選項勾選。"
    >
      <TagGroupsManager />
    </Section>
  );
}
