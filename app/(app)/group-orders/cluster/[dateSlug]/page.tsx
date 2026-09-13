import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { GroupOrderClusterTabs } from "@/components/group-order-cluster-tabs";
import { clusterableTemplatesForDate, slugToDate } from "@/lib/mock";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ dateSlug: string }>;
}): Promise<Metadata> {
  const { dateSlug } = await params;
  return { title: `${slugToDate(dateSlug)}．單位彙總` };
}

export default async function GroupOrderClusterDatePage({
  params,
}: {
  params: Promise<{ dateSlug: string }>;
}) {
  const { dateSlug } = await params;
  const date = slugToDate(dateSlug);
  const templates = clusterableTemplatesForDate(date);
  if (templates.length === 0) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={`${date}．單位彙總`}
        description="切換上方模板 tabs，各自查看部門／單位／訂購人明細，並可分別勾選單位匯出。"
      />
      <GroupOrderClusterTabs templates={templates} date={date} />
    </PageContainer>
  );
}
