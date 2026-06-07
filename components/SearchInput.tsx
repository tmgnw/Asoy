"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SearchInput() {
  const params = useSearchParams();
  const initial = params.get("q") ?? "";
  const [value, setValue] = useState(initial);
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => {
      const current = params.get("q") ?? "";
      if (value === current) return;
      const qs = value.trim() ? `?q=${encodeURIComponent(value.trim())}` : "";
      router.replace(`/search${qs}`);
    }, 300);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label className="relative block max-w-md">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/60">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
          <path d="M10.5 3a7.5 7.5 0 1 1-4.546 13.473l-4.06 4.06-1.414-1.414 4.06-4.06A7.5 7.5 0 0 1 10.5 3Zm0 2a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Z" />
        </svg>
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What do you want to play?"
        className="w-full rounded-full bg-[var(--surface-2)] py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/50 focus:outline-none focus:ring-2 focus:ring-white/40"
        autoFocus
      />
    </label>
  );
}
