"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { LogoMark } from "./Logo";

const LINKS: { href: string; label: string; short: string; icon: ReactNode }[] = [
  {
    href: "/",
    label: "Overview",
    short: "Overview",
    icon: (
      <>
        <rect x="4" y="4" width="7" height="7" />
        <rect x="13" y="4" width="7" height="7" />
        <rect x="4" y="13" width="7" height="7" />
        <rect x="13" y="13" width="7" height="7" />
      </>
    ),
  },
  {
    href: "/assess",
    label: "New assessment",
    short: "Assess",
    icon: <path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M4 12h16" />,
  },
  {
    href: "/recyclers",
    label: "Recyclers",
    short: "Recyclers",
    icon: (
      <>
        <path d="M12 21s7-6.1 7-11.5A7 7 0 0 0 5 9.5C5 14.9 12 21 12 21z" />
        <circle cx="12" cy="9.5" r="2.5" />
      </>
    ),
  },
  {
    href: "/history",
    label: "History",
    short: "History",
    icon: <path d="M5 5h14M5 12h14M5 19h9" />,
  },
];

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  if (href === "/assess") return pathname === "/assess" || pathname.startsWith("/result");
  return pathname === href;
}

export function SideNav() {
  const pathname = usePathname();

  return (
    <div className="on-teal hidden w-[232px] shrink-0 bg-[#0F2C33] border-r border-[#1B434C] md:block">
      <nav aria-label="Main" className="sticky top-0 flex flex-col gap-7 py-5">
        <Link href="/" className="flex h-8 items-center gap-2.5 px-5 text-xl font-semibold tracking-[-0.2px] text-white">
          <LogoMark size={22} color="#81D8D0" />
          eLoop
        </Link>
        <div className="flex flex-col">
          {LINKS.map((link, i) => {
            const on = isActive(link.href, pathname);
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={on ? "page" : undefined}
                className={`relative flex min-h-11 items-center gap-3 px-5 text-[15px] font-medium transition-all duration-150 ${
                  on
                    ? "bg-[#13353E] text-white border-l-4 border-[#81D8D0] pl-1"
                    : "text-[#E2E8F0] hover:text-white hover:bg-[#13353E]"
                }`}
              >
                <span className={`p-num text-xs ${on ? "text-[#81D8D0]" : "text-[#A3B8A8]"}`}>
                  0{i + 1}
                </span>
                {link.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export function TabBar() {
  const pathname = usePathname();

  // Assessment and result screens carry their own bottom action bar.
  if (pathname === "/assess" || pathname.startsWith("/result")) return null;

  return (
    <nav
      aria-label="Main"
      className="fixed inset-x-0 bottom-0 z-10 grid h-16 grid-cols-4 border-t border-[#D5DBD8] bg-[#EAE6DF] md:hidden"
    >
      {LINKS.map((link) => {
        const on = isActive(link.href, pathname);
        return (
          <Link
            key={link.href}
            href={link.href}
            aria-current={on ? "page" : undefined}
            className={`-mt-px flex flex-col items-center justify-center gap-[3px] border-t-2 text-xs ${
              on
                ? "border-[#81D8D0] font-semibold text-[#0F2C33]"
                : "border-transparent font-medium text-[#4A5A4D]"
            }`}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
              {link.icon}
            </svg>
            {link.short}
          </Link>
        );
      })}
    </nav>
  );
}