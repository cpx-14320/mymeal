"use client";

import { useState } from "react";
import { PillTabs, Card, CardBody } from "@/components/ui/primitives";
import type { AdminGuideCategory } from "@/lib/admin-guide-content";

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
            <div className="mt-1 space-y-2 text-sm leading-7 text-muted">
              {active.overview.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </div>
          </CardBody>
        </Card>

        {active.items.map((item) => (
          <Card key={item.key}>
            <CardBody>
              <p className="font-semibold">{item.title}</p>
              <div className="mt-1 space-y-2 text-sm leading-7 text-muted">
                {item.body.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
