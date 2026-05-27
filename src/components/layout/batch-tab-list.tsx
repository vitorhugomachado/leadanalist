"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function BatchTabList({ batches }: { batches: { id: string; name: string }[] }) {
  const pathname = usePathname();

  if (batches.length === 0) return null;

  return (
    <div className="flex-1 overflow-y-auto border-t border-zinc-200 p-3">
      <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
        Suas cargas
      </p>
      <div className="flex flex-col gap-0.5">
        {batches.map((tab) => {
          const href = `/cargas/${tab.id}`;
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={tab.id}
              href={href}
              className={`truncate rounded-lg px-3 py-2 text-sm ${
                active
                  ? "bg-indigo-50 font-medium text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              {tab.name}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
