'use client';

import { motion } from 'framer-motion';
import { IndianRupee, Hash, PieChart } from 'lucide-react';
import { DashboardSummary } from '@/types';

interface DashboardHeaderProps {
  summary: DashboardSummary;
}

export function DashboardHeader({ summary }: DashboardHeaderProps) {
  const formattedTotal = new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(summary.total_expense);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

      {/* Card 1: Total Expense */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="glass-card p-6 border-l-4 border-l-indigo-500 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expense</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{formattedTotal}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <IndianRupee className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Calculated dynamically from live transactions</p>
      </motion.div>

      {/* Card 2: Total Transactions */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="glass-card p-6 border-l-4 border-l-emerald-500 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Expenses Logged</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{summary.expense_count}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <Hash className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Active expense entries in database</p>
      </motion.div>

      {/* Card 3: Active Categories */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="glass-card p-6 border-l-4 border-l-purple-500 relative overflow-hidden"
      >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Active Categories</p>
            <h3 className="text-3xl font-extrabold text-white mt-1">{summary.category_summary.length}</h3>
          </div>
          <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PieChart className="w-6 h-6" />
          </div>
        </div>
        <p className="text-xs text-slate-400 mt-3">Categories with recorded spending</p>
      </motion.div>

    </div>
  );
}
