'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Expense, ExpenseCreateInput } from '@/types';
import { categoriesApi } from '@/lib/api/categories';
import { validateExpenseForm, ExpenseValidationError } from '@/forms/validation/expense';
import { CategoryFormModal } from '@/components/categories/CategoryFormModal';
import { VoiceExpenseInput } from '@/components/ai/VoiceExpenseInput';
import { ReceiptScannerModal } from '@/components/ai/ReceiptScannerModal';
import { ExpenseParseResponse, ReceiptScanResponse } from '@/lib/api/ai';
import { matchUserCategory } from '@/lib/utils/categoryMatcher';
import { useAutoSaveExpense } from '@/lib/hooks/useAutoSaveExpense';
import { Toast, ToastMessage } from '@/components/ui/Toast';
import {
  IndianRupee,
  Tag,
  Calendar,
  FileText,
  ArrowLeft,
  Save,
  CreditCard,
  Banknote,
  Smartphone,
  Landmark,
  Layers,
  Sparkles,
  RotateCcw,
  CheckCircle2,
  FolderPlus,
  Edit3,
  Camera,
  Mic,
  Zap
} from 'lucide-react';


interface ExpenseFormProps {
  initialData?: Expense;
  onSubmit: (data: ExpenseCreateInput) => Promise<void>;
  isSubmitting: boolean;
  title: string;
}

const PAYMENT_MODES = [
  { name: 'Cash', icon: Banknote, color: 'text-emerald-400', border: 'hover:border-emerald-500/40' },
  { name: 'UPI', icon: Smartphone, color: 'text-cyan-400', border: 'hover:border-cyan-500/40' },
  { name: 'Credit Card', icon: CreditCard, color: 'text-purple-400', border: 'hover:border-purple-500/40' },
  { name: 'Debit Card', icon: CreditCard, color: 'text-blue-400', border: 'hover:border-blue-500/40' },
  { name: 'Net Banking', icon: Landmark, color: 'text-amber-400', border: 'hover:border-amber-500/40' },
  { name: 'Other', icon: Layers, color: 'text-slate-400', border: 'hover:border-slate-500/40' },
];

const QUICK_AMOUNTS = [50, 100, 200, 500, 1000, 2000];

