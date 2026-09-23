"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, ButtonLink, Badge, TableWrap, Th, Td, Pagination, ListToolbar } from "@/components/ui/primitives";
import type { InterstitialView, InterstitialStatus } from "@/lib/models/interstitial";
import { setPromosEnabledAction } from "@/app/(app)/admin/promos/actions";

const statusMeta: Record<InterstitialStatus, { label: string; tone: "positive" | "warning" | "neutral" }> = {
  showing: { label: "顯示中", tone: "positive" },
  scheduled: { label: "已排程", tone: "warning" },
  ended: { label: "已結束", tone: "neutral" },
  disabled: { label: "已關閉", tone: "neutral" },
};

const freqLabel: Record<string, string> = {
  always: "每次進站",
  daily: "每人每天一次",
  once: "每人只一次",
};

const fmt = (s: string) => s.replace("T", " ");

function statusOf(a: InterstitialView, now: Date): InterstitialStatus {
  if (!a.enabled) return "disabled";
  if (now < new Date(a.startAt)) return "scheduled";
  if (now > new Date(a.endAt)) return "ended";
  return "showing";
}

export function PromosList({ promos }: { promos: InterstitialView[] }) {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [busy, setBusy] = useState(false);
  const now = new Date();

  const pageCount = Math.max(1, Math.ceil(promos.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = promos.slice(start, start + pageSize);

  async function toggleEnabled(a: InterstitialView) {
    setBusy(true);
    await setPromosEnabledAction([a.id], !a.enabled);
    setBusy(false);
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <ListToolbar
        pageSize={pageSize}
        onPageSizeChange={(n) => {
          setPageSize(n);
          setPage(1);
        }}
      />

      <TableWrap>
        <thead>
          <tr>
            <Th>活動名稱</Th>
            <Th>排程</Th>
            <Th>頻率</Th>
            <Th>倒數</Th>
            <Th>圖片</Th>
            <Th>狀態</Th>
            <Th className="text-right">操作</Th>
          </tr>
        </thead>
        <tbody>
          {rows.map((a) => {
            const st = statusMeta[statusOf(a, now)];
            return (
              <tr key={a.id}>
                <Td>
                  <Link href={`/admin/promos/${a.id}`} className="hover:text-brand">
                    {a.name}
                  </Link>
                </Td>
                <Td className="text-muted tabular-nums">
                  {fmt(a.startAt)} – {fmt(a.endAt)}
                </Td>
                <Td className="text-muted">{freqLabel[a.frequency]}</Td>
                <Td className="text-muted">{a.dismissSeconds > 0 ? `${a.dismissSeconds} 秒` : "不自動關"}</Td>
                <Td className="text-muted">{a.imageUrl ? "已設定" : "尚未設定"}</Td>
                <Td>
                  <Badge tone={st.tone}>{st.label}</Badge>
                </Td>
                <Td className="text-right">
                  <div className="flex justify-end gap-2">
                    <ButtonLink href={`/admin/promos/${a.id}`} variant="secondary" size="sm">
                      編輯
                    </ButtonLink>
                    <Button variant="secondary" size="sm" disabled={busy} onClick={() => toggleEnabled(a)}>
                      {a.enabled ? "關閉" : "開啟"}
                    </Button>
                  </div>
                </Td>
              </tr>
            );
          })}
          {rows.length === 0 && (
            <tr>
              <Td className="text-center text-muted" colSpan={7}>
                還沒有任何廣告，點右上角「新增廣告」開始建立。
              </Td>
            </tr>
          )}
        </tbody>
      </TableWrap>

      <Pagination page={current} pageCount={pageCount} total={promos.length} pageSize={pageSize} onPage={setPage} unit="筆" />
    </div>
  );
}
