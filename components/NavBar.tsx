"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/closet", label: "Closet" },
  { href: "/outfit", label: "Outfit" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border bg-surface sm:sticky sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 py-3 text-center text-sm font-medium transition-colors ${
              active ? "text-accent" : "text-muted"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
