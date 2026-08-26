'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category } from '@/types';
import { validateCategoryForm, CategoryValidationError } from '@/forms/validation/category';
import { FolderPlus, Edit3, X, Save } from 'lucide-react';

interface CategoryFormModalProps {
  isOpen: boolean;
  category?: Category | null;
  onSubmit: (name: string) => Promise<void>;
  onClose: () => void;
  isSubmitting: boolean;
}

export function CategoryFormModal({
  isOpen,
  category,
  onSubmit,
  onClose,
  isSubmitting,
}: CategoryFormModalProps) {
  const [name, setName] = useState('');
  const [errors, setErrors] = useState<CategoryValidationError>({});
  const [serverError, setServerError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setName(category.name);
    } else {
      setName('');
    }
    setErrors({});
    setServerError(null);
  }, [category, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateCategoryForm(name);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit(name.trim());
      onClose();
    } catch (err: any) {
      setServerError(err.message || 'Failed to save category.');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md glass-card p-6 border border-slate-700/50 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {category ? <Edit3 className="w-5 h-5" /> : <FolderPlus className="w-5 h-5" />}
                </div>
                <h3 className="text-lg font-semibold text-slate-100">
                  {category ? 'Edit Category' : 'Create Category'}
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {serverError && (
              <div className="mt-4 p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Category Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Food, College, Subscription"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`glass-input w-full text-sm ${errors.name ? 'border-rose-500' : ''}`}
                  autoFocus
                />
                {errors.name && <p className="text-xs text-rose-400 mt-1">{errors.name}</p>}
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button type="button" onClick={onClose} className="btn-secondary text-xs">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary text-xs disabled:opacity-50"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSubmitting ? 'Saving...' : category ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
