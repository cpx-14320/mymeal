"use client";

import { useState } from "react";
import { Button } from "@/components/ui/primitives";
import { tagGroups as initial, type TagGroup } from "@/lib/mock";

let seq = 0;
const newId = () => `tg${Date.now()}${seq++}`;

export function TagGroupsManager() {
  const [groups, setGroups] = useState<TagGroup[]>(() =>
    initial.map((g) => ({ ...g, options: [...g.options] })),
  );
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const patch = (id: string, fn: (g: TagGroup) => TagGroup) =>
    setGroups((prev) => prev.map((g) => (g.id === id ? fn(g) : g)));

  const addOption = (id: string) => {
    const v = (drafts[id] ?? "").trim();
    if (!v) return;
    patch(id, (g) =>
      g.options.includes(v) ? g : { ...g, options: [...g.options, v] },
    );
    setDrafts((d) => ({ ...d, [id]: "" }));
  };

  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2">
        {groups.map((g) => (
          <div
            key={g.id}
            className="space-y-3 rounded-xl border border-line bg-surface p-4"
          >
            <div className="flex items-center gap-2">
              <input
                value={g.name}
                onChange={(e) =>
                  patch(g.id, (x) => ({ ...x, name: e.target.value }))
                }
                aria-label="群組名稱"
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1 py-0.5 font-semibold hover:border-line focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => patch(g.id, (x) => ({ ...x, multi: !x.multi }))}
                className="shrink-0 rounded-full border border-line px-2 py-0.5 text-xs text-muted hover:text-ink"
              >
                {g.multi ? "可複選" : "單選"}
              </button>
              <button
                type="button"
                onClick={() =>
                  setGroups((prev) => prev.filter((x) => x.id !== g.id))
                }
                aria-label="刪除群組"
                className="shrink-0 text-muted hover:text-danger"
              >
                ✕
              </button>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {g.options.length === 0 && (
                <span className="text-xs text-muted">尚無選項</span>
              )}
              {g.options.map((opt) => (
                <span
                  key={opt}
                  className="inline-flex items-center gap-1 rounded-md bg-surface-2 px-2 py-0.5 text-sm"
                >
                  {opt}
                  <button
                    type="button"
                    onClick={() =>
                      patch(g.id, (x) => ({
                        ...x,
                        options: x.options.filter((o) => o !== opt),
                      }))
                    }
                    aria-label={`移除 ${opt}`}
                    className="text-muted hover:text-danger"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                value={drafts[g.id] ?? ""}
                onChange={(e) =>
                  setDrafts((d) => ({ ...d, [g.id]: e.target.value }))
                }
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addOption(g.id);
                  }
                }}
                placeholder="新增選項…"
                className="min-w-0 flex-1 rounded-lg border border-line bg-surface px-2.5 py-1 text-sm focus:border-brand focus:outline-none"
              />
              <button
                type="button"
                onClick={() => addOption(g.id)}
                className="rounded-lg border border-line px-3 py-1 text-sm hover:bg-surface-2"
              >
                ＋
              </button>
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="secondary"
        onClick={() =>
          setGroups((prev) => [
            ...prev,
            { id: newId(), name: "新群組", multi: true, options: [] },
          ])
        }
      >
        ＋ 新增標籤群組
      </Button>

      <p className="text-xs text-muted">
        ＊此頁為介面預覽，變更只作用在本頁，重新整理會還原。
      </p>
    </div>
  );
}
