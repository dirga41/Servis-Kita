"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { logoutAction } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Dasbor" },
  { href: "/admin/services", label: "Layanan" },
  { href: "/admin/schedule", label: "Jadwal" },
] as const;

type AdminNavProps = {
  businessName: string;
  adminName: string;
};

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
    <div className="mx-auto flex w-full max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-3">
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="font-semibold">{businessName} · Admin</span>
        <nav aria-label="Navigasi admin" className="flex items-center gap-1">
          {NAV_ITEMS.map((item) => {
            const isActive = item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "hover:bg-accent hover:text-accent-foreground rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  isActive ? "bg-accent text-accent-foreground" : "text-muted-foreground",
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-muted-foreground text-sm">{adminName}</span>
        <Button variant="outline" size="sm" onClick={handleLogout} disabled={isPending}>
          <LogOut aria-hidden="true" />
          {isPending ? "Keluar..." : "Keluar"}
        </Button>
      </div>
    </div>
  );
}
