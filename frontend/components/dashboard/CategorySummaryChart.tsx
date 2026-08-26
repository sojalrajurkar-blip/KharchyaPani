'use client';

import { motion } from 'framer-motion';
import { PieChart, Layers } from 'lucide-react';
import { CategorySummaryItem } from '@/types';

interface CategorySummaryChartProps {
  summaryItems: CategorySummaryItem[];
  totalExpense: number;
}

export function CategorySummaryChart({ summaryItems, totalExpense }: CategorySummaryChartProps) {
  if (!summaryItems || summaryItems.length === 0) {
    return (
      <div className="glass-card p-6 text-center text-slate-400">
        <div className="p-3 rounded-full bg-slate-800 text-slate-500 w-fit mx-auto mb-2">
          <Layers className="w-5 h-5" />
        </div>
        <p className="text-sm font-medium">No Category Breakdown Available</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <PieChart className="w-5 h-5 text-purple-400" />
        <h3 className="text-lg font-semibold text-slate-100">Spending by Category</h3>
      </div>

      <div className="space-y-4">
        {summaryItems.map((item) => {
          const itemTotal = Number(item.total);
          const percentage = totalExpense > 0 ? Math.min(Math.round((itemTotal / totalExpense) * 100), 100) : 0;

          return (
            <div key={item.category_id} className="space-y-1.5">
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-slate-200">{item.category_name}</span>
                <div className="text-right">
                  <span className="font-semibold text-slate-100">₹{itemTotal.toFixed(2)}</span>
                  <span className="text-xs text-slate-400 ml-2">({percentage}%)</span>
                </div>
              </div>

              {/* Dynamic Progress Bar */}
              <div className="w-full bg-slate-800/80 rounded-full h-2.5 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${percentage}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 h-2.5 rounded-full"
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400">
                <span>{item.count} transaction{item.count !== 1 ? 's' : ''}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
