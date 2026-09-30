import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { GroupOrderClusterTabs } from "@/components/group-order-cluster-tabs";
import { getClusterableTemplatesForDate } from "@/lib/models/group-order";
import { slugToDate } from "@/lib/date";
import { getSessionMemberId } from "@/lib/session";

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
  const memberId = await getSessionMemberId();
  if (!memberId) redirect("/login");

  const { dateSlug } = await params;
  const date = slugToDate(dateSlug);
  const templates = await getClusterableTemplatesForDate(date);
  if (templates.length === 0) notFound();

  return (
    <PageContainer>
      <PageHeader
        title={`${date}．單位彙總`}
        description="切換上方模板 tabs，各自查看部門／單位／訂購人明細，並可分別勾選單位匯出。"
      />
      <GroupOrderClusterTabs templates={templates} date={date} viewerId={memberId} />
    </PageContainer>
  );
}
