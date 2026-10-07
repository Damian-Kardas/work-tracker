"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Dziś", icon: IconClock },
  { href: "/history", label: "Historia", icon: IconList },
  { href: "/stats", label: "Statystyki", icon: IconChart },
  { href: "/leave", label: "Urlop", icon: IconPalm },
  { href: "/settings", label: "Ustawienia", icon: IconGear },
] as const;

export default function BottomTabBar() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-10 border-t border-hairline bg-parchment/80 backdrop-blur-xl"
      style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
    >
      <div className="mx-auto flex h-16 max-w-lg items-stretch justify-between px-1">
        {TABS.map((tab) => {
          const active = pathname === tab.href;
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 px-1"
            >
              <Icon active={active} />
              <span
                className={`truncate text-[10px] leading-tight tracking-tight ${
                  active ? "font-semibold text-primary" : "text-ink-muted-48"
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function iconProps(active: boolean) {
  return {
    width: 22,
    height: 22,
    viewBox: "0 0 24 24",
    fill: "none" as const,
    stroke: active ? "#0066cc" : "#7a7a7a",
    strokeWidth: 1.7,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
}

function IconClock({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 8v4.2l3 2" />
    </svg>
  );
}

function IconList({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M8 7h10" />
      <path d="M8 12h10" />
      <path d="M8 17h10" />
      <path d="M4.5 7h.01" />
      <path d="M4.5 12h.01" />
      <path d="M4.5 17h.01" />
    </svg>
  );
}

function IconChart({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <path d="M5 19V10" />
      <path d="M12 19V5" />
      <path d="M19 19v-6" />
      <path d="M4 19h16" />
    </svg>
  );
}

function IconPalm({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <rect x="4.5" y="5" width="15" height="15" rx="2.5" />
      <path d="M4.5 10h15" />
      <path d="M8.5 3.5v3" />
      <path d="M15.5 3.5v3" />
    </svg>
  );
}

function IconGear({ active }: { active: boolean }) {
  return (
    <svg {...iconProps(active)}>
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v2.3" />
      <path d="M12 18.2v2.3" />
      <path d="M20.5 12h-2.3" />
      <path d="M5.8 12H3.5" />
      <path d="M17.7 6.3l-1.6 1.6" />
      <path d="M7.9 16.1l-1.6 1.6" />
      <path d="M17.7 17.7l-1.6-1.6" />
      <path d="M7.9 7.9L6.3 6.3" />
    </svg>
  );
}
