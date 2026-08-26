'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Category, Expense, ExpenseCreateInput } from '@/types';
import { categoriesApi } from '@/lib/api/categories';
import { validateExpenseForm, ExpenseValidationError } from '@/forms/validation/expense';
import { IndianRupee, Tag, Calendar, FileText, ArrowLeft, Save } from 'lucide-react';

interface ExpenseFormProps {
  initialData?: Expense;
  onSubmit: (data: ExpenseCreateInput) => Promise<void>;
  isSubmitting: boolean;
  title: string;
}

export function ExpenseForm({ initialData, onSubmit, isSubmitting, title }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : '');
  const [categoryId, setCategoryId] = useState<string>(initialData ? String(initialData.category_id) : '');
  const [expenseDate, setExpenseDate] = useState<string>(
    initialData ? initialData.expense_date : new Date().toISOString().split('T')[0]
  );
  const [note, setNote] = useState<string>(initialData?.note || '');

  const [errors, setErrors] = useState<ExpenseValidationError>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      try {
        setLoadingCategories(true);
        const data = await categoriesApi.getAll();
        setCategories(data);
        if (!initialData && data.length > 0) {
          setCategoryId(String(data[0].id));
        }
      } catch (err: any) {
        setServerError(err.message || 'Failed to load categories.');
      } finally {
        setLoadingCategories(false);
      }
    }
    loadCategories();
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateExpenseForm(amount, categoryId, expenseDate, note);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit({
        amount: parseFloat(amount),
        category_id: Number(categoryId),
        expense_date: expenseDate,
        note: note ? note.trim() : undefined,
      });
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while saving the expense.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto glass-card p-6 sm:p-8">
      <div className="flex items-center justify-between mb-6 pb-4 border-b border-slate-800">
        <h2 className="text-xl font-bold text-slate-100">{title}</h2>
        <Link href="/expenses" className="btn-secondary text-xs">
          <ArrowLeft className="w-4 h-4" /> Cancel
        </Link>
      </div>

      {serverError && (
        <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm">
          {serverError}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Amount Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <IndianRupee className="w-4 h-4 text-indigo-400" /> Amount (₹) <span className="text-rose-400">*</span>
          </label>
          <input
            type="number"
            step="0.01"
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className={`glass-input w-full ${errors.amount ? 'border-rose-500' : ''}`}
          />
          {errors.amount && <p className="text-xs text-rose-400 mt-1">{errors.amount}</p>}
        </div>

        {/* Category Dynamic Dropdown */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Tag className="w-4 h-4 text-purple-400" /> Category <span className="text-rose-400">*</span>
          </label>
          {loadingCategories ? (
            <div className="glass-input w-full text-sm text-slate-500 animate-pulse">Loading categories...</div>
          ) : categories.length === 0 ? (
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
              <span>No categories exist yet. Create a category first.</span>
              <Link href="/categories" className="underline font-semibold ml-2">
                Create Category
              </Link>
            </div>
          ) : (
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className={`glass-input w-full ${errors.category_id ? 'border-rose-500' : ''}`}
            >
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                  {cat.name}
                </option>
              ))}
            </select>
          )}
          {errors.category_id && <p className="text-xs text-rose-400 mt-1">{errors.category_id}</p>}
        </div>

        {/* Date Field */}
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" /> Date <span className="text-rose-400">*</span>
          </label>
          <input
            type="date"
            value={expenseDate}
            onChange={(e) => setExpenseDate(e.target.value)}
            className={`glass-input w-full ${errors.expense_date ? 'border-rose-500' : ''}`}
          />
          {errors.expense_date && <p className="text-xs text-rose-400 mt-1">{errors.expense_date}</p>}
        </div>

        {/* Note Field (Optional, max 500 chars) */}
        <div>
          <div className="flex justify-between items-center mb-1.5">
            <label className="block text-sm font-medium text-slate-300 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Note (Optional)
            </label>
            <span className="text-xs text-slate-500">{note.length}/500</span>
          </div>
          <textarea
            rows={3}
            placeholder="Add description or details..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={`glass-input w-full ${errors.note ? 'border-rose-500' : ''}`}
          />
          {errors.note && <p className="text-xs text-rose-400 mt-1">{errors.note}</p>}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
          <Link href="/expenses" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || categories.length === 0}
            className="btn-primary text-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving...' : 'Save Expense'}
          </button>
        </div>

      </form>
    </div>
  );
}
