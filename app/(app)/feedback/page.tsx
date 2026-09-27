import type { Metadata } from "next";
import { PageContainer, PageHeader } from "@/components/ui/primitives";
import { FeedbackForm } from "./feedback-form";

export const metadata: Metadata = { title: "意見回饋" };

export default function FeedbackPage() {
  return (
    <PageContainer>
      <PageHeader
        title="意見回饋"
        description="使用上有問題或建議？告訴我們。"
      />
      <FeedbackForm />
    </PageContainer>
  );
}
