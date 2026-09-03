'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Lightbulb,
  RotateCw,
  Zap,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { aiApi, AIInsightsResponse } from '@/lib/api/ai';

export function AIInsightsCard() {
  const [insights, setInsights] = useState<AIInsightsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = async () => {
    try {
      setRefreshing(true);
      const data = await aiApi.getInsights();
      setInsights(data);
    } catch (err) {
      console.error('Failed to load AI insights:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, []);

  if (loading) {
    return (
      <div className="glass-card p-5 animate-pulse space-y-3">
        <div className="h-4 bg-slate-800 rounded w-1/3"></div>
        <div className="h-16 bg-slate-800/60 rounded-xl"></div>
        <div className="h-10 bg-slate-800/40 rounded-xl"></div>
      </div>
    );
  }

  if (!insights) return null;

  const { velocity_warning, savings_tips } = insights;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="glass-card p-5 sm:p-6 relative overflow-hidden group border-sky-500/20 shadow-xl"
    >
      {/* Ambient background glow */}
      <div className="absolute top-0 right-0 -mr-16 -mt-16 w-48 h-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />

      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-cyan-500/10 text-sky-400 border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2">
              AI Spending Insights & Forecast
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
                Live
              </span>
            </h3>
            <p className="text-xs text-slate-400">Spending velocity analytics and smart savings recommendations</p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchInsights}
          title="Refresh AI Insights"
          disabled={refreshing}
          className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/80 transition"
        >
          <RotateCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-sky-400' : ''}`} />
        </button>
      </div>

      {/* Velocity / Over-budget warning banner */}
      <div className="mb-4">
        {velocity_warning.has_warning ? (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-amber-950/40 via-amber-900/20 to-slate-900/60 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-3">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400 flex-shrink-0 mt-0.5">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-semibold text-amber-300 flex items-center gap-2">
                <span>Over-Budget Alert</span>
                {velocity_warning.predicted_exhaustion_date && (
                  <span className="text-[11px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono">
                    Projected: {velocity_warning.predicted_exhaustion_date}
                  </span>
                )}
              </div>
              <p className="text-slate-300 leading-relaxed">{velocity_warning.message}</p>
            </div>
          </div>
        ) : (
          <div className="p-3.5 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900/60 border border-emerald-500/20 text-xs text-emerald-200 flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 flex-shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <span className="font-semibold text-emerald-300 block">Great Financial Discipline!</span>
              <p className="text-slate-300 text-[11px]">{velocity_warning.message}</p>
            </div>
          </div>
        )}
      </div>

      {/* Smart Savings Tips */}
      {savings_tips.length > 0 && (
        <div className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium mb-1">
            <Lightbulb className="w-3.5 h-3.5 text-amber-400" />
            <span>Smart Savings Tips:</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {savings_tips.map((tip, i) => (
              <div
                key={i}
                className="p-3 rounded-xl bg-slate-950/40 border border-slate-800/80 hover:border-sky-500/30 text-xs text-slate-300 flex items-start gap-2.5 transition"
              >
                <div className="p-1 rounded bg-sky-500/10 text-sky-400 mt-0.5 flex-shrink-0">
                  <Zap className="w-3 h-3" />
                </div>
                <p className="leading-relaxed text-[11px]">{tip}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Footer */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
        <span className="text-[11px] text-slate-500">Kharcha AI Financial Intelligence</span>
        <Link
          href="/budgets"
          className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-medium text-xs transition"
        >
          <span>Manage Budget Limits</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

    </motion.div>
  );
}
