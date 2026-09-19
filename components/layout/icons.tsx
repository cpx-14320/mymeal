import type { ReactElement, ReactNode, SVGProps } from "react";
import type { NavKey, AdminNavKey } from "./nav";

type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

/** 前台側欄動態店家連結用（後台新增店家就會多一個，見 sidebar.tsx）——不是固定的 NavKey，單獨匯出。 */
export function StoreIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 9h16v11H4z" />
      <path d="M4 9l1.6-4.5A2 2 0 0 1 7.5 3h9a2 2 0 0 1 1.9 1.5L20 9" />
      <path d="M9 20v-5h6v5" />
    </Base>
  );
}

export const navIcons: Record<NavKey, (props: IconProps) => ReactElement> = {
  menu: (props) => (
    <Base {...props}>
      <path d="M3 4h18" />
      <path d="M4 4c0 6 2 9 8 9s8-3 8-9" />
      <path d="M12 13v7" />
      <path d="M8 20h8" />
    </Base>
  ),
  catalog: (props) => (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </Base>
  ),
  group: (props) => (
    <Base {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </Base>
  ),
  orders: (props) => (
    <Base {...props}>
      <path d="M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-2" />
      <path d="M9 3h6a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1z" />
      <path d="M8 12h.01M12 12h4M8 16h.01M12 16h4" />
    </Base>
  ),
  favorites: (props) => (
    <Base {...props}>
      <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
    </Base>
  ),
  wallet: (props) => (
    <Base {...props}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M3 6v12" />
      <path d="M21 12a2 2 0 0 0-2-2h-4a2 2 0 0 0 0 4h4a2 2 0 0 0 2-2Z" />
    </Base>
  ),
  account: (props) => (
    <Base {...props}>
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </Base>
  ),
  admin: (props) => (
    <Base {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  ),
};

export const adminNavIcons: Record<
  AdminNavKey,
  (props: IconProps) => ReactElement
> = {
  overview: (props) => (
    <Base {...props}>
      <rect x="3" y="3" width="7" height="9" rx="1" />
      <rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" />
      <rect x="3" y="16" width="7" height="5" rx="1" />
    </Base>
  ),
  zones: (props) => (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 9h18" />
      <path d="M8 9v11" />
    </Base>
  ),
  suppliers: (props) => (
    <Base {...props}>
      <path d="M4 9h16v11H4z" />
      <path d="M4 9l1.6-4.5A2 2 0 0 1 7.5 3h9a2 2 0 0 1 1.9 1.5L20 9" />
      <path d="M9 20v-5h6v5" />
    </Base>
  ),
  items: (props) => (
    <Base {...props}>
      <path d="M2 18h20" />
      <path d="M4 18a8 8 0 0 1 16 0" />
      <path d="M12 7V5" />
      <path d="M10 5h4" />
    </Base>
  ),
  itemClassification: (props) => (
    <Base {...props}>
      <path d="M12 3h6a2 2 0 0 1 2 2v6l-9 9-8-8 9-9z" />
      <circle cx="15.5" cy="7.5" r="1.2" fill="currentColor" stroke="none" />
    </Base>
  ),
  templates: (props) => (
    <Base {...props}>
      <rect x="3" y="3" width="18" height="6" rx="1" />
      <rect x="3" y="13" width="10" height="8" rx="1" />
      <path d="M17 13h4M17 17h4M17 21h4" />
    </Base>
  ),
  grouporders: (props) => (
    <Base {...props}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
      <circle cx="9.5" cy="7" r="3.5" />
      <path d="M21 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.5a3.5 3.5 0 0 1 0 7" />
    </Base>
  ),
  topups: (props) => (
    <Base {...props}>
      <rect x="2" y="6" width="20" height="12" rx="2" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M6 12h.01M18 12h.01" />
    </Base>
  ),
  wallets: (props) => (
    <Base {...props}>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      <path d="M3 6v12" />
      <path d="M21 12a2 2 0 0 0-2-2h-4a2 2 0 0 0 0 4h4a2 2 0 0 0 2-2Z" />
    </Base>
  ),
  members: (props) => (
    <Base {...props}>
      <path d="M5 21v-2a5 5 0 0 1 5-5h4a5 5 0 0 1 5 5v2" />
      <circle cx="12" cy="7" r="4" />
    </Base>
  ),
  memberInsights: (props) => (
    <Base {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M21 21l-4.3-4.3" />
      <path d="M8.5 11h.01M11 11h.01M13.5 11h.01" fill="currentColor" />
    </Base>
  ),
  roles: (props) => (
    <Base {...props}>
      <path d="M12 3l7 3v5c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </Base>
  ),
  orgUnits: (props) => (
    <Base {...props}>
      <rect x="4" y="3" width="16" height="18" rx="1" />
      <path d="M9 3v18M4 9h5M4 14h5" />
    </Base>
  ),
  gamification: (props) => (
    <Base {...props}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0z" />
      <path d="M7 4H4v2a3 3 0 0 0 3 3" />
      <path d="M17 4h3v2a3 3 0 0 1-3 3" />
      <path d="M9 20h6" />
      <path d="M12 14v6" />
    </Base>
  ),
  itemStats: (props) => (
    <Base {...props}>
      <path d="M4 19V9M10 19V5M16 19v-7M4 19h16" />
    </Base>
  ),
  reports: (props) => (
    <Base {...props}>
      <path d="M3 21h18" />
      <rect x="5" y="11" width="4" height="7" />
      <rect x="11" y="6" width="4" height="12" />
      <rect x="17" y="14" width="4" height="4" />
    </Base>
  ),
  audit: (props) => (
    <Base {...props}>
      <rect x="5" y="4" width="14" height="17" rx="2" />
      <path d="M9 3h6v3H9z" />
      <path d="M9 13l2 2 4-4" />
    </Base>
  ),
  settings: (props) => (
    <Base {...props}>
      <path d="M4 8h9" />
      <path d="M17 8h3" />
      <path d="M4 16h3" />
      <path d="M11 16h9" />
      <circle cx="15" cy="8" r="2" />
      <circle cx="9" cy="16" r="2" />
    </Base>
  ),
  promos: (props) => (
    <Base {...props}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <rect x="7" y="8" width="10" height="8" rx="1" />
    </Base>
  ),
};

export function BellIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 8a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" />
      <path d="M10 21a2 2 0 0 0 4 0" />
    </Base>
  );
}

export function UserCircleIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="10" r="3" />
      <path d="M6 19.5c1.2-2.5 3.4-4 6-4s4.8 1.5 6 4" />
    </Base>
  );
}

export function ArrowUpIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </Base>
  );
}

export function LockIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="11" width="16" height="10" rx="2" />
      <path d="M8 11V7a4 4 0 0 1 8 0v4" />
    </Base>
  );
}

export function SunIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </Base>
  );
}

export function MoonIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </Base>
  );
}

export function MenuIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 6h16M4 12h16M4 18h16" />
    </Base>
  );
}

export function ChevronDownIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 9l6 6 6-6" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M6 6l12 12M18 6L6 18" />
    </Base>
  );
}
