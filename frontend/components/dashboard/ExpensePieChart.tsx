'use client';

import { useState } from 'react';
import { PieChart, Wallet, CreditCard } from 'lucide-react';
import { CategorySummaryItem, PaymentModeSummaryItem } from '@/types';

interface ExpensePieChartProps {
  categorySummary: CategorySummaryItem[];
  paymentModeSummary: PaymentModeSummaryItem[];
}

const COLOR_PALETTE = [
  { color: '#8b5cf6', bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  { color: '#06b6d4', bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/30' },
  { color: '#10b981', bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/30' },
  { color: '#f59e0b', bg: 'bg-amber-500/20', text: 'text-amber-400', border: 'border-amber-500/30' },
  { color: '#ec4899', bg: 'bg-pink-500/20', text: 'text-pink-400', border: 'border-pink-500/30' },
  { color: '#3b82f6', bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  { color: '#a855f7', bg: 'bg-violet-500/20', text: 'text-violet-400', border: 'border-violet-500/30' },
  { color: '#f43f5e', bg: 'bg-rose-500/20', text: 'text-rose-400', border: 'border-rose-500/30' },
];

export function ExpensePieChart({ categorySummary, paymentModeSummary }: ExpensePieChartProps) {
  const [activeTab, setActiveTab] = useState<'category' | 'payment_mode'>('category');
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const items = activeTab === 'category'
    ? categorySummary.map(item => ({
        label: item.category_name,
        amount: Number(item.total),
        count: item.count
      }))
    : paymentModeSummary.map(item => ({
        label: item.payment_mode,
        amount: Number(item.total),
        count: item.count
      }));

  const totalAmount = items.reduce((acc, curr) => acc + curr.amount, 0);

  // Calculate SVG donut slice offsets
  let cumulativePercent = 0;
  const slices = items.map((item, idx) => {
    const percent = totalAmount > 0 ? item.amount / totalAmount : 0;
    const startAngle = cumulativePercent * 360;
    cumulativePercent += percent;
    const endAngle = cumulativePercent * 360;
    const color = COLOR_PALETTE[idx % COLOR_PALETTE.length];
    return {
      ...item,
      percent,
      startAngle,
      endAngle,
      color: color.color,
      palette: color
    };
  });

  const activeSlice = hoveredIndex !== null && slices[hoveredIndex]
    ? slices[hoveredIndex]
    : null;

  return (
    <div className="card backdrop-blur-md bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <PieChart className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">Expense Distribution</h3>
            <p className="text-xs text-slate-400">Interactive visual breakdown</p>
          </div>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-950/80 p-1 rounded-xl border border-slate-800/80 text-xs font-medium self-start sm:self-auto">
          <button
            onClick={() => { setActiveTab('category'); setHoveredIndex(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'category'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Wallet className="w-3.5 h-3.5" />
            Category
          </button>
          <button
            onClick={() => { setActiveTab('payment_mode'); setHoveredIndex(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
              activeTab === 'payment_mode'
                ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            Payment Mode
          </button>
        </div>
      </div>

      {/* Chart & Legend Grid */}
      {items.length === 0 ? (
        <div className="py-12 text-center text-slate-400 text-sm">
          No expenses recorded to build chart.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          {/* SVG Donut Chart */}
          <div className="md:col-span-6 flex flex-col items-center justify-center relative py-4">
            <div className="relative w-56 h-56 flex items-center justify-center">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90 transform">
                {slices.map((slice, idx) => {
                  const strokeDasharray = `${slice.percent * 282.74} ${282.74 - slice.percent * 282.74}`;
                  let offset = 0;
                  for (let i = 0; i < idx; i++) {
                    offset += slices[i].percent * 282.74;
                  }
                  const strokeDashoffset = -offset;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <circle
                      key={idx}
                      cx="50"
                      cy="50"
                      r="45"
                      fill="transparent"
                      stroke={slice.color}
                      strokeWidth={isHovered ? "11" : "9"}
                      strokeDasharray={strokeDasharray}
                      strokeDashoffset={strokeDashoffset}
                      className="transition-all duration-300 cursor-pointer origin-center"
                      style={{ opacity: hoveredIndex !== null && !isHovered ? 0.4 : 1 }}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    />
                  );
                })}
              </svg>

              {/* Donut Center Label */}
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 pointer-events-none">
                <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
                  {activeSlice ? activeSlice.label : 'Total'}
                </span>
                <span className="text-xl font-bold text-white mt-0.5">
                  ₹{(activeSlice ? activeSlice.amount : totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                </span>
                <span className="text-xs text-purple-400 font-medium mt-0.5">
                  {activeSlice ? `${(activeSlice.percent * 100).toFixed(1)}% of total` : `${items.length} items`}
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Legend List */}
          <div className="md:col-span-6 space-y-2.5 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
            {slices.map((slice, idx) => {
              const isHovered = hoveredIndex === idx;
              return (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  className={`flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer ${
                    isHovered
                      ? `${slice.palette.bg} ${slice.palette.border} shadow-md scale-[1.02]`
                      : 'bg-slate-950/40 border-slate-800/60 hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0 shadow-sm"
                      style={{ backgroundColor: slice.color }}
                    />
                    <div>
                      <div className="text-sm font-medium text-slate-200">{slice.label}</div>
                      <div className="text-xs text-slate-400">{slice.count} {slice.count === 1 ? 'expense' : 'expenses'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-semibold text-white">₹{slice.amount.toLocaleString('en-IN')}</div>
                    <div className="text-xs font-medium text-slate-400">{(slice.percent * 100).toFixed(1)}%</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
