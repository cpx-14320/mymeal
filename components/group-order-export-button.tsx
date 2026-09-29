"use client";

import { useMemo, useState } from "react";
import { Button, Field, inputClass } from "@/components/ui/primitives";
import { Modal, ModalHeader } from "@/components/ui/modal";
import { downloadCsv } from "@/lib/csv-export";
import { summarizeOrderLines, type OrderLine } from "@/lib/mock";

/**
 * 匯出前先跳一個小視窗，讓使用者選/打「這次匯出要顯示的團主名稱」——不寫進資料庫，
 * 純粹是匯出當下的暫時選擇：因為實際開團帳號（host）常常都是同一個人（例如都是總務開團），
 * 但送給店家的單子上，希望能標記真正負責這團的人，每次匯出可能都不一樣，
 * 用資料庫欄位存反而要多一層維護，直接在匯出當下打或從這團訂餐名單裡選比較實用。
 */
export function GroupOrderExportButton({
  lines,
  host,
  filename,
  label = "匯出 CSV",
}: {
  lines: OrderLine[];
  host: string;
  filename: string;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [displayName, setDisplayName] = useState(host);

  const participantNames = useMemo(
    () => [...new Set(lines.map((l) => l.memberName))],
    [lines],
  );

  function openDialog() {
    setDisplayName(host);
    setOpen(true);
  }

  function confirmExport() {
    const summary = summarizeOrderLines(lines);
    const totalQty = summary.reduce((sum, s) => sum + s.totalQty, 0);
    downloadCsv(filename, [displayName.trim() || host], [
      ["餐點", "飯量", "數量"],
      ...summary.map((s) => [s.itemName, s.riceBreakdown, s.totalQty]),
      ["合計", "", totalQty],
    ]);
    setOpen(false);
  }

  return (
    <>
      <Button variant="secondary" onClick={openDialog}>
        {label}
      </Button>

      <Modal open={open} onClose={() => setOpen(false)} ariaLabel="匯出前確認團主顯示名稱" className="max-w-sm">
        <ModalHeader title="匯出前確認團主顯示名稱" onClose={() => setOpen(false)} />
        <div className="space-y-4 p-4">
          <Field label="顯示名稱" hint="只影響這次匯出的 CSV，不會存到系統裡">
            <input
              className={inputClass}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              autoFocus
            />
          </Field>

          {participantNames.length > 0 && (
            <div>
              <span className="mb-1.5 block text-sm font-medium">或從這團訂餐的人選一個</span>
              <div className="flex flex-wrap gap-1.5">
                {participantNames.map((name) => (
                  <button
                    key={name}
                    type="button"
                    onClick={() => setDisplayName(name)}
                    className={`rounded-full border px-2.5 py-1 text-[13px] ${
                      name === displayName
                        ? "border-brand bg-brand-soft text-ink"
                        : "border-line text-muted hover:text-ink"
                    }`}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setOpen(false)}>
              取消
            </Button>
            <Button onClick={confirmExport}>確認並下載</Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
