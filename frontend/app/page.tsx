'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { dashboardApi } from '@/lib/api/dashboard';
import { expensesApi } from '@/lib/api/expenses';
import { categoriesApi } from '@/lib/api/categories';
import { DashboardSummary, Expense, Category } from '@/types';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecentExpensesTable } from '@/components/dashboard/RecentExpensesTable';
import { CategorySummaryChart } from '@/components/dashboard/CategorySummaryChart';
import { ExpensePieChart } from '@/components/dashboard/ExpensePieChart';
import { DailyBudgetCard } from '@/components/dashboard/DailyBudgetCard';
import { AIInsightsCard } from '@/components/dashboard/AIInsightsCard';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import AuthGuard from '@/components/auth/AuthGuard';
import { useAuth } from '@/context/AuthContext';
import { RefreshCw, AlertCircle, FolderKanban, PlusCircle, Mic, Camera, Plus } from 'lucide-react';
import Link from 'next/link';
import { VoiceExpenseInput } from '@/components/ai/VoiceExpenseInput';
import { ReceiptScannerModal } from '@/components/ai/ReceiptScannerModal';
import { useAutoSaveExpense } from '@/lib/hooks/useAutoSaveExpense';
import { ExpenseParseResponse, ReceiptScanResponse } from '@/lib/api/ai';


