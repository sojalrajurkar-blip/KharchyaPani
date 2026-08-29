'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Wallet, LayoutDashboard, History, FolderKanban, Target, PlusCircle, Menu, X } from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Expense History', href: '/expenses', icon: History },
    { name: 'Categories', href: '/categories', icon: FolderKanban },
    { name: 'Budgets', href: '/budgets', icon: Target },
  ];

  return (
    <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/60 border-b border-slate-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo & Brand Name */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="p-2 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30 group-hover:bg-sky-500/25 transition-colors shadow-[0_0_12px_rgba(14,165,233,0.2)]">
              <Wallet className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-sky-400 via-cyan-300 to-teal-300 bg-clip-text text-transparent tracking-tight">
              KharchyaPani
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 shadow-[0_0_12px_rgba(14,165,233,0.15)]'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {link.name}
                </Link>
              );
            })}

            <Link href="/expenses/new" className="ml-3 btn-primary text-sm py-2 px-3.5">
              <PlusCircle className="w-4 h-4" />
              Add Expense
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-base font-medium ${
                  isActive
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-5 h-5" />
                {link.name}
              </Link>
            );
          })}
          <div className="pt-2">
            <Link
              href="/expenses/new"
              onClick={() => setMobileMenuOpen(false)}
              className="btn-primary w-full py-2.5 text-center justify-center"
            >
              <PlusCircle className="w-5 h-5" />
              Add Expense
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
