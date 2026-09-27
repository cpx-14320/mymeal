import { FeedbackList } from "@/components/admin/feedback-list";
import { listFeedback } from "@/lib/models/feedback";

export const metadata = { title: "意見列表" };

export default async function AdminFeedbackPage() {
  const feedback = await listFeedback();

  return <FeedbackList feedback={feedback} />;
}
