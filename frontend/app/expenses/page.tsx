'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

import { motion, AnimatePresence } from 'framer-motion';
import { expensesApi } from '@/lib/api/expenses';
import { categoriesApi } from '@/lib/api/categories';
import { Expense, Category, ExpenseFilterParams } from '@/types';
import { ExpenseFilterBar } from '@/components/expenses/ExpenseFilterBar';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import AuthGuard from '@/components/auth/AuthGuard';
import { History, PlusCircle, Calendar, Tag, CreditCard, Edit3, Trash2, Mic, Camera } from 'lucide-react';
import { VoiceExpenseInput } from '@/components/ai/VoiceExpenseInput';
import { ReceiptScannerModal } from '@/components/ai/ReceiptScannerModal';
import { useAutoSaveExpense } from '@/lib/hooks/useAutoSaveExpense';
import { ExpenseParseResponse, ReceiptScanResponse } from '@/lib/api/ai';

export default function ExpenseHistoryPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<ExpenseFilterParams>({});

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick AI input states
  const [isVoiceOpen, setIsVoiceOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Toast notifications with Undo action support
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


  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [expenseData, categoryData] = await Promise.all([
        expensesApi.getAll(filters),
        categoriesApi.getAll(),
      ]);

      setExpenses(expenseData);
      setCategories(categoryData);
    } catch (err: any) {
      setError(err.message || 'Failed to load expense history.');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Auto-Save Hook for Expense History Page
  const { autoSaveExpense } = useAutoSaveExpense({
    categories,
    addToast,
    onSuccess: () => {
      loadData();
    },
    onUndo: () => {
      loadData();
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

  const handleDelete = async () => {
    if (!deletingExpense) return;
    try {
      await expensesApi.delete(deletingExpense.id);
      addToast('success', 'Expense deleted successfully.');
      setDeletingExpense(null);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete expense.');
    }
  };

  const totalFilteredAmount = expenses.reduce((sum, item) => sum + Number(item.amount), 0);

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >
        {/* Toast Notification Container */}
        <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={Boolean(deletingExpense)}
          title="Delete Expense"
          message={`Are you sure you want to delete this expense of ₹${deletingExpense?.amount}? This action cannot be undone.`}
          confirmLabel="Delete"
          onConfirm={handleDelete}
          onCancel={() => setDeletingExpense(null)}
        />

        {/* Receipt Scanner Modal */}
        <ReceiptScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onAutoSave={handleAutoSaveReceipt}
          defaultAutoSave={true}
        />

        {/* Header Title & Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-100">Expense History</h1>
            <p className="text-sm text-slate-400 mt-0.5">
              Review, filter, update, or remove your recorded transactions
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

            <Link
              href="/expenses/new"
              className="btn-primary text-xs py-1.5 px-3 flex items-center gap-1.5 shadow-md shadow-sky-500/20"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Add Expense</span>
            </Link>
          </div>
        </div>

        {/* Expandable Voice Bar */}
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


        {/* Filtering Toolbar Component */}
        <ExpenseFilterBar
          categories={categories}
          filters={filters}
          onChange={setFilters}
          onReset={() => setFilters({})}
        />

        {/* Expense Records Table / States */}
        {loading ? (
          <TableSkeleton rows={8} />
        ) : error ? (
          <div className="glass-card p-6 text-center text-rose-300 text-sm">
            {error}
          </div>
        ) : expenses.length === 0 ? (
          <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
            <div className="p-3 rounded-full bg-slate-800 text-slate-500 mb-3">
              <History className="w-6 h-6" />
            </div>
            <h4 className="text-lg font-semibold text-slate-200">No Expenses Match Filter Criteria</h4>
            <p className="text-xs text-slate-400 mt-1 mb-4">
              Try adjusting your category, payment mode, or date filters, or add a new expense.
            </p>
            <button onClick={() => setFilters({})} className="btn-secondary text-xs">
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="text-xs uppercase bg-slate-800/60 text-slate-400 border-b border-slate-700/60">
                  <tr>
                    <th className="py-3.5 px-4">Date</th>
                    <th className="py-3.5 px-4">Category</th>
                    <th className="py-3.5 px-4">Payment Mode</th>
                    <th className="py-3.5 px-4">Note / Description</th>
                    <th className="py-3.5 px-4 text-right">Amount</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/50">
                  {expenses.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          {exp.expense_date}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                          <Tag className="w-3 h-3" />
                          {exp.category_name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                          <CreditCard className="w-3 h-3" />
                          {exp.payment_mode || 'Cash'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 max-w-sm truncate text-slate-400">
                        {exp.note || <span className="italic text-slate-600">No note</span>}
                      </td>
                      <td className="py-3.5 px-4 text-right font-semibold text-slate-100 whitespace-nowrap">
                        ₹{Number(exp.amount).toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            href={`/expenses/${exp.id}/edit`}
                            className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Expense"
                          >
                            <Edit3 className="w-4 h-4" />
                          </Link>
                          <button
                            onClick={() => setDeletingExpense(exp)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                            title="Delete Expense"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </motion.div>
    </AuthGuard>
  );
}
