'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { dashboardApi } from '@/lib/api/dashboard';
import { expensesApi } from '@/lib/api/expenses';
import { DashboardSummary, Expense } from '@/types';
import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { RecentExpensesTable } from '@/components/dashboard/RecentExpensesTable';
import { CategorySummaryChart } from '@/components/dashboard/CategorySummaryChart';
import { CardSkeleton, TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { RefreshCw, AlertCircle } from 'lucide-react';

export default function DashboardPage() {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast state
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Delete modal state
  const [deletingExpense, setDeletingExpense] = useState<Expense | null>(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await dashboardApi.getSummary();
      setSummary(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load dashboard summary.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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
        <p className="text-sm text-slate-400 mt-2 mb-6">{error || 'Database connection unavailable.'}</p>
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

      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Dashboard</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Real-time financial overview and recent activity
          </p>
        </div>
        <button
          onClick={fetchDashboard}
          className="btn-secondary text-xs self-start sm:self-auto"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
        </button>
      </div>

      {/* Header Cards */}
      <DashboardHeader summary={summary} />

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
