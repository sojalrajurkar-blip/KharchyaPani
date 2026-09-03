'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { budgetsApi } from '@/lib/api/budgets';
import { categoriesApi } from '@/lib/api/categories';
import { BudgetProgress, Category } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { TableSkeleton } from '@/components/ui/LoadingSkeleton';
import AuthGuard from '@/components/auth/AuthGuard';
import { Target, Plus, Trash2, Edit3, CheckCircle2, AlertTriangle, IndianRupee, Calendar } from 'lucide-react';
import { getBudgetMood } from '@/lib/utils/budgetMood';


export default function BudgetsPage() {
  const [statuses, setStatuses] = useState<BudgetProgress[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Toast State
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [periodType, setPeriodType] = useState<'daily' | 'monthly'>('daily');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [amountLimit, setAmountLimit] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [statusData, categoryData] = await Promise.all([
        budgetsApi.getStatuses(),
        categoriesApi.getAll(),
      ]);
      setStatuses(statusData);
      setCategories(categoryData);
    } catch (err: any) {
      setError(err.message || 'Failed to load budget settings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSaveBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amountLimit || parseFloat(amountLimit) <= 0) {
      addToast('error', 'Please enter a valid amount limit greater than zero.');
      return;
    }

    try {
      setSubmitting(true);
      await budgetsApi.createOrUpdate({
        period_type: periodType,
        category_id: periodType === 'daily' ? null : (selectedCategoryId ? Number(selectedCategoryId) : null),
        amount_limit: parseFloat(amountLimit),
      });

      addToast('success', `${periodType === 'daily' ? 'Daily' : 'Monthly'} budget limit saved successfully.`);
      setModalOpen(false);
      setAmountLimit('');
      setSelectedCategoryId('');
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to save budget limit.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBudget = async () => {
    if (!deletingId) return;
    try {
      await budgetsApi.delete(deletingId);
      addToast('success', 'Budget limit removed.');
      setDeletingId(null);
      loadData();
    } catch (err: any) {
      addToast('error', err.message || 'Failed to delete budget limit.');
    }
  };

  return (
    <AuthGuard>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-6"
      >

      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingId)}
        title="Remove Budget Setting"
        message="Are you sure you want to remove this budget limit?"
        confirmLabel="Remove"
        onConfirm={handleDeleteBudget}
        onCancel={() => setDeletingId(null)}
      />

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100 flex items-center gap-2">
            <Target className="w-6 h-6 text-cyan-400" /> Budget Settings & Management
          </h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Configure daily spending caps and monthly category budget limits
          </p>
        </div>
        <button
          onClick={() => {
            setPeriodType('daily');
            setAmountLimit('');
            setSelectedCategoryId('');
            setModalOpen(true);
          }}
          className="btn-primary text-sm self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" /> Set New Budget Limit
        </button>
      </div>

      {/* Form Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="card backdrop-blur-md bg-slate-900/90 border border-slate-800 p-6 rounded-2xl max-w-md w-full shadow-2xl"
          >
            <h3 className="text-lg font-bold text-white mb-4">Set Budget Limit</h3>

            <form onSubmit={handleSaveBudget} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Period Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPeriodType('daily')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      periodType === 'daily'
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800'
                    }`}
                  >
                    Daily Overall Budget
                  </button>
                  <button
                    type="button"
                    onClick={() => setPeriodType('monthly')}
                    className={`py-2 px-3 rounded-xl text-xs font-medium border transition-all ${
                      periodType === 'monthly'
                        ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                        : 'bg-slate-950/60 text-slate-400 border-slate-800'
                    }`}
                  >
                    Monthly Category Budget
                  </button>
                </div>
              </div>

              {periodType === 'monthly' && (
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Category</label>
                  <select
                    value={selectedCategoryId}
                    onChange={(e) => setSelectedCategoryId(e.target.value)}
                    className="glass-input w-full text-sm"
                  >
                    <option value="" className="bg-slate-900 text-slate-200">Overall Monthly Budget</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Budget Limit Amount (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g. 500.00"
                  value={amountLimit}
                  onChange={(e) => setAmountLimit(e.target.value)}
                  className="glass-input w-full text-sm"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary text-xs"
                >
                  {submitting ? 'Saving...' : 'Save Limit'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Budget Cards List */}
      {loading ? (
        <TableSkeleton rows={4} />
      ) : error ? (
        <div className="glass-card p-6 text-center text-rose-300 text-sm">
          {error}
        </div>
      ) : statuses.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center justify-center">
          <Target className="w-10 h-10 text-slate-600 mb-3" />
          <h4 className="text-lg font-semibold text-slate-200">No Budget Limits Configured</h4>
          <p className="text-xs text-slate-400 mt-1 mb-4 max-w-md">
            Set up an Overall Daily Budget or Category Monthly Limits to keep your spending in check.
          </p>
          <button
            onClick={() => setModalOpen(true)}
            className="btn-primary text-xs"
          >
            Set First Budget Limit
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {statuses.map((st) => {
            const isOver = st.remaining_amount < 0;
            const mood = getBudgetMood(st.percentage, isOver);

            return (
              <div
                key={st.id || `${st.period_type}-${st.category_id}`}
                className={`card backdrop-blur-md bg-slate-900/50 border ${isOver ? 'border-rose-500/40 shadow-rose-950/20' : 'border-slate-800/80'} p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all`}
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border ${mood.badgeClass} select-none`}>
                        <span className={mood.isOver ? 'animate-bounce' : ''}>{mood.emoji}</span>
                      </div>
                      <div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                          {st.period_type === 'daily' ? 'Daily Overall' : 'Monthly Category'}
                        </span>
                        <h3 className="text-lg font-bold text-white mt-0.5">
                          {st.category_name || 'Overall'}
                        </h3>
                      </div>
                    </div>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full border flex items-center gap-1.5 ${mood.badgeClass}`}>
                      <span>{mood.emoji}</span>
                      <span>{isOver ? `Exceeded by ₹${Math.abs(st.remaining_amount).toLocaleString('en-IN')}` : mood.label}</span>
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 my-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center">
                    <div>
                      <div className="text-xs text-slate-400">Spent</div>
                      <div className={`text-sm font-bold mt-0.5 ${mood.textColor}`}>₹{Number(st.spent_amount).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Limit</div>
                      <div className="text-sm font-bold text-slate-300 mt-0.5">₹{Number(st.amount_limit).toLocaleString('en-IN')}</div>
                    </div>
                    <div>
                      <div className="text-xs text-slate-400">Remaining</div>
                      <div className={`text-sm font-bold mt-0.5 ${isOver ? 'text-rose-400' : 'text-emerald-400'}`}>
                        ₹{Math.max(st.remaining_amount, 0).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-slate-400">
                      <span className="flex items-center gap-1">
                        <span>Usage</span>
                        <span>{mood.emoji}</span>
                      </span>
                      <span className={`font-bold ${mood.textColor}`}>{st.percentage}%</span>
                    </div>
                    <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${mood.barColor}`}
                        style={{ width: `${Math.min(st.percentage, 100)}%` }}
                      />
                    </div>
                  </div>

                  {isOver && (
                    <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2 font-medium">
                      <span className="text-base">😱 💸</span>
                      <span>Spending exceeded budget limit! (Pocket on fire!)</span>
                    </div>
                  )}

                </div>

                <div className="flex justify-end gap-2 pt-4 mt-4 border-t border-slate-800/60">

                  {st.id && (
                    <button
                      onClick={() => setDeletingId(st.id!)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors text-xs flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      </motion.div>
    </AuthGuard>
  );
}
