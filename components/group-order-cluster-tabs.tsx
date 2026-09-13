"use client";

import { useState } from "react";
import { GroupOrderClusterView } from "@/components/group-order-cluster-view";
import { templateById, type ClusterableTemplate } from "@/lib/mock";

export function GroupOrderClusterTabs({
  templates,
  date,
}: {
  templates: ClusterableTemplate[];
  date: string;
}) {
  const [activeId, setActiveId] = useState(templates[0]?.templateId ?? "");
  const active = templates.find((t) => t.templateId === activeId) ?? templates[0];
  const activeTemplate = active ? templateById(active.templateId) : undefined;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {templates.map((t) => {
          const tpl = templateById(t.templateId);
          return (
            <button
              key={t.templateId}
              type="button"
              onClick={() => setActiveId(t.templateId)}
              className={`rounded-full px-4 py-1.5 text-sm ${
                t.templateId === activeId
                  ? "bg-brand text-brand-fg"
                  : "border border-line bg-surface text-muted hover:text-ink"
              }`}
            >
              {tpl?.name ?? t.templateId}（{t.orders.length}）
            </button>
          );
        })}
      </div>

      {active && (
        <GroupOrderClusterView
          key={active.templateId}
          orders={active.orders}
          templateName={activeTemplate?.name ?? active.templateId}
          date={date}
        />
      )}
    </div>
  );
}
