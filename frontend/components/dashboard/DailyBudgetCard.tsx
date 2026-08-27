'use client';

import Link from 'next/link';
import { Target, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { BudgetProgress } from '@/types';

interface DailyBudgetCardProps {
  progress?: BudgetProgress | null;
}

export function DailyBudgetCard({ progress }: DailyBudgetCardProps) {
  if (!progress) {
    return (
      <div className="card backdrop-blur-md bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Daily Budget Limit</h3>
              <p className="text-xs text-slate-400">Track daily spending cap</p>
            </div>
          </div>
        </div>

        <div className="py-4 text-center">
          <p className="text-sm text-slate-400 mb-3">No daily budget configured yet.</p>
          <Link
            href="/budgets"
            className="inline-flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-500/30 transition-all"
          >
            Set Daily Budget <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    );
  }

  const { amount_limit, spent_amount, remaining_amount, percentage } = progress;
  const isOverBudget = remaining_amount < 0;
  const isNearLimit = percentage >= 85 && !isOverBudget;

  let statusColor = 'text-emerald-400';
  let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400';
  let statusBadge = (
    <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
      <CheckCircle2 className="w-3.5 h-3.5" /> On Track
    </span>
  );

  if (isOverBudget) {
    statusColor = 'text-rose-400';
    barColor = 'bg-gradient-to-r from-rose-500 to-red-600';
    statusBadge = (
      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <AlertTriangle className="w-3.5 h-3.5" /> Exceeded by ₹{Math.abs(remaining_amount).toLocaleString('en-IN')}
      </span>
    );
  } else if (isNearLimit) {
    statusColor = 'text-amber-400';
    barColor = 'bg-gradient-to-r from-amber-500 to-yellow-400';
    statusBadge = (
      <span className="flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20">
        <AlertTriangle className="w-3.5 h-3.5" /> Near Limit
      </span>
    );
  }

  return (
    <div className="card backdrop-blur-md bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl shadow-xl flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <Target className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Daily Budget Limit</h3>
              <p className="text-xs text-slate-400">Today's spending status</p>
            </div>
          </div>
          {statusBadge}
        </div>

        {/* Amounts Grid */}
        <div className="grid grid-cols-2 gap-4 my-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div>
            <div className="text-xs text-slate-400">Today Spent</div>
            <div className={`text-lg font-bold ${statusColor}`}>
              ₹{Number(spent_amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-400">Daily Limit</div>
            <div className="text-lg font-bold text-white">
              ₹{Number(amount_limit).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1.5 mb-2">
          <div className="flex justify-between text-xs font-medium">
            <span className="text-slate-400">Progress</span>
            <span className={statusColor}>{percentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs">
        <span className="text-slate-400">
          Remaining: <strong className={isOverBudget ? 'text-rose-400' : 'text-emerald-400'}>
            ₹{Math.max(remaining_amount, 0).toLocaleString('en-IN')}
          </strong>
        </span>
        <Link href="/budgets" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
          Manage Budgets &rarr;
        </Link>
      </div>
    </div>
  );
}
