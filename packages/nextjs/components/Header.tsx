"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bars3Icon } from "@heroicons/react/24/outline";
import { useOutsideClick } from "@/hooks/useOutsideClick";

const links = [
  { href: "/#talk", label: "Talk" },
  { href: "/about", label: "About" },
  { href: "/pali-ontology", label: "Pali Ontology" },
  { href: "/pali-ontology/network", label: "Network" },
  { href: "/remember", label: "Remember" },
];

const NavLink = ({ href, children }: { href: string; children: React.ReactNode }) => {
  const pathname = usePathname();
  const path = href.split("#")[0] || "/";
  const isActive = pathname === path;

  return (
    <Link
      href={href}
      className={`${
        isActive ? "bg-secondary shadow-md" : ""
      } hover:bg-secondary hover:shadow-md focus:bg-secondary py-1.5 px-3 text-sm rounded-full gap-2`}
    >
      {children}
    </Link>
  );
};

export const Header = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const burgerMenuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(
    burgerMenuRef,
    useCallback(() => setIsDrawerOpen(false), []),
  );

  const navLinks = links.map(link => (
    <li key={link.href}>
      <NavLink href={link.href}>{link.label}</NavLink>
    </li>
  ));

  return (
    <div className="sticky lg:static top-0 navbar bg-base-100 min-h-0 flex-shrink-0 justify-between z-20 shadow-md shadow-secondary px-0 sm:px-2">
      <div className="navbar-start w-auto lg:w-1/2">
        <div className="lg:hidden dropdown" ref={burgerMenuRef}>
          <label
            tabIndex={0}
            className={`ml-1 btn btn-ghost ${isDrawerOpen ? "hover:bg-secondary" : "hover:bg-transparent"}`}
            onClick={() => setIsDrawerOpen(open => !open)}
          >
            <Bars3Icon className="h-1/2" />
          </label>
          {isDrawerOpen && (
            <ul
              tabIndex={0}
              className="menu menu-compact dropdown-content mt-3 p-2 shadow bg-base-100 rounded-box w-52"
              onClick={() => setIsDrawerOpen(false)}
            >
              {navLinks}
            </ul>
          )}
        </div>
        <Link href="/" className="hidden lg:flex items-center gap-2 ml-4 mr-6">
          <Image alt="Sati-AI logo" className="cursor-pointer" width={1630} height={1094} style={{ width: 60, height: "auto" }} src="/logo.png" />
          <span className="font-bold leading-tight">Sati-Ai</span>
        </Link>
        <ul className="hidden lg:flex lg:flex-nowrap menu menu-horizontal px-1 gap-2">{navLinks}</ul>
      </div>
    </div>
  );
};
