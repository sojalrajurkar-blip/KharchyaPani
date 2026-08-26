'use client';

import { Category, ExpenseFilterParams } from '@/types';
import { Filter, Calendar, Tag, RefreshCw } from 'lucide-react';

interface ExpenseFilterBarProps {
  categories: Category[];
  filters: ExpenseFilterParams;
  onChange: (newFilters: ExpenseFilterParams) => void;
  onReset: () => void;
}

export function ExpenseFilterBar({ categories, filters, onChange, onReset }: ExpenseFilterBarProps) {
  const hasActiveFilters = Boolean(
    filters.category_id || filters.date || filters.date_from || filters.date_to
  );

  return (
    <div className="glass-card p-5 mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-indigo-400" />
          <h4 className="text-sm font-semibold text-slate-200">Filter Expenses</h4>
        </div>
        {hasActiveFilters && (
          <button
            onClick={onReset}
            className="text-xs text-slate-400 hover:text-indigo-300 flex items-center gap-1 transition-colors"
          >
            <RefreshCw className="w-3 h-3" /> Clear Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Filter by Category */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Tag className="w-3 h-3 text-slate-400" /> Category
          </label>
          <select
            value={filters.category_id || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                category_id: e.target.value ? Number(e.target.value) : undefined,
              })
            }
            className="glass-input w-full text-sm"
          >
            <option value="" className="bg-slate-900 text-slate-200">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Filter by Exact Date */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Exact Date
          </label>
          <input
            type="date"
            value={filters.date || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                date: e.target.value || undefined,
                date_from: undefined,
                date_to: undefined,
              })
            }
            className="glass-input w-full text-sm"
          />
        </div>

        {/* Date From */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Date From
          </label>
          <input
            type="date"
            value={filters.date_from || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                date: undefined,
                date_from: e.target.value || undefined,
              })
            }
            className="glass-input w-full text-sm"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-xs font-medium text-slate-400 mb-1 flex items-center gap-1">
            <Calendar className="w-3 h-3 text-slate-400" /> Date To
          </label>
          <input
            type="date"
            value={filters.date_to || ''}
            onChange={(e) =>
              onChange({
                ...filters,
                date: undefined,
                date_to: e.target.value || undefined,
              })
            }
            className="glass-input w-full text-sm"
          />
        </div>

      </div>
    </div>
  );
}
