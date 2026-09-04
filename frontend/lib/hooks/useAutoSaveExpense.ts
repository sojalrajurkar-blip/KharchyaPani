'use client';

import { useState, useCallback } from 'react';
import { Category, Expense, ExpenseCreateInput } from '@/types';
import { expensesApi } from '@/lib/api/expenses';
import { categoriesApi } from '@/lib/api/categories';
import { matchUserCategory } from '@/lib/utils/categoryMatcher';
import { ToastMessage } from '@/components/ui/Toast';

export interface AutoSavePayload {
  amount?: number | string;
  expense_date?: string;
  suggested_category_id?: number | null;
  suggested_category_name?: string | null;
  payment_mode?: string;
  note?: string;
}

export interface UseAutoSaveExpenseOptions {
  categories?: Category[];
  onSuccess?: (expense: Expense) => void;
  onUndo?: (expense: Expense) => void;
  addToast?: (toast: Omit<ToastMessage, 'id'>) => void;
}

export function useAutoSaveExpense(options: UseAutoSaveExpenseOptions = {}) {
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [lastSavedExpense, setLastSavedExpense] = useState<Expense | null>(null);
  const [error, setError] = useState<string | null>(null);

  const autoSaveExpense = useCallback(
    async (payload: AutoSavePayload): Promise<Expense | null> => {
      setIsAutoSaving(true);
      setError(null);

      try {
        // Ensure we have categories
        let currentCategories = options.categories;
        if (!currentCategories || currentCategories.length === 0) {
          currentCategories = await categoriesApi.getAll().catch(() => []);
        }

        const numericAmount = parseFloat(String(payload.amount || 0));
        if (isNaN(numericAmount) || numericAmount <= 0) {
          throw new Error('Please specify a valid expense amount greater than 0.');
        }

        // Match against valid category
        const matchedCategory = matchUserCategory(
          currentCategories || [],
          payload.suggested_category_id,
          payload.suggested_category_name
        );

        if (!matchedCategory) {
          throw new Error('No categories found. Please create a category first.');
        }

        const expenseDate = payload.expense_date || new Date().toISOString().split('T')[0];
        const paymentMode = payload.payment_mode || 'Cash';
        const note = payload.note ? payload.note.trim() : undefined;

        const input: ExpenseCreateInput = {
          amount: numericAmount,
          category_id: matchedCategory.id,
          expense_date: expenseDate,
          payment_mode: paymentMode,
          note,
        };

        const createdExpense = await expensesApi.create(input);
        setLastSavedExpense(createdExpense);

        // Notify with instant Undo action
        if (options.addToast) {
          options.addToast({
            type: 'success',
            title: 'Expense Auto-Saved 🚀',
            text: `₹${numericAmount.toLocaleString('en-IN')} recorded for "${matchedCategory.name}" (${paymentMode})`,
            action: {
              label: 'Undo',
              variant: 'undo',
              onClick: async () => {
                try {
                  await expensesApi.delete(createdExpense.id);
                  options.onUndo?.(createdExpense);
                  options.addToast?.({
                    type: 'info',
                    title: 'Action Undone',
                    text: `Reverted ₹${numericAmount.toLocaleString('en-IN')} expense.`,
                  });
                } catch (undoErr: any) {
                  options.addToast?.({
                    type: 'error',
                    text: undoErr.message || 'Failed to undo expense.',
                  });
                }
              },
            },
            secondaryAction: {
              label: 'Edit',
              href: `/expenses/${createdExpense.id}/edit`,
            },
          });
        }

        options.onSuccess?.(createdExpense);
        return createdExpense;
      } catch (err: any) {
        const msg = err.message || 'Failed to auto-save expense.';
        setError(msg);
        options.addToast?.({
          type: 'error',
          text: msg,
        });
        return null;
      } finally {
        setIsAutoSaving(false);
      }
    },
    [options]
  );

  return {
    autoSaveExpense,
    isAutoSaving,
    lastSavedExpense,
    error,
  };
}