export function ExpenseForm({ initialData, onSubmit, isSubmitting, title }: ExpenseFormProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);

  const [amount, setAmount] = useState<string>(initialData ? String(initialData.amount) : '');
  const [categoryId, setCategoryId] = useState<string>(initialData ? String(initialData.category_id) : '');
  const [expenseDate, setExpenseDate] = useState<string>(
    initialData ? initialData.expense_date : new Date().toISOString().split('T')[0]
  );
  const [paymentMode, setPaymentMode] = useState<string>(initialData?.payment_mode || 'Cash');
  const [note, setNote] = useState<string>(initialData?.note || '');

  // Category Modal State for inline Create & Edit
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [categoryToEdit, setCategoryToEdit] = useState<Category | null>(null);
  const [isCategorySubmitting, setIsCategorySubmitting] = useState(false);
  const [categoryNotice, setCategoryNotice] = useState<string | null>(null);

  const [errors, setErrors] = useState<ExpenseValidationError>({});
  const [serverError, setServerError] = useState<string | null>(null);

  // AI Modal and Voice States
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [showVoiceInput, setShowVoiceInput] = useState(false);

  // Toast notification state with Undo support
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const addToast = useCallback((t: Omit<ToastMessage, 'id'>) => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 7000);
  }, []);

  // Auto-Save Hook for Voice & Scan
  const { autoSaveExpense } = useAutoSaveExpense({
    categories,
    addToast,
    onSuccess: (saved) => {
      setAmount('');
      setNote('');
      setCategoryNotice(`🚀 Auto-Saved ₹${saved.amount} to database! (Tap Undo in toast if needed)`);
      setTimeout(() => setCategoryNotice(null), 6000);
    },
    onUndo: (undone) => {
      setCategoryNotice(`Reverted ₹${undone.amount} expense.`);
      setTimeout(() => setCategoryNotice(null), 4000);
    },
  });

  const handleAutoSaveVoice = async (data: ExpenseParseResponse) => {
    await autoSaveExpense({
      amount: data.amount,
      expense_date: data.expense_date,
      suggested_category_id: data.suggested_category_id,
      suggested_category_name: data.suggested_category_name,
      payment_mode: data.payment_mode,
      note: data.note,
    });
  };

  const handleAutoSaveReceipt = async (data: ReceiptScanResponse) => {
    await autoSaveExpense({
      amount: data.amount,
      expense_date: data.expense_date,
      suggested_category_id: data.suggested_category_id,
      suggested_category_name: data.suggested_category_name,
      payment_mode: data.payment_mode,
      note: data.note || (data.merchant_name ? `${data.merchant_name} Purchase` : undefined),
    });
  };

  const handleAIParsed = (data: ExpenseParseResponse) => {
    if (data.amount) setAmount(String(data.amount));
    if (data.expense_date) setExpenseDate(data.expense_date);
    const matched = matchUserCategory(categories, data.suggested_category_id, data.suggested_category_name);
    if (matched) setCategoryId(String(matched.id));
    if (data.payment_mode) setPaymentMode(data.payment_mode);
    if (data.note) setNote(data.note);
    setCategoryNotice(`✨ AI Pre-Filled: ₹${data.amount || 0} (${matched?.name || 'Expense'})! Review & click "Save Expense".`);
    setTimeout(() => setCategoryNotice(null), 6000);
  };

  const handleReceiptScanned = (data: ReceiptScanResponse) => {
    if (data.amount) setAmount(String(data.amount));
    if (data.expense_date) setExpenseDate(String(data.expense_date));
    const matched = matchUserCategory(categories, data.suggested_category_id, data.suggested_category_name);
    if (matched) setCategoryId(String(matched.id));
    if (data.payment_mode) setPaymentMode(data.payment_mode);
    if (data.note || data.merchant_name) {
      setNote(data.note || `${data.merchant_name} Purchase`);
    }
    setCategoryNotice(`📸 Receipt Pre-Filled: ₹${data.amount || 0} (${data.merchant_name || 'Receipt'})! Review & click "Save Expense".`);
    setTimeout(() => setCategoryNotice(null), 6000);
  };





  // Quick date calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  const twoDaysAgo = new Date();
  twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
  const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

  const loadCategories = useCallback(async (selectIdAfter?: number) => {
    try {
      setLoadingCategories(true);
      const data = await categoriesApi.getAll();
      const catList = Array.isArray(data) ? data : [];
      setCategories(catList);

      if (selectIdAfter) {
        setCategoryId(String(selectIdAfter));
      } else if (!initialData && catList.length > 0 && !categoryId) {
        setCategoryId(String(catList[0].id));
      }
    } catch (err: any) {
      setServerError(err.message || 'Failed to load categories.');
    } finally {
      setLoadingCategories(false);
    }
  }, [initialData, categoryId]);

  useEffect(() => {
    loadCategories();
  }, [loadCategories]);

  // Handle Quick Category Create Modal
  const handleOpenCreateCategory = () => {
    setCategoryToEdit(null);
    setIsCategoryModalOpen(true);
  };

  // Handle Quick Category Edit Modal
  const handleOpenEditCategory = (cat: Category, e: React.MouseEvent) => {
    e.stopPropagation();
    setCategoryToEdit(cat);
    setIsCategoryModalOpen(true);
  };

  // Save Category (Inline Create or Update)
  const handleSaveCategory = async (catName: string) => {
    try {
      setIsCategorySubmitting(true);
      if (categoryToEdit) {
        await categoriesApi.update(categoryToEdit.id, { name: catName });
        await loadCategories();
        setCategoryNotice(`Category updated to "${catName}".`);
      } else {
        const created = await categoriesApi.create({ name: catName });
        await loadCategories(created.id);
        setCategoryNotice(`New category "${catName}" created & selected!`);
      }
      setIsCategoryModalOpen(false);
      setTimeout(() => setCategoryNotice(null), 4000);
    } catch (err: any) {
      throw err;
    } finally {
      setIsCategorySubmitting(false);
    }
  };

  // Quick amount modifier
  const handleAddAmount = (addVal: number) => {
    const current = parseFloat(amount) || 0;
    const newTotal = (current + addVal).toFixed(2).replace(/\.00$/, '');
    setAmount(newTotal);
    if (errors.amount) {
      setErrors((prev) => ({ ...prev, amount: undefined }));
    }
  };

  const handleClearAmount = () => {
    setAmount('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError(null);

    const validationErrors = validateExpenseForm(amount, categoryId, expenseDate, note);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit({
        amount: parseFloat(amount),
        category_id: Number(categoryId),
        expense_date: expenseDate,
        payment_mode: paymentMode,
        note: note ? note.trim() : undefined,
      });
    } catch (err: any) {
      setServerError(err.message || 'An error occurred while saving the expense.');
    }
  };

  return (
    <>
      <Toast toasts={toasts} onDismiss={(id) => setToasts((prev) => prev.filter((t) => t.id !== id))} />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="max-w-2xl mx-auto glass-card p-6 sm:p-8 relative overflow-hidden shadow-2xl"
      >
        {/* Inline Category Form Modal */}
        <CategoryFormModal
          isOpen={isCategoryModalOpen}
          category={categoryToEdit}
          onSubmit={handleSaveCategory}
          onClose={() => setIsCategoryModalOpen(false)}
          isSubmitting={isCategorySubmitting}
        />

        {/* Decorative Aura Gradient */}
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-sky-500/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/80">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              {title}
            </h2>
            <p className="text-xs text-slate-400 mt-1">Fill in the details below or use AI Instant Auto-Save</p>
          </div>
          <Link href="/expenses" className="btn-secondary text-xs">
            <ArrowLeft className="w-4 h-4" /> Cancel
          </Link>
        </div>

        <AnimatePresence>
          {serverError && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center gap-2.5"
            >
              <span>{serverError}</span>
            </motion.div>
          )}

          {categoryNotice && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="mb-6 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{categoryNotice}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* AI Quick Actions Banner */}
        <div className="mb-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-sky-950/30 border border-sky-500/20">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <span className="text-xs font-semibold text-slate-200">AI Fast Add (Auto-Saves to DB):</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-slate-800/80 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 hover:border-sky-500/60 text-xs font-medium flex items-center gap-1.5 transition"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Scan Receipt</span>
              </button>

              <button
                type="button"
                onClick={() => setShowVoiceInput(!showVoiceInput)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 border transition ${
                  showVoiceInput
                    ? 'bg-sky-500 text-slate-950 border-sky-400 font-semibold'
                    : 'bg-slate-800/80 hover:bg-sky-500/20 text-sky-400 border-sky-500/30 hover:border-sky-500/60'
                }`}
              >
                <Mic className="w-3.5 h-3.5" />
                <span>{showVoiceInput ? 'Close Voice' : 'Voice / Smart Text'}</span>
              </button>
            </div>

          </div>

          {/* Expandable Voice / NLP Bar */}
          <AnimatePresence>
            {showVoiceInput && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <VoiceExpenseInput
                  onParsed={handleAIParsed}
                  onAutoSave={handleAutoSaveVoice}
                  defaultAutoSave={true}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Receipt Scanner Modal */}
        <ReceiptScannerModal
          isOpen={isScannerOpen}
          onClose={() => setIsScannerOpen(false)}
          onScanned={handleReceiptScanned}
          onAutoSave={handleAutoSaveReceipt}
          defaultAutoSave={true}
        />


      <form onSubmit={handleSubmit} className="space-y-6">


        {/* 1. Hero Amount Field with Dedicated Prefix Box */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <IndianRupee className="w-4 h-4 text-sky-400" /> Expense Amount <span className="text-rose-400">*</span>
            </label>
            {amount && (
              <button
                type="button"
                onClick={handleClearAmount}
                className="text-xs text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className={`flex items-center rounded-xl bg-slate-950/90 border transition-all ${
            errors.amount
              ? 'border-rose-500 shadow-[0_0_12px_rgba(244,63,94,0.3)]'
              : 'border-slate-700/80 focus-within:border-sky-500 focus-within:ring-2 focus-within:ring-sky-500/25'
          }`}>
            <div className="px-4 py-3 bg-slate-900/90 border-r border-slate-800 text-sky-400 font-bold text-xl select-none flex items-center justify-center shrink-0">
              ₹
            </div>
            <input
              type="number"
              step="0.01"
              placeholder="0.00"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                if (errors.amount) setErrors((prev) => ({ ...prev, amount: undefined }));
              }}
              className="w-full bg-transparent px-4 py-3 text-xl font-bold text-white placeholder-slate-600 focus:outline-none"
            />
          </div>
          {errors.amount && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.amount}</p>}

          {/* Quick Amount Selector Pills */}
          <div className="pt-1">
            <div className="text-[11px] font-medium text-slate-400 uppercase tracking-wider mb-2">
              Quick Add Amount
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_AMOUNTS.map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddAmount(val)}
                  className="px-3 py-1.5 rounded-xl bg-slate-900/90 border border-slate-700/70 text-xs font-semibold text-slate-200 hover:border-sky-500/60 hover:bg-sky-600/20 hover:text-sky-200 active:scale-95 transition-all shadow-sm flex items-center gap-1"
                >
                  <span>+₹{val}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Interactive Category Selection with Inline Add & Edit */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-sky-400" /> Category <span className="text-rose-400">*</span>
            </label>
            <button
              type="button"
              onClick={handleOpenCreateCategory}
              className="text-xs text-sky-400 hover:text-sky-300 font-semibold transition-colors flex items-center gap-1 bg-sky-500/10 hover:bg-sky-500/20 px-2.5 py-1 rounded-lg border border-sky-500/25"
            >
              <FolderPlus className="w-3.5 h-3.5" /> + Add Category
            </button>
          </div>

          {loadingCategories ? (
            <div className="h-12 glass-input w-full text-sm text-slate-500 animate-pulse flex items-center">
              Loading dynamic categories...
            </div>
          ) : categories.length === 0 ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center justify-between">
              <span>No categories available. Please create a category first.</span>
              <button
                type="button"
                onClick={handleOpenCreateCategory}
                className="underline font-semibold ml-2"
              >
                Create Category Now
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Category Chips Grid with Inline Edit trigger */}
              <div className="flex flex-wrap gap-2">
                {categories.map((cat) => {
                  const isSelected = String(cat.id) === String(categoryId);
                  return (
                    <div
                      key={cat.id}
                      onClick={() => {
                        setCategoryId(String(cat.id));
                        if (errors.category_id) setErrors((prev) => ({ ...prev, category_id: undefined }));
                      }}
                      className={`group px-3.5 py-2 rounded-xl text-xs font-medium border transition-all flex items-center gap-2 cursor-pointer select-none ${
                        isSelected
                          ? 'bg-sky-500/20 text-sky-200 border-sky-500/80 shadow-[0_0_12px_rgba(14,165,233,0.3)] scale-[1.02]'
                          : 'bg-slate-900/60 text-slate-300 border-slate-800 hover:bg-slate-800/80 hover:border-slate-700'
                      }`}
                    >
                      {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0" />}
                      <span>{cat.name}</span>
                      
                      {/* Inline Edit Icon */}
                      <button
                        type="button"
                        onClick={(e) => handleOpenEditCategory(cat, e)}
                        title={`Edit category "${cat.name}"`}
                        className={`p-1 rounded-md transition-all ${
                          isSelected
                            ? 'text-sky-300 hover:text-white hover:bg-sky-500/30'
                            : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-200 hover:bg-slate-700'
                        }`}
                      >
                        <Edit3 className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Fallback Select for mobile */}
              <select
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (errors.category_id) setErrors((prev) => ({ ...prev, category_id: undefined }));
                }}
                className={`glass-input w-full text-sm sm:hidden mt-2 ${errors.category_id ? 'border-rose-500' : ''}`}
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id} className="bg-slate-900 text-slate-200">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          )}
          {errors.category_id && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.category_id}</p>}
        </div>

        {/* 3. Payment Mode Chips */}
        <div className="space-y-2.5">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <CreditCard className="w-4 h-4 text-cyan-400" /> Payment Mode <span className="text-rose-400">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PAYMENT_MODES.map((mode) => {
              const isSelected = paymentMode === mode.name;
              const Icon = mode.icon;
              return (
                <button
                  key={mode.name}
                  type="button"
                  onClick={() => setPaymentMode(mode.name)}
                  className={`p-3 rounded-xl border text-xs font-medium transition-all flex items-center gap-2.5 text-left ${
                    isSelected
                      ? 'bg-cyan-500/20 text-cyan-200 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                      : `bg-slate-900/60 text-slate-300 border-slate-800/80 hover:bg-slate-800/60 ${mode.border}`
                  }`}
                >
                  <div className={`p-1.5 rounded-lg ${isSelected ? 'bg-cyan-500/30' : 'bg-slate-800'} ${mode.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <span>{mode.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 4. Smart Date Picker with Quick Selectors */}
        <div className="space-y-2.5">
          <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-400" /> Expense Date <span className="text-rose-400">*</span>
          </label>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <button
              type="button"
              onClick={() => {
                setExpenseDate(todayStr);
                if (errors.expense_date) setErrors((prev) => ({ ...prev, expense_date: undefined }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                expenseDate === todayStr
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/70 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                setExpenseDate(yesterdayStr);
                if (errors.expense_date) setErrors((prev) => ({ ...prev, expense_date: undefined }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                expenseDate === yesterdayStr
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/70 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => {
                setExpenseDate(twoDaysAgoStr);
                if (errors.expense_date) setErrors((prev) => ({ ...prev, expense_date: undefined }));
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                expenseDate === twoDaysAgoStr
                  ? 'bg-emerald-600/30 text-emerald-200 border-emerald-500/70 shadow-sm'
                  : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
            >
              2 Days Ago
            </button>
          </div>

          <input
            type="date"
            value={expenseDate}
            onChange={(e) => {
              setExpenseDate(e.target.value);
              if (errors.expense_date) setErrors((prev) => ({ ...prev, expense_date: undefined }));
            }}
            className={`glass-input w-full ${errors.expense_date ? 'border-rose-500' : ''}`}
          />
          {errors.expense_date && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.expense_date}</p>}
        </div>

        {/* 5. Note Field */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-sm font-semibold text-slate-200 flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-400" /> Note / Description (Optional)
            </label>
            <span className={`text-xs ${note.length > 450 ? 'text-amber-400 font-semibold' : 'text-slate-500'}`}>
              {note.length}/500
            </span>
          </div>
          <textarea
            rows={3}
            placeholder="e.g. Lunch at Cafe, Grocery shopping, Monthly electricity bill..."
            value={note}
            onChange={(e) => {
              setNote(e.target.value);
              if (errors.note) setErrors((prev) => ({ ...prev, note: undefined }));
            }}
            className={`glass-input w-full resize-none ${errors.note ? 'border-rose-500' : ''}`}
          />
          {errors.note && <p className="text-xs text-rose-400 mt-1 font-medium">{errors.note}</p>}
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-6 border-t border-slate-800/80">
          <Link href="/expenses" className="btn-secondary text-sm">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting || categories.length === 0}
            className="btn-primary text-sm px-6 py-2.5 shadow-lg shadow-sky-500/25 hover:shadow-sky-500/40 active:scale-[0.98] disabled:opacity-50 transition-all font-semibold"
          >
            <Save className="w-4 h-4" />
            {isSubmitting ? 'Saving Transaction...' : 'Save Expense'}
          </button>
        </div>

      </form>
    </motion.div>
    </>
  );
}

