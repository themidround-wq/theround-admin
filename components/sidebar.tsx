"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import Logo from "@/public/Logo-on-darkbg.png";
import { logout } from "@/app/actions/auth";
import type { Admin } from "@/lib/types";
import {
  BookIcon,
  ClockIcon,
  CloseIcon,
  GridIcon,
  LogoutIcon,
  MailIcon,
  MenuIcon,
  SettingsIcon,
  ShieldIcon,
  TicketIcon,
  UsersIcon,
  WaveformIcon,
} from "./icons";
import { cx } from "./ui";

const NAV = [
  {
    title: "Workspace",
    items: [
      { href: "/", label: "Overview", icon: GridIcon },
      { href: "/waitlist", label: "Waitlist", icon: TicketIcon },
      { href: "/users", label: "Users", icon: UsersIcon },
      { href: "/practice", label: "Practice", icon: WaveformIcon },
      { href: "/newsletters", label: "Newsletters", icon: MailIcon },
      { href: "/content", label: "Clinical content", icon: BookIcon },
    ],
  },
  {
    title: "Admin",
    items: [
      { href: "/team", label: "Team", icon: ShieldIcon },
      { href: "/audit", label: "Audit log", icon: ClockIcon },
      { href: "/settings", label: "Settings", icon: SettingsIcon },
    ],
  },
];

const ROLE_LABEL = { owner: "Owner", admin: "Admin", viewer: "Viewer" };

export function Sidebar({ admin }: { admin: Admin }) {
  const pathname = usePathname();
  // Remember which page the mobile menu was opened on, so navigating closes it.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const open = openOn === pathname;
  const setOpen = (v: boolean) => setOpenOn(v ? pathname : null);

  const active = (href: string) => (href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`));

  const nav = (
    <nav className="flex h-full flex-col">
      <div className="flex items-center justify-between px-5 pb-6 pt-6">
        <Link href="/" aria-label="Overview">
          <Image src={Logo} alt="the round" className="w-[108px]" priority />
        </Link>
        <span className="rounded-full border border-lime/30 px-2 py-0.5 text-[10px] font-bold uppercase tracking-[0.12em] text-lime">
          Admin
        </span>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto px-3">
        {NAV.map((group) => (
          <div key={group.title}>
            <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-[0.14em] text-cream/35">{group.title}</div>
            <ul className="space-y-0.5">
              {group.items.map(({ href, label, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active(href) ? "page" : undefined}
                    className={cx(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-colors",
                      active(href) ? "bg-white/10 text-cream" : "text-cream/60 hover:bg-white/5 hover:text-cream",
                    )}
                  >
                    <Icon className={cx("h-[18px] w-[18px]", active(href) && "text-lime")} />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="m-3 rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-lime text-sm font-black text-ink">
            {(admin.name || admin.email).slice(0, 1).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="truncate text-[13px] font-bold text-cream">{admin.name}</div>
            <div className="truncate text-[11px] text-cream/50">
              {ROLE_LABEL[admin.role]} · {admin.email}
            </div>
          </div>
        </div>
        <form action={logout} className="mt-3">
          <button className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 py-1.5 text-xs font-bold text-cream/70 transition-colors hover:bg-white/5 hover:text-cream">
            <LogoutIcon className="h-3.5 w-3.5" /> Sign out
          </button>
        </form>
      </div>
    </nav>
  );

  return (
    <>
      {/* Mobile top bar */}
      <div className="sticky top-0 z-30 flex items-center justify-between bg-night px-4 py-3 lg:hidden">
        <Image src={Logo} alt="the round" className="w-[92px]" />
        <button onClick={() => setOpen(true)} aria-label="Open menu" className="rounded-lg p-1.5 text-cream hover:bg-white/10">
          <MenuIcon className="h-5 w-5" />
        </button>
      </div>
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 w-[264px] bg-night">
            <button onClick={() => setOpen(false)} aria-label="Close menu" className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-cream/70 hover:bg-white/10">
              <CloseIcon className="h-4 w-4" />
            </button>
            {nav}
          </div>
        </div>
      )}
      {/* Desktop */}
      <aside className="fixed inset-y-0 left-0 hidden w-[248px] bg-night lg:block">{nav}</aside>
    </>
  );
}
