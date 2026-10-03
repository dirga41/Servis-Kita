"use client";

import { useTransition } from "react";
import { CalendarClock, LayoutDashboard, ListChecks, LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutAction } from "@/actions/auth";
import { BrandMark } from "@/components/site/brand-mark";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dasbor", icon: LayoutDashboard },
  { href: "/admin/services", label: "Layanan", icon: ListChecks },
  { href: "/admin/schedule", label: "Jadwal", icon: CalendarClock },
];

type AdminNavProps = {
  businessName: string;
  adminName: string;
};

/** Sidebar admin: logo di atas, menu di tengah, tombol keluar di bawah. */
export function AdminNav({ businessName, adminName }: AdminNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleLogout() {
    startTransition(async () => {
      const result = await logoutAction();
      router.replace(result.ok ? result.data.redirectTo : "/login");
      router.refresh();
    });
  }

  return (
    <aside className="bg-card sticky top-0 z-40 flex shrink-0 flex-col border-b md:h-dvh md:w-60 md:border-r md:border-b-0">
      {/* Atas: logo dan badge Admin */}
      <div className="flex items-center justify-between gap-3 px-4 py-3 md:px-5 md:py-5">
        <Link href="/admin" className="flex min-w-0 items-center gap-2.5 font-semibold tracking-tight">
          <BrandMark />
          <span className="truncate">{businessName}</span>
        </Link>
        <div className="flex items-center gap-2">
          <Badge variant="secondary">Admin</Badge>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 md:hidden"
            onClick={handleLogout}
            disabled={isPending}
            aria-label="Keluar"
          >
            <LogOut aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* Tengah: menu navigasi (vertikal di layar lebar) */}
      <nav
        aria-label="Navigasi admin"
        className="flex gap-1 overflow-x-auto px-3 pb-3 md:flex-1 md:flex-col md:overflow-visible md:pb-0"
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "focus-visible:ring-ring/50 inline-flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ease-in-out outline-none focus-visible:ring-[3px] motion-reduce:transition-none",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground md:hover:translate-x-0.5",
              )}
            >
              <item.icon className="size-4 shrink-0" aria-hidden="true" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Bawah: akun dan tombol keluar */}
      <div className="hidden space-y-3 border-t p-4 md:block">
        <div className="min-w-0">
          <p className="text-muted-foreground text-xs">Masuk sebagai</p>
          <p className="truncate text-sm font-medium">{adminName}</p>
        </div>
        <Button variant="outline" className="w-full justify-start" onClick={handleLogout} disabled={isPending}>
          <LogOut aria-hidden="true" />
          {isPending ? "Keluar..." : "Keluar"}
        </Button>
      </div>
    </aside>
  );
}
