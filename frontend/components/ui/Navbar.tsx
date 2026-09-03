'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Wallet,
  LayoutDashboard,
  History,
  FolderKanban,
  Target,
  PlusCircle,
  Menu,
  X,
  User as UserIcon,
  LogOut,
  ShieldAlert,
  Key,
  ChevronDown,
  Lock,
  AlertCircle,
  CheckCircle2,
  Bot,
  Sparkles,
} from 'lucide-react';

import { useAuth } from '@/context/AuthContext';

export function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAuthenticated, logout, logoutAll, changePassword } = useAuth();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [changePasswordModalOpen, setChangePasswordModalOpen] = useState(false);

  // Change password form state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [cpError, setCpError] = useState<string | null>(null);
  const [cpSuccess, setCpSuccess] = useState(false);
  const [cpSubmitting, setCpSubmitting] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setProfileDropdownOpen(false);
    await logout();
    router.push('/login');
  };

  const handleLogoutAll = async () => {
    setProfileDropdownOpen(false);
    await logoutAll();
    router.push('/login');
  };

  const handleChangePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCpError(null);
    if (!currentPassword || !newPassword) {
      setCpError('Please fill in all required fields.');
      return;
    }
    if (newPassword.length < 6) {
      setCpError('New password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setCpError('New passwords do not match.');
      return;
    }

    try {
      setCpSubmitting(true);
      await changePassword({ current_password: currentPassword, new_password: newPassword });
      setCpSuccess(true);
      setTimeout(() => {
        setChangePasswordModalOpen(false);
        setCpSuccess(false);
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        router.push('/login');
      }, 1500);
    } catch (err: any) {
      setCpError(err.message || 'Failed to change password. Check your current password.');
    } finally {
      setCpSubmitting(false);
    }
  };

  const navLinks = [
    { name: 'Dashboard', href: '/', icon: LayoutDashboard },
    { name: 'Expense History', href: '/expenses', icon: History },
    { name: 'Categories', href: '/categories', icon: FolderKanban },
    { name: 'Budgets', href: '/budgets', icon: Target },
  ];

  return (
    <>
      <nav className="sticky top-0 z-40 backdrop-blur-md bg-slate-950/70 border-b border-slate-800/80">
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
            {isAuthenticated && (
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

                <button
                  type="button"
                  onClick={() => {
                    const el = document.getElementById('kharcha-mitra-launcher');
                    if (el) el.click();
                  }}
                  className="ml-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-500/20 via-cyan-500/15 to-blue-500/10 hover:from-sky-500/30 hover:to-cyan-500/25 text-sky-200 border border-sky-400/40 text-xs font-semibold flex items-center gap-1.5 transition shadow-[0_0_12px_rgba(56,189,248,0.2)]"
                >
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>Kharcha AI</span>
                  <Sparkles className="w-3 h-3 text-amber-300" />
                </button>


                <Link href="/expenses/new" className="ml-2 btn-primary text-sm py-2 px-3.5">
                  <PlusCircle className="w-4 h-4" />
                  Add Expense
                </Link>

              </div>
            )}

            {/* Right Side: Auth buttons / User Profile Dropdown */}
            <div className="hidden md:flex items-center gap-3">
              {isAuthenticated && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                    className="flex items-center gap-2.5 py-1.5 px-3 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 text-slate-200 transition-all"
                  >
                    <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                      {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                    </div>
                    <span className="text-xs font-semibold text-slate-200 max-w-[120px] truncate">
                      {user.full_name || user.email}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {/* Dropdown Menu */}
                  {profileDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="px-3 py-2 border-b border-slate-800/80">
                        <p className="text-xs font-semibold text-white truncate">{user.full_name}</p>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">{user.email}</p>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            setProfileDropdownOpen(false);
                            setChangePasswordModalOpen(true);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                        >
                          <Key className="w-3.5 h-3.5 text-sky-400" />
                          <span>Change Password</span>
                        </button>

                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 transition-colors text-left"
                        >
                          <LogOut className="w-3.5 h-3.5 text-amber-400" />
                          <span>Log Out</span>
                        </button>

                        <button
                          onClick={handleLogoutAll}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors text-left"
                        >
                          <ShieldAlert className="w-3.5 h-3.5 text-rose-400" />
                          <span>Log Out All Devices</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/60 transition-all"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/register"
                    className="btn-primary text-sm py-2 px-3.5"
                  >
                    Create Account
                  </Link>
                </div>
              )}
            </div>

            {/* Mobile Menu Toggle Button */}
            <div className="md:hidden flex items-center gap-2">
              {isAuthenticated && user && (
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.full_name ? user.full_name[0].toUpperCase() : 'U'}
                </div>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-800"
                aria-label="Toggle Navigation Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 bg-slate-950/95 px-4 pt-3 pb-5 space-y-2">
            {isAuthenticated ? (
              <>
                <div className="pb-2 border-b border-slate-800/80 mb-2">
                  <p className="text-xs font-semibold text-white">{user?.full_name}</p>
                  <p className="text-[11px] text-slate-400">{user?.email}</p>
                </div>
                {navLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = pathname === link.href;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium ${
                        isActive
                          ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30'
                          : 'text-slate-300 hover:bg-slate-800/60'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {link.name}
                    </Link>
                  );
                })}

                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    const el = document.getElementById('kharcha-mitra-launcher');
                    if (el) el.click();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-sky-500/20 via-cyan-500/15 to-blue-500/10 border border-sky-400/40 text-sky-200 font-semibold text-xs mt-2 transition shadow-sm"
                >
                  <Bot className="w-4 h-4 text-sky-400" />
                  <span>Launch Kharcha AI Copilot</span>
                  <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                </button>

                <Link
                  href="/expenses/new"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary w-full py-2.5 text-center justify-center text-sm mt-1"
                >
                  <PlusCircle className="w-4 h-4" />
                  Add Expense
                </Link>

                <div className="pt-2 border-t border-slate-800/80 space-y-1">
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      setChangePasswordModalOpen(true);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60"
                  >
                    <Key className="w-4 h-4 text-sky-400" />
                    Change Password
                  </button>
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-slate-300 hover:bg-slate-800/60"
                  >
                    <LogOut className="w-4 h-4 text-amber-400" />
                    Log Out
                  </button>
                  <button
                    onClick={handleLogoutAll}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-rose-400 hover:bg-rose-500/10"
                  >
                    <ShieldAlert className="w-4 h-4 text-rose-400" />
                    Log Out All Devices
                  </button>
                </div>
              </>
            ) : (
              <div className="space-y-2">
                <Link
                  href="/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block text-center w-full py-2.5 px-4 rounded-xl border border-slate-800 text-white text-sm font-medium"
                >
                  Sign In
                </Link>
                <Link
                  href="/register"
                  onClick={() => setMobileMenuOpen(false)}
                  className="btn-primary block text-center w-full py-2.5 text-sm"
                >
                  Create Account
                </Link>
              </div>
            )}
          </div>
        )}
      </nav>

      {/* Change Password Modal */}
      {changePasswordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl">
            <button
              onClick={() => setChangePasswordModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-2.5 rounded-xl bg-sky-500/15 text-sky-400 border border-sky-500/30">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white font-outfit">Change Password</h3>
                <p className="text-xs text-slate-400">Update your account login password</p>
              </div>
            </div>

            {cpError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-rose-300 text-xs">
                <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                <span>{cpError}</span>
              </div>
            )}

            {cpSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-start gap-3 text-emerald-300 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-emerald-200">Password Changed Successfully</p>
                  <p className="mt-1 text-xs text-slate-300">Please sign in with your new password.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleChangePasswordSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    required
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/60 border border-slate-800 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/50"
                  />
                </div>

                <div className="flex gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setChangePasswordModalOpen(false)}
                    className="flex-1 py-2.5 rounded-xl border border-slate-800 hover:bg-slate-800 text-slate-300 text-xs font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={cpSubmitting}
                    className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-medium shadow-lg shadow-sky-500/20 disabled:opacity-50"
                  >
                    {cpSubmitting ? 'Updating...' : 'Save Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
