'use client';

import Link from 'next/link';
import { Target, ArrowRight } from 'lucide-react';
import { BudgetProgress } from '@/types';
import { getBudgetMood } from '@/lib/utils/budgetMood';

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
  const mood = getBudgetMood(percentage, isOverBudget);

  return (
    <div className={`card backdrop-blur-md bg-slate-900/50 border ${isOverBudget ? 'border-rose-500/40 shadow-rose-950/30' : 'border-slate-800/80'} p-6 rounded-2xl shadow-xl flex flex-col justify-between transition-all`}>
      <div>
        {/* Header with Dynamic Mood Emoji */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-2xl border ${mood.badgeClass} shadow-sm select-none`}>
              <span className={mood.isOver ? 'animate-bounce' : ''}>{mood.emoji}</span>
            </div>
            <div>
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <span>Daily Budget</span>
              </h3>
              <p className="text-xs text-slate-400">{mood.reaction}</p>
            </div>
          </div>

          {/* Status Badge with Emoji */}
          <span className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full border ${mood.badgeClass}`}>
            <span>{mood.emoji}</span>
            <span>{isOverBudget ? `Exceeded by ₹${Math.abs(remaining_amount).toLocaleString('en-IN')}` : mood.label}</span>
          </span>
        </div>

        {/* Amounts Grid */}
        <div className="grid grid-cols-2 gap-4 my-4 p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/60">
          <div>
            <div className="text-xs text-slate-400">Today Spent</div>
            <div className={`text-lg font-bold ${mood.textColor}`}>
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
            <span className="text-slate-400 flex items-center gap-1.5">
              <span>Usage</span>
              <span className="text-xs">{mood.emoji}</span>
            </span>
            <span className={`font-bold ${mood.textColor}`}>{percentage}%</span>
          </div>
          <div className="h-2.5 w-full bg-slate-800/80 rounded-full overflow-hidden p-0.5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${mood.barColor}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Over-budget Mini Warning Pill */}
        {isOverBudget && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <span>😱 💸</span>
              <span>Out of Budget Alert!</span>
            </span>
            <Link href="/budgets" className="text-xs text-rose-400 hover:text-white underline font-semibold">
              Adjust Limit &rarr;
            </Link>
          </div>
        )}
      </div>

      <div className="pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs mt-3">
        <span className="text-slate-400">
          Remaining: <strong className={isOverBudget ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
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
