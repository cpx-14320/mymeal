"use client";

import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

interface HeaderActionsSlotState {
  node: HTMLDivElement | null;
  setNode: (el: HTMLDivElement | null) => void;
}

const AdminHeaderActionsContext = createContext<HeaderActionsSlotState | null>(null);

/** 包住整個後台版面，讓底下任何頁面都能透過 <AdminHeaderActions> 把按鈕 portal 到頂部標題列。 */
export function AdminHeaderActionsProvider({ children }: { children: ReactNode }) {
  const [node, setNode] = useState<HTMLDivElement | null>(null);
  return (
    <AdminHeaderActionsContext.Provider value={{ node, setNode }}>
      {children}
    </AdminHeaderActionsContext.Provider>
  );
}

/** 放在頂部標題列裡（AdminHeaderTitle 旁邊），是各頁面 <AdminHeaderActions> 實際掛載的地方。 */
export function AdminHeaderActionsSlot() {
  const ctx = useContext(AdminHeaderActionsContext);
  return <div ref={ctx?.setNode} className="flex items-center gap-2" />;
}

/** 頁面用這個把自己的主要操作按鈕（例如「新增頁面」）放到頂部標題列的右側，
 *  跟頁面名稱同一列，取代原本擠在頁面內容區自己的 actions 列。 */
export function AdminHeaderActions({ children }: { children: ReactNode }) {
  const ctx = useContext(AdminHeaderActionsContext);
  if (!ctx?.node) return null;
  return createPortal(children, ctx.node);
}
