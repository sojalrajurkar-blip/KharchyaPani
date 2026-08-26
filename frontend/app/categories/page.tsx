'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { categoriesApi } from '@/lib/api/categories';
import { Category } from '@/types';
import { CategoryList } from '@/components/categories/CategoryList';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { CardSkeleton } from '@/components/ui/LoadingSkeleton';
import { Modal } from '@/components/ui/Modal';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import { FolderPlus, RefreshCw } from 'lucide-react';

export default function CategoryManagementPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Modal state
  const [deletingCategory, setDeletingCategory] = useState<Category | null>(null);

  // Toast notifications
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = (type: 'success' | 'error', text: string) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, type, text }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const loadCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await categoriesApi.getAll();
      setCategories(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setIsFormOpen(true);
  };

  const handleOpenEditModal = (category: Category) => {
    setEditingCategory(category);
    setIsFormOpen(true);
  };

  const handleSaveCategory = async (name: string) => {
    try {
      setIsSubmitting(true);
      if (editingCategory) {
        await categoriesApi.update(editingCategory.id, { name });
        addToast('success', `Category "${name}" updated successfully.`);
      } else {
        await categoriesApi.create({ name });
        addToast('success', `Category "${name}" created and available immediately.`);
      }
      loadCategories();
    } catch (err: any) {
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!deletingCategory) return;
    try {
      await categoriesApi.delete(deletingCategory.id);
      addToast('success', `Category "${deletingCategory.name}" removed successfully.`);
      setDeletingCategory(null);
      loadCategories();
    } catch (err: any) {
      // Handles SRS Section 60 deletion block when linked expenses exist (409 Conflict)
      addToast('error', err.message || `Cannot delete category "${deletingCategory.name}".`);
      setDeletingCategory(null);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >

      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      {/* Category Create/Edit Modal */}
      <CategoryFormModal
        isOpen={isFormOpen}
        category={editingCategory}
        onSubmit={handleSaveCategory}
        onClose={() => setIsFormOpen(false)}
        isSubmitting={isSubmitting}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={Boolean(deletingCategory)}
        title="Delete Category"
        message={`Are you sure you want to delete category "${deletingCategory?.name}"? Deletion will fail if any expenses are currently linked to this category.`}
        confirmLabel="Delete"
        onConfirm={handleDeleteCategory}
        onCancel={() => setDeletingCategory(null)}
      />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-100">Category Management</h1>
          <p className="text-sm text-slate-400 mt-0.5">
            Create, update, and manage dynamic categories for expense tracking
          </p>
        </div>
        <button onClick={handleOpenCreateModal} className="btn-primary text-sm">
          <FolderPlus className="w-4 h-4" /> Add New Category
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <CardSkeleton />
      ) : error ? (
        <div className="glass-card p-6 text-center text-rose-300 text-sm flex flex-col items-center gap-3">
          <span>{error}</span>
          <button onClick={loadCategories} className="btn-secondary text-xs">
            <RefreshCw className="w-3.5 h-3.5" /> Retry
          </button>
        </div>
      ) : (
        <CategoryList
          categories={categories}
          onEdit={handleOpenEditModal}
          onDelete={(cat) => setDeletingCategory(cat)}
        />
      )}

    </motion.div>
  );
}
