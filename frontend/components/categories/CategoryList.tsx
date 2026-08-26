'use client';

import { Category } from '@/types';
import { motion } from 'framer-motion';
import { FolderKanban, Calendar, Edit3, Trash2 } from 'lucide-react';

interface CategoryListProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (category: Category) => void;
}

export function CategoryList({ categories, onEdit, onDelete }: CategoryListProps) {
  if (!categories || categories.length === 0) {
    return (
      <div className="glass-card p-8 text-center text-slate-400">
        <div className="p-3 rounded-full bg-slate-800 text-slate-500 w-fit mx-auto mb-3">
          <FolderKanban className="w-6 h-6" />
        </div>
        <p className="text-base font-semibold text-slate-200">No Categories Found</p>
        <p className="text-xs text-slate-400 mt-1">Create your first category to start organizing your spending.</p>
      </div>
    );
  }

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-4">
        <FolderKanban className="w-5 h-5 text-indigo-400" />
        <h3 className="text-lg font-semibold text-slate-100">Managed Categories ({categories.length})</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((category) => (
          <motion.div
            key={category.id}
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 hover:border-indigo-500/40 transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-100 text-base">{category.name}</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => onEdit(category)}
                    className="p-1.5 text-slate-400 hover:text-indigo-300 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Edit Category"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onDelete(category)}
                    className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-700/50 rounded-lg transition-colors"
                    title="Delete Category"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-700/30 flex items-center text-[11px] text-slate-500 gap-1">
              <Calendar className="w-3 h-3" />
              <span>Created {new Date(category.created_at).toLocaleDateString()}</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
