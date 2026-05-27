import Link from "next/link";
import { LayoutDashboard, Package, Upload } from "lucide-react";
import { ImportButton } from "@/components/cargas/import-button";
import { BatchTabList } from "@/components/layout/batch-tab-list";
import { NavLink } from "@/components/layout/nav-link";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/cargas", label: "Cargas de Leads", icon: Package },
];

export function AppShell({
  children,
  batches = [],
}: {
  children: React.ReactNode;
  batches?: { id: string; name: string }[];
}) {
  return (
    <div className="flex min-h-screen bg-zinc-50 text-zinc-900">
      <aside className="flex w-64 shrink-0 flex-col border-r border-zinc-200 bg-white">
        <div className="border-b border-zinc-200 px-5 py-4">
          <Link href="/dashboard" className="text-lg font-semibold tracking-tight">
            LeadAnalist
          </Link>
          <p className="mt-1 text-xs text-zinc-500">Gestão por cargas</p>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {nav.map(({ href, label, icon: Icon }) => (
            <NavLink key={href} href={href}>
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="px-3 pb-3">
          <ImportButton className="w-full justify-center" />
        </div>

        <BatchTabList batches={batches} />

        <div className="mt-auto border-t border-zinc-200 p-4 text-xs text-zinc-400">
          <Upload className="mb-1 inline h-3 w-3" /> Importe planilhas .xlsx / .csv
        </div>
      </aside>

      <main className="flex-1 overflow-auto">{children}</main>
    </div>
  );
}
