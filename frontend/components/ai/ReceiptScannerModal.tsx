'use client';

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, Upload, X, Check, Loader2, Sparkles, AlertCircle, Zap, FileText } from 'lucide-react';
import { aiApi, ReceiptScanResponse } from '@/lib/api/ai';

interface ReceiptScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScanned?: (data: ReceiptScanResponse) => void;
  onAutoSave?: (data: ReceiptScanResponse) => Promise<void> | void;
  defaultAutoSave?: boolean;
}

export function ReceiptScannerModal({
  isOpen,
  onClose,
  onScanned,
  onAutoSave,
  defaultAutoSave = true,
}: ReceiptScannerModalProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(defaultAutoSave && !!onAutoSave);
  const [error, setError] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ReceiptScanResponse | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Immediately clear previous scan result and errors to prevent showing stale state
    setError(null);
    setScanResult(null);

    const file = e.target.files?.[0];
    // Reset file input value so selecting the same or new file will always fire onChange
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select a valid image file (JPEG, PNG, WebP, HEIC).');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Image file size must be less than 5MB.');
      return;
    }

    // Clean up previous preview URL to prevent memory leaks
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }

    setImageFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    runScan(file);
  };

  const runScan = async (file: File) => {
    try {
      setIsScanning(true);
      setError(null);
      setScanResult(null);
      const res = await aiApi.scanReceipt(file);
      setScanResult(res);
      if (res.confidence < 0.2 && !res.amount && !res.merchant_name) {
        setError('No legible transaction or receipt detected in this image. Please upload a clear photo of a bill or invoice.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to scan receipt. Please ensure the image is clear and try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleApply = async () => {
    if (!scanResult) return;

    if (autoSaveEnabled && onAutoSave) {
      try {
        setIsSaving(true);
        await onAutoSave(scanResult);
        handleClose();
      } catch (err: any) {
        setError(err.message || 'Auto-save failed.');
      } finally {
        setIsSaving(false);
      }
    } else if (onScanned) {
      onScanned(scanResult);
      handleClose();
    }
  };

  const handleClose = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setImageFile(null);
    setPreviewUrl(null);
    setScanResult(null);
    setError(null);
    setIsScanning(false);
    setIsSaving(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-lg bg-slate-900/95 border border-sky-500/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-1.5">
                AI Receipt Scanner <Sparkles className="w-3.5 h-3.5 text-sky-400" />
              </h3>
              <p className="text-xs text-slate-400">Scan bills, invoices, restaurant or fuel receipts</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />

          {!previewUrl ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-sky-500/30 hover:border-sky-400 rounded-2xl p-8 text-center cursor-pointer transition bg-slate-950/40 hover:bg-sky-950/20 group"
            >
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-sky-500/10 text-sky-400 flex items-center justify-center group-hover:scale-110 transition border border-sky-500/20 shadow-lg shadow-sky-500/10">
                <Upload className="w-7 h-7" />
              </div>
              <p className="text-sm font-semibold text-slate-200">Select or drop receipt image here</p>
              <p className="text-xs text-slate-400 mt-1">JPEG, PNG, WebP (Max size 5MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Image Preview with Laser Scanning Animation */}
              <div className="relative rounded-xl overflow-hidden border border-slate-700/60 bg-black max-h-56 flex items-center justify-center">
                <img
                  src={previewUrl}
                  alt="Receipt Preview"
                  className="max-h-56 object-contain w-full"
                />
                {isScanning && (
                  <div className="absolute inset-0 bg-sky-900/30 flex flex-col items-center justify-center">
                    <motion.div
                      animate={{ y: [-100, 100, -100] }}
                      transition={{ repeat: Infinity, duration: 2, ease: 'linear' }}
                      className="w-full h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8]"
                    />
                    <div className="mt-4 px-3 py-1.5 rounded-full bg-slate-950/90 border border-sky-500/40 text-sky-400 text-xs font-semibold flex items-center gap-2 backdrop-blur">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Extracting receipt fields with AI...
                    </div>
                  </div>
                )}
              </div>

              {/* Parsed Results Card */}
              {scanResult && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-sky-950/40 border border-sky-500/30 space-y-2.5 text-xs text-slate-300"
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="font-semibold text-sky-400 text-sm flex items-center gap-1.5">
                      <Check className="w-4 h-4 text-emerald-400" /> Receipt Details Extracted!
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono text-[11px]">
                      {Math.round(scanResult.confidence * 100)}% Confidence
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-400">Amount:</span>{' '}
                      <strong className="text-slate-100 text-sm font-mono text-emerald-300">
                        ₹{scanResult.amount ? Number(scanResult.amount).toFixed(2) : '0.00'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Date:</span>{' '}
                      <strong className="text-slate-100 font-mono">
                        {scanResult.expense_date || 'Today'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Merchant:</span>{' '}
                      <strong className="text-slate-100">
                        {scanResult.merchant_name || 'N/A'}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400">Category:</span>{' '}
                      <strong className="text-sky-300 font-semibold">
                        {scanResult.suggested_category_name || 'General'}
                      </strong>
                    </div>
                  </div>

                  {scanResult.note && (
                    <div className="pt-1 text-[11px] text-slate-400 border-t border-slate-800">
                      <strong>Notes:</strong> {scanResult.note}
                    </div>
                  )}
                </motion.div>
              )}

              {/* Reselect Button */}
              <div className="flex items-center justify-between">
                {onAutoSave && (
                  <button
                    type="button"
                    onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}
                    className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5"
                  >
                    <span
                      className={`w-3.5 h-3.5 rounded flex items-center justify-center border ${
                        autoSaveEnabled ? 'bg-amber-500 border-amber-400 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {autoSaveEnabled && <Check className="w-3 h-3 stroke-[3]" />}
                    </span>
                    <span>Direct Auto-Save to database</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-sky-400 hover:text-sky-300 underline ml-auto"
                >
                  Upload different receipt
                </button>
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-xl bg-red-950/40 border border-red-500/30 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Sticky Footer */}
        <div className="flex-shrink-0 flex items-center justify-between gap-3 px-5 py-3.5 border-t border-slate-800 bg-slate-950 sticky bottom-0 z-20">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-slate-200 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!scanResult || isScanning || isSaving}
            onClick={handleApply}
            className={`px-6 py-2.5 text-xs font-bold rounded-xl transition flex items-center gap-2 shadow-xl ${
              !scanResult || isScanning || isSaving
                ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                : autoSaveEnabled && onAutoSave
                ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/30 ring-2 ring-amber-400/50 cursor-pointer'
                : 'bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 hover:from-sky-400 hover:to-cyan-400 shadow-sky-500/30 ring-2 ring-sky-400/50 cursor-pointer'
            }`}
          >
            {isScanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-sky-400" />
                <span>Scanning Receipt...</span>
              </>
            ) : isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving to Database...</span>
              </>
            ) : !scanResult ? (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Upload Receipt to Submit</span>
              </>
            ) : autoSaveEnabled && onAutoSave ? (
              <>
                <Zap className="w-4 h-4 fill-slate-950" />
                <span>Submit & Auto-Save (₹{scanResult.amount ? Number(scanResult.amount).toFixed(2) : '0'})</span>
              </>
            ) : (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Submit to Form (₹{scanResult.amount ? Number(scanResult.amount).toFixed(2) : '0'})</span>
              </>
            )}
          </button>
        </div>

      </motion.div>
    </div>
  );
}
