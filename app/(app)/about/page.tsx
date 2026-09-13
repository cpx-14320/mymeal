import type { Metadata } from "next";
import { PageContainer, PageHeader, Card, CardBody } from "@/components/ui/primitives";

export const metadata: Metadata = { title: "關於 MyMeal" };

export default function AboutPage() {
  return (
    <PageContainer>
      <PageHeader title="關於 MyMeal" description="公司內部每週訂餐系統。" />
      <Card>
        <CardBody className="space-y-4 text-sm leading-7">
          <p>
            MyMeal 是給公司同仁使用的訂餐系統。合作餐廳以「週」為單位安排供應日，
            每天提供不同的便當。同仁可以自行開團當團主，其他人加入團一起點餐；
            截止後系統彙整訂單清單交給餐廳，餐費從個人錢包餘額扣款。
          </p>
          <p>
            錢包餘額透過「儲值申請 → 管理員審核 → 入帳」補充。管理後台可維護餐廳、
            菜單、排餐、團訂、儲值審核、會員與權限等。
          </p>
          <p className="text-muted">目前為介面預覽階段，功能尚未全部完成。</p>
        </CardBody>
      </Card>
    </PageContainer>
  );
}
