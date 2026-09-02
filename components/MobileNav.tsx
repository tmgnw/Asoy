"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

function HomeIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 3.172 3 11v10h6v-6h6v6h6V11l-9-7.828Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M10.5 3a7.5 7.5 0 1 1-4.546 13.473l-4.06 4.06-1.414-1.414 4.06-4.06A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
    </svg>
  );
}

/**
 * Bottom tab bar shown only on mobile, where the desktop sidebar is hidden.
 * Restores primary navigation (Home / Search) on small screens.
 */
export default function MobileNav() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", Icon: HomeIcon, active: pathname === "/" },
    {
      href: "/search",
      label: "Search",
      Icon: SearchIcon,
      active: pathname.startsWith("/search"),
    },
  ];

  return (
    <nav
      aria-label="Primary"
      className="md:hidden shrink-0 flex items-stretch justify-around border-t border-white/10 bg-black pb-[env(safe-area-inset-bottom)]"
    >
      {items.map(({ href, label, Icon, active }) => (
        <Link
          key={href}
          href={href}
          aria-current={active ? "page" : undefined}
          className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
            active ? "text-white" : "text-white/50 hover:text-white/80"
          }`}
        >
          <Icon />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
