import { Link, Outlet, useNavigate } from "@tanstack/react-router";
import {
  BarChart3,
  BookOpen,
  FileUp,
  Gauge,
  LogOut,
  Menu,
  PanelLeftClose,
  UserCircle,
  Users,
  X,
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/auth/auth-context";
import type { Role } from "@/lib/types";
import { BrandMark } from "./brand-mark";
import { Button } from "./ui/button";

interface NavItem {
  to:
    | "/app/dashboard"
    | "/app/results"
    | "/app/students"
    | "/app/modules"
    | "/app/imports"
    | "/app/profile";
  label: string;
  icon: typeof Gauge;
  roles: readonly Role[];
}
const nav: NavItem[] = [
  {
    to: "/app/dashboard",
    label: "Overview",
    icon: Gauge,
    roles: ["ADMIN", "LECTURER", "STUDENT"],
  },
  {
    to: "/app/results",
    label: "Results",
    icon: BarChart3,
    roles: ["ADMIN", "LECTURER", "STUDENT"],
  },
  { to: "/app/students", label: "Students", icon: Users, roles: ["ADMIN"] },
  {
    to: "/app/modules",
    label: "Modules",
    icon: BookOpen,
    roles: ["ADMIN", "LECTURER", "STUDENT"],
  },
  {
    to: "/app/imports",
    label: "Data imports",
    icon: FileUp,
    roles: ["ADMIN", "LECTURER"],
  },
  {
    to: "/app/profile",
    label: "My profile",
    icon: UserCircle,
    roles: ["ADMIN", "LECTURER", "STUDENT"],
  },
];

export function AppShell() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  if (!user) return null;
  const initials = user.fullName
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  const sidebar = (
    <aside className="flex h-full w-[272px] flex-col bg-navy-950 px-4 py-5 text-white">
      <div className="flex items-center justify-between px-2">
        <BrandMark inverse />
        <button
          className="md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close navigation"
        >
          <X />
        </button>
      </div>
      <div className="mt-9 px-3 text-[10px] font-bold uppercase tracking-[.17em] text-slate-500">
        Workspace
      </div>
      <nav className="mt-3 space-y-1">
        {nav
          .filter((item) => item.roles.includes(user.role))
          .map((item) => (
            <Link
              key={item.to}
              to={item.to}
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-slate-400 transition hover:bg-white/5 hover:text-white"
              activeProps={{
                className:
                  "bg-white/10 !text-white shadow-inner shadow-white/5",
              }}
            >
              <item.icon size={18} />
              <span>{item.label}</span>
            </Link>
          ))}
      </nav>
      <div className="mt-auto rounded-2xl border border-white/10 bg-white/[.04] p-3">
        <div className="flex items-center gap-3">
          <div className="grid size-10 place-items-center rounded-xl bg-amber-400 text-xs font-black text-navy-950">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{user.fullName}</p>
            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
              {user.role}
            </p>
          </div>
          <button
            onClick={() => void logout().then(() => navigate({ to: "/login" }))}
            className="rounded-lg p-2 text-slate-500 hover:bg-white/10 hover:text-white"
            aria-label="Sign out"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );

  return (
    <div className="app-background min-h-screen">
      <div className="fixed inset-y-0 left-0 z-30 hidden md:block">
        {sidebar}
      </div>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-navy-950/60 backdrop-blur-sm md:hidden"
            onClick={() => setOpen(false)}
          />{" "}
          <div className="fixed inset-y-0 left-0 z-50 md:hidden">{sidebar}</div>
        </>
      )}
      <div className="min-h-screen md:pl-[272px]">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/80 px-4 backdrop-blur-xl md:px-8">
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setOpen(true)}
          >
            <Menu size={21} />
          </Button>
          <div className="hidden items-center gap-2 text-xs text-slate-400 md:flex">
            <PanelLeftClose size={15} />
            <span>Faculty of Applied Sciences</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden text-xs text-slate-400 sm:inline">
              {user.indexNumber ?? user.email}
            </span>
            <div className="size-2 rounded-full bg-emerald-500 ring-4 ring-emerald-500/10" />
          </div>
        </header>
        <main className="mx-auto max-w-[1500px] p-4 md:p-8 lg:p-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