function DashboardContent() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick AI input states
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Toast state with Undo support
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback(
    (payload: { type: 'success' | 'error' | 'info'; text: string; title?: string; action?: any; secondaryAction?: any } | string, maybeText?: string) => {
      const id = Date.now().toString();
      if (typeof payload === 'string') {
        const type = (payload as any) || 'success';
        const text = maybeText || '';
        setToasts((prev) => [...prev, { id, type, text }]);
      } else {
        setToasts((prev) => [...prev, { ...payload, id }]);
      }
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 7000);
    },
    []
  );

  // Delete modal state
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);


  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [summaryData, categoriesData] = await Promise.all([
        dashboardApi.getSummary(),
        categoriesApi.getAll().catch(() => []),
      ]);
      setSummary(summaryData);
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-Save Hook for Dashboard Quick Actions
  const { autoSaveExpense } = useAutoSaveExpense({
    categories,
    addToast,
    onSuccess: () => {
      fetchDashboard();
    },
    onUndo: () => {
      fetchDashboard();
    },
  });

  const handleAutoSaveVoice = async (data: ExpenseParseResponse) => {
    await autoSaveExpense({
      amount: data.amount,
      expense_date: data.expense_date,
      suggested_category_id: data.suggested_category_id,
      suggested_category_name: data.suggested_category_name,
      payment_mode: data.payment_mode,
      note: data.note,
    });
  };

  const handleAutoSaveReceipt = async (data: ReceiptScanResponse) => {
    await autoSaveExpense({
      amount: data.amount,
      expense_date: data.expense_date,
      suggested_category_id: data.suggested_category_id,
      suggested_category_name: data.suggested_category_name,
      payment_mode: data.payment_mode,
      note: data.note || (data.merchant_name ? `${data.merchant_name} Purchase` : undefined),
    });
  };

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboard();
    }
  }, [authLoading, isAuthenticated, fetchDashboard]);

  const handleDeleteExpense = async () => {
    if (!deletingExpense) return;
    try {
      await expensesApi.delete(deletingExpense.id);
      addToast('success', 'Expense successfully deleted.');
      setDeletingExpense(null);
      fetchDashboard();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete expense.');
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div className="h-8 bg-slate-800 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
        <TableSkeleton rows={5} />
      </div>
    );
  }

  if (error || !summary) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto mt-10">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 w-fit mx-auto mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Unable to Load Dashboard</h3>
        <p className="text-sm text-slate-400 mt-2 mb-6">{error || 'Financial data unavailable.'}</p>
        <button onClick={fetchDashboard} className="btn-primary text-sm">
          <RefreshCw className="w-4 h-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-8"
    >
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <Modal
        isOpen={Boolean(deletingExpense)}
        title="Delete Expense"
        message={`Are you sure you want to delete the expense of ₹${deletingExpense?.amount}? This action cannot be undone.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteExpense}
        onCancel={() => setDeletingExpense(null)}
      />

      {/* Receipt Scanner Modal directly on Dashboard */}
      <ReceiptScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onAutoSave={handleAutoSaveReceipt}
        defaultAutoSave={true}
      />

      {/* Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time financial overview, budget tracking, and interactive analytics
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Voice Add Button */}
          <button
            type="button"
            onClick={() => setIsVoiceOpen(!isVoiceOpen)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition shadow-sm ${
              isVoiceOpen
                ? 'bg-sky-500 text-slate-950 border-sky-400 font-bold'
                : 'bg-slate-900/90 text-sky-300 border-sky-500/30 hover:bg-sky-500/15 hover:border-sky-500/50'
            }`}
          >
            <Mic className="w-3.5 h-3.5" />
            <span>{isVoiceOpen ? 'Close Voice' : 'Voice Add'}</span>
          </button>

          {/* Quick Scan Receipt Button */}
          <button
            type="button"
            onClick={() => setIsScannerOpen(true)}
            className="px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 bg-slate-900/90 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/15 hover:border-cyan-500/50 transition shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Receipt</span>
          </button>

          {/* Regular Add Expense Link */}
          <Link
            href="/expenses/new"
            className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-sky-500/20"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Expense</span>
          </Link>

          {/* Refresh Button */}
          <button
            onClick={fetchDashboard}
            className="btn-secondary text-xs py-1.5 px-2.5"
            title="Refresh dashboard"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Expandable Voice Bar directly on Dashboard */}
      <AnimatePresence>
        {isVoiceOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0, y: -10 }}
            animate={{ opacity: 1, height: 'auto', y: 0 }}
            exit={{ opacity: 0, height: 0, y: -10 }}
            className="overflow-hidden"
          >
            <VoiceExpenseInput
              onAutoSave={handleAutoSaveVoice}
              defaultAutoSave={true}
            />
          </motion.div>
        )}
      </AnimatePresence>


      {/* Header Summary Cards */}
      <DashboardHeader summary={summary} />

      {/* AI Financial Insights & Spending Velocity */}
      <AIInsightsCard />

      {/* Budget & Pie Chart Row */}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-4">
          <DailyBudgetCard progress={summary.daily_budget_progress} />
        </div>
        <div className="lg:col-span-8">
          <ExpensePieChart
            categorySummary={summary.category_summary}
            paymentModeSummary={summary.payment_mode_summary || []}
          />
        </div>
      </div>

      {/* Available Categories Banner */}
      <div className="glass-card p-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <FolderKanban className="w-5 h-5 text-indigo-400" />
            <h3 className="text-base font-semibold text-slate-100">
              Available Categories ({categories.length})
            </h3>
          </div>
          <Link href="/categories" className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors font-medium">
            Manage Categories &rarr;
          </Link>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href="/expenses/new"
              className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700 text-xs font-medium text-slate-200 hover:border-indigo-500/50 hover:bg-slate-700/60 transition-all flex items-center gap-1.5"
            >
              <span>{cat.name}</span>
              <PlusCircle className="w-3 h-3 text-slate-400" />
            </Link>
          ))}
        </div>
      </div>

      {/* Main Grid: Recent Expenses Table & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <RecentExpensesTable
            expenses={summary.recent_expenses}
            onDeleteRequest={(expense) => setDeletingExpense(expense)}
          />
        </div>
        <div>
          <CategorySummaryChart
            summaryItems={summary.category_summary}
            totalExpense={Number(summary.total_expense)}
          />
        </div>
      </div>
    </motion.div>
  );
}

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
