'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { expensesApi } from '@/lib/api/expenses';
import { ExpenseCreateInput } from '@/types';
import { ExpenseForm } from '@/components/expenses/ExpenseForm';
import { Toast, ToastMessage } from '@/components/ui/Toast';

export default function AddExpensePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleSubmit = async (data: ExpenseCreateInput) => {
    try {
      setIsSubmitting(true);
      await expensesApi.create(data);
      addToast('success', 'Expense successfully recorded!');
      setTimeout(() => {
        router.push('/expenses');
      }, 500);
    } catch (err: any) {
      addToast('error', err.message || 'Failed to create expense.');
      setIsSubmitting(false);
      throw err;
    }
  };

  return (
    <div className="py-4">
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />
      <ExpenseForm
        title="Add New Expense"
        onSubmit={handleSubmit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
