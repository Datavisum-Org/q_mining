"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/calculator", label: "Calculator" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/operations", label: "Operations" },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <nav className="flex gap-3">
      {LINKS.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "rounded-lg px-3 py-2 text-sm font-medium transition",
            pathname?.startsWith(link.href)
              ? "bg-coal-800 text-slate-100"
              : "text-ore-300 hover:text-slate-100",
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
