"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import {
  Home,
  UserPen,
  Users,
  ChartColumn,
  CircleUser,
  LogOut,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { usePathname } from "next/navigation";

export default function Sidebar() {
  const [expanded, setExpanded] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setExpanded(false);
      } else {
        setExpanded(true);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const navItemsUp = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/users", label: "Employees", icon: UserPen },
    { href: "/teams", label: "Teams", icon: Users },
    { href: "/reports", label: "KPI", icon: ChartColumn },
  ];

  const navItemsDown = [
    { href: "/profil", label: "My profil", icon: CircleUser },
    { href: "/login", label: "Log out", icon: LogOut },
  ];

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + "/");

  return (
    <>
      <div className="h-screen w-20 md:hidden"></div>
      <aside
        className={`
          fixed inset-y-0 left-0 z-40 h-screen md:static md:flex-none
          bg-brand text-text-on-brand shadow-lg
          flex flex-col gap-16
          py-8 px-8
          duration-300 ease-in-out
          ${expanded ? "w-56" : "w-20"}
        `}
      >
        <div className="flex items-center justify-between w-full">
          <h1
            className={`font-extrabold text-2xl tracking-tight leading-none transition duration-500 ${
              expanded
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0"
            }`}
          >
            {expanded ? "TRINITY_" : ""}
          </h1>
          <button
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={expanded ? "Collapse sidebar" : "Expand sidebar"}
            className="cursor-pointer flex items-center justify-center h-6 w-6"
          >
            {expanded ? (
              <ChevronLeft size={24} strokeWidth={2} className="shrink-0" />
            ) : (
              <ChevronRight size={24} strokeWidth={2} className="shrink-0" />
            )}
          </button>
        </div>
        <div className="flex flex-col h-full justify-between gap-16">
          <nav className="flex flex-col space-y-8 w-full">
            {navItemsUp.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-start gap-3 transition-colors ${
                    active
                      ? "cursor-default"
                      : "cursor-pointer hover:text-blue-200"
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                    className="shrink-0"
                  />
                  <span
                    className={`whitespace-nowrap transition duration-500 ${
                      expanded
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    } ${active ? "font-medium" : "font-normal"}`}
                  >
                    {expanded ? `${label}${active ? "_" : ""}` : ""}
                  </span>
                </Link>
              );
            })}
          </nav>
          <nav className="flex flex-col space-y-8 w-full">
            {navItemsDown.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`flex items-center justify-start gap-3 transition-colors ${
                    active
                      ? "cursor-default"
                      : "cursor-pointer hover:text-blue-200"
                  }`}
                >
                  <Icon
                    size={24}
                    strokeWidth={active ? 2.5 : 2}
                    className="shrink-0"
                  />
                  <span
                    className={`whitespace-nowrap transition duration-500 ${
                      expanded
                        ? "translate-x-0 opacity-100"
                        : "-translate-x-4 opacity-0"
                    } ${active ? "font-medium" : "font-normal"}`}
                  >
                    {expanded ? `${label}${active ? "_" : ""}` : ""}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </>
  );
}
