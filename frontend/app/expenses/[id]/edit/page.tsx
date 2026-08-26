'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import { expensesApi } from '@/lib/api/expenses';
import { Expense, ExpenseCreateInput } from '@/types';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { AlertCircle } from 'lucide-react';

export default function EditExpensePage() {
  const router = useRouter();
  const params = useParams();
  const expenseId = Number(params?.id);

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  useEffect(() => {
    async function loadExpense() {
      if (!expenseId || isNaN(expenseId)) {
        setError('Invalid expense ID.');
        setLoading(false);
        return;
      }
      try {
        setLoading(true);
        const data = await expensesApi.getById(expenseId);
        setExpense(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load expense details.');
      } finally {
        setLoading(false);
      }
    }
    loadExpense();
  }, [expenseId]);

  const handleSubmit = async (data: ExpenseCreateInput) => {
    try {
      setIsSubmitting(true);
      await expensesApi.update(expenseId, data);
      addToast('success', 'Expense updated successfully!');
      setTimeout(() => {
        router.push('/expenses');
      }, 500);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to update expense.');
      setIsSubmitting(false);
      throw err;
    }
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <CardSkeleton />
      </div>
    );
  }

  if (error || !expense) {
    return (
      <div className="glass-card p-8 text-center max-w-lg mx-auto mt-10">
        <div className="p-3 rounded-full bg-rose-500/10 text-rose-400 w-fit mx-auto mb-3">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h3 className="text-xl font-bold text-slate-100">Expense Not Found</h3>
        <p className="text-sm text-slate-400 mt-2 mb-6">{error || 'The requested expense record does not exist.'}</p>
        <button onClick={() => router.push('/expenses')} className="btn-primary text-sm">
          Return to Expense History
        </button>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="py-4"
    >
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <ExpenseForm
        title={`Edit Expense (#${expense.id})`}
        initialData={expense}
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </motion.div>
  );
}
