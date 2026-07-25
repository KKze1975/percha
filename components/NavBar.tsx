"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/", label: "Inicio" },
  { href: "/closet", label: "Closet" },
  { href: "/outfit", label: "Outfit" },
  { href: "/calendar", label: "Calendario" },
  { href: "/trip", label: "Viaje" },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 flex border-t border-border bg-surface/90 pt-2.5 pb-6 backdrop-blur-md sm:sticky sm:top-0 sm:bottom-auto sm:border-t-0 sm:border-b sm:pb-2.5">
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center gap-1.5"
          >
            <span
              className={`text-xs tracking-wide ${
                active ? "font-bold text-accent" : "font-normal text-muted"
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`h-0.5 w-5 rounded-full ${active ? "bg-accent" : "bg-transparent"}`}
            />
          </Link>
        );
      })}
    </nav>
  );
}
