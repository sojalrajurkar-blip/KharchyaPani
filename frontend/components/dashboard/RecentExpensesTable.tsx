'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { History, Calendar, Tag, ArrowRight, Edit3, Trash2 } from 'lucide-react';
import { Expense } from '@/types';

interface RecentExpensesTableProps {
  expenses: Expense[];
  onDeleteRequest?: (expense: Expense) => void;
}

export function RecentExpensesTable({ expenses, onDeleteRequest }: RecentExpensesTableProps) {
  if (!expenses || expenses.length === 0) {
    return (
      <div className="glass-card p-8 text-center flex flex-col items-center justify-center">
        <div className="p-3 rounded-full bg-slate-800 text-slate-400 mb-3">
          <History className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-semibold text-slate-200">No Recent Expenses</h4>
        <p className="text-sm text-slate-400 max-w-sm mt-1 mb-4">
          You haven&apos;t recorded any expenses yet. Start tracking your spending by adding your first expense.
        </p>
        <Link href="/expenses/new" className="btn-primary text-sm">
          + Add First Expense
        </Link>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History className="w-5 h-5 text-indigo-400" />
          <h3 className="text-lg font-semibold text-slate-100">Recent Expenses</h3>
        </div>
        <Link href="/expenses" className="text-xs font-medium text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors">
          View All <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Responsive Table / Card Rows */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-300">
          <thead className="text-xs uppercase bg-slate-800/40 text-slate-400 border-b border-slate-700/50">
            <tr>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4">Category</th>
              <th className="py-3 px-4">Note</th>
              <th className="py-3 px-4 text-right">Amount</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {expenses.map((expense) => (
              <motion.tr
                key={expense.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="hover:bg-slate-800/30 transition-colors"
              >
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <div className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    {expense.expense_date}
                  </div>
                </td>
                <td className="py-3.5 px-4 whitespace-nowrap">
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    <Tag className="w-3 h-3" />
                    {expense.category_name || 'Uncategorized'}
                  </span>
                </td>
                <td className="py-3.5 px-4 max-w-xs truncate text-slate-400">
                  {expense.note || <span className="italic text-slate-600">No note</span>}
                </td>
                <td className="py-3.5 px-4 text-right font-semibold text-slate-100 whitespace-nowrap">
                  ₹{Number(expense.amount).toFixed(2)}
                </td>
                <td className="py-3.5 px-4 text-right whitespace-nowrap">
                  <div className="flex items-center justify-end gap-2">
                    <Link
                      href={`/expenses/${expense.id}/edit`}
                      className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit Expense"
                    >
                      <Edit3 className="w-4 h-4" />
                    </Link>
                    {onDeleteRequest && (
                      <button
                        onClick={() => onDeleteRequest(expense)}
                        className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
                        title="Delete Expense"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
