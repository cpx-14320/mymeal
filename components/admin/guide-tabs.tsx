"use client";

import { useState } from "react";
import { PillTabs, Card, CardBody } from "@/components/ui/primitives";
import type { AdminGuideCategory, GuideBlock } from "@/lib/admin-guide-content";

function GuideBlocks({ blocks }: { blocks: GuideBlock[] }) {
  return (
    <div className="mt-1 space-y-2 text-sm leading-7 text-muted">
      {blocks.map((b, i) => {
        if (typeof b === "string") return <p key={i}>{b}</p>;
        if ("list" in b) {
          return (
            <ul key={i} className="list-disc space-y-1 pl-5 leading-6">
              {b.list.map((li, j) => (
                <li key={j}>{li}</li>
              ))}
            </ul>
          );
        }
        return (
          <div key={i} className="overflow-x-auto rounded-md border border-line">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="bg-surface-2">
                  {b.table.headers.map((h, j) => (
                    <th key={j} className="border-b border-line px-3 py-1.5 font-medium text-ink">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {b.table.rows.map((row, j) => (
                  <tr key={j}>
                    {row.map((cell, k) => (
                      <td key={k} className="border-b border-line px-3 py-1.5 align-top last:border-b-0">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}
    </div>
  );
}

export function GuideTabs({ categories }: { categories: AdminGuideCategory[] }) {
  const [tab, setTab] = useState(categories[0]?.key ?? "");
  const active = categories.find((c) => c.key === tab) ?? categories[0];
  if (!active) return null;

  return (
    <div className="space-y-4">
      <PillTabs
        tabs={categories.map((c) => ({ key: c.key, label: c.label }))}
        value={tab}
        onChange={setTab}
      />

      <div className="space-y-3">
        <Card>
          <CardBody>
            <p className="font-semibold">{active.label}整體邏輯</p>
            <GuideBlocks blocks={active.overview} />
          </CardBody>
        </Card>

        {active.items.map((item) => (
          <Card key={item.key}>
            <CardBody>
              <p className="font-semibold">{item.title}</p>
              <GuideBlocks blocks={item.body} />
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
