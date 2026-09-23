"use client";

import { useState } from "react";
import { GroupOrderClusterView } from "@/components/group-order-cluster-view";
import { PillTabs } from "@/components/ui/primitives";
import type { ClusterableTemplate } from "@/lib/models/group-order";

export function GroupOrderClusterTabs({
  templates,
  date,
}: {
  templates: ClusterableTemplate[];
  date: string;
}) {
  const [activeId, setActiveId] = useState(templates[0]?.templateId ?? "");
  const active = templates.find((t) => t.templateId === activeId) ?? templates[0];

  return (
    <div className="space-y-6">
      <PillTabs
        tabs={templates.map((t) => ({ key: t.templateId, label: t.templateName, count: t.orders.length }))}
        value={activeId}
        onChange={setActiveId}
      />

      {active && (
        <GroupOrderClusterView
          key={active.templateId}
          orders={active.orders}
          templateName={active.templateName}
          date={date}
        />
      )}
    </div>
  );
}
