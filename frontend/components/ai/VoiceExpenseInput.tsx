'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Send, Loader2, Volume2, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { aiApi, ExpenseParseResponse } from '@/lib/api/ai';

interface VoiceExpenseInputProps {
  onParsed?: (data: ExpenseParseResponse) => void;
  onAutoSave?: (data: ExpenseParseResponse) => Promise<void> | void;
  defaultAutoSave?: boolean;
}

export function VoiceExpenseInput({
  onParsed,
  onAutoSave,
  defaultAutoSave = true,
}: VoiceExpenseInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [autoSave, setAutoSave] = useState(defaultAutoSave && !!onAutoSave);
  const [lang, setLang] = useState<'mr-IN' | 'en-IN' | 'hi-IN'>('en-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef('');

  // Keep a ref to handleParse so recognition callbacks don't suffer from stale closures
  const handleParseRef = useRef<(inputToParse?: string) => Promise<void>>();

  const handleParse = useCallback(
    async (inputToParse?: string) => {
      const targetText = inputToParse || text;
      if (!targetText.trim() || isParsing) return;

      try {
        setIsParsing(true);
        setErrorMessage(null);
        setSuccessNotice(null);

        const res = await aiApi.parseExpense(targetText);

        if (autoSave && onAutoSave) {
          setSuccessNotice(`⚡ Auto-saving ₹${res.amount || 0} (${res.suggested_category_name || 'Expense'})...`);
          await onAutoSave(res);
          setText('');
          setSuccessNotice(`✅ Auto-Saved ₹${res.amount || 0} (${res.suggested_category_name || 'Expense'})!`);
        } else if (onParsed) {
          onParsed(res);
          setText('');
          setSuccessNotice(`✨ Form filled with ₹${res.amount || 0} (${res.suggested_category_name || 'Expense'})!`);
        }

        setTimeout(() => setSuccessNotice(null), 5000);
      } catch (err: any) {
        setErrorMessage(err?.message || 'AI parsing failed. Please check the entered text.');
      } finally {
        setIsParsing(false);
      }
    },
    [text, isParsing, autoSave, onAutoSave, onParsed]
  );

  useEffect(() => {
    handleParseRef.current = handleParse;
  }, [handleParse]);

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: any) => {
        // Collect entire transcript across all result segments to never drop previous words
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript;
        }
        if (fullTranscript.trim()) {
          setText(fullTranscript);
          lastTranscriptRef.current = fullTranscript;
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setErrorMessage('Could not recognize voice. Please grant microphone permission or type below.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        const spoken = lastTranscriptRef.current;
        if (spoken && spoken.trim()) {
          lastTranscriptRef.current = '';
          handleParseRef.current?.(spoken);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!recognitionRef.current) {
      setErrorMessage('Voice input is not supported in this browser. You can type directly in the box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      const spoken = lastTranscriptRef.current;
      if (spoken && spoken.trim()) {
        lastTranscriptRef.current = '';
        handleParse(spoken);
      }
    } else {
      try {
        lastTranscriptRef.current = '';
        recognitionRef.current.lang = lang;
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition start failed:', err);
      }
    }
  };

  const sampleChips = [
    'Paid ₹450 for groceries at D-Mart yesterday',
    'Petrol ₹500 today via UPI',
    'Dinner with friends ₹850 via Card',
    'काल चहा नाश्ता ₹120 Cash',
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-sky-950/40 via-slate-900/70 to-cyan-950/40 border border-sky-500/25 shadow-xl shadow-sky-950/30">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              Smart Voice & Text Entry
              {autoSave && onAutoSave && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Zap className="w-3 h-3 fill-amber-300" /> Auto-Save Active
                </span>
              )}
            </h4>
            <p className="text-[11px] text-slate-400">
              {autoSave && onAutoSave
                ? 'Speak or type — automatically saves expense with instant Undo'
                : 'Speak or type to extract and pre-fill form fields'}
            </p>
          </div>
        </div>

        {/* Controls: Auto-Save switch & Language Switcher */}
        <div className="flex items-center gap-2">
          {onAutoSave && (
            <button
              type="button"
              onClick={() => setAutoSave(!autoSave)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 border transition ${
                autoSave
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
              }`}
              title={autoSave ? 'Auto-Save is ON (Direct Save)' : 'Auto-Save is OFF (Review First)'}
            >
              <Zap className={`w-3.5 h-3.5 ${autoSave ? 'fill-amber-300' : ''}`} />
              <span>{autoSave ? 'Auto-Save ON' : 'Fill Form'}</span>
            </button>
          )}

          <div className="flex items-center gap-1 text-[11px] bg-slate-950/70 px-2 py-1 rounded-lg border border-slate-800">
            <button
              type="button"
              onClick={() => setLang('en-IN')}
              className={`px-2 py-0.5 rounded transition ${
                lang === 'en-IN' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLang('mr-IN')}
              className={`px-2 py-0.5 rounded transition ${
                lang === 'mr-IN' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              MR
            </button>
          </div>
        </div>
      </div>

      {/* Input row */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleParse();
              }
            }}
            placeholder={
              isListening
                ? '🎙️ Listening... Speak naturally (e.g. "Dinner ₹600 via UPI")'
                : autoSave && onAutoSave
                ? 'Speak or type to instantly save (e.g. "Petrol ₹500 via UPI")...'
                : 'Speak or type to auto-fill (e.g. "Coffee ₹150 with friends")...'
            }
            className={`glass-input w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 transition-all ${
              isListening
                ? 'border-sky-400 ring-2 ring-sky-500/40 bg-sky-950/40 placeholder-sky-300 text-sky-100'
                : 'border-slate-700/80 focus:border-sky-500'
            }`}
          />

          {text && !isParsing && (
            <button
              type="button"
              onClick={() => setText('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-200"
            >
              ✕
            </button>
          )}
        </div>

        {/* Mic Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-lg ${
            isListening
              ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40 animate-pulse ring-4 ring-rose-500/20'
              : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 shadow-sky-500/20 active:scale-95'
          }`}
          title={isListening ? 'Click to stop & auto-save' : 'Click to speak'}
        >
          {isListening ? (
            <>
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-rose-500"></span>
              </span>
              <MicOff className="w-5 h-5" />
            </>
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>

        {/* Submit / Action button */}
        <button
          type="button"
          disabled={!text.trim() || isParsing}
          onClick={() => handleParse()}
          className={`text-xs py-2.5 px-4 rounded-xl font-bold flex items-center gap-1.5 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed ${
            autoSave && onAutoSave
              ? 'bg-gradient-to-r from-amber-500 to-amber-400 text-slate-950 hover:from-amber-400 hover:to-amber-300 shadow-amber-500/20'
              : 'btn-primary shadow-sky-500/20'
          }`}
        >
          {isParsing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>{autoSave ? 'Saving...' : 'Parsing...'}</span>
            </>
          ) : (
            <>
              {autoSave && onAutoSave ? <Zap className="w-3.5 h-3.5 fill-slate-950" /> : <Send className="w-3.5 h-3.5" />}
              <span>{autoSave && onAutoSave ? 'Auto Save' : 'Fill Form'}</span>
            </>
          )}
        </button>
      </div>

      {/* Success Notification */}
      {successNotice && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-emerald-400 mt-2.5 flex items-center gap-1.5 font-medium"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>{successNotice}</span>
        </motion.p>
      )}

      {/* Error notification */}
      {errorMessage && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-amber-400 mt-2.5 flex items-center gap-1"
        >
          <span>⚠️</span> {errorMessage}
        </motion.p>
      )}

      {/* Suggested prompt chips */}
      <div className="flex flex-wrap items-center gap-1.5 mt-3">
        <span className="text-[11px] text-slate-400 flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-sky-400" /> Try Examples:
        </span>
        {sampleChips.map((chip, i) => (
          <button
            key={i}
            type="button"
            onClick={() => {
              setText(chip);
              handleParse(chip);
            }}
            className="text-[11px] bg-slate-800/60 hover:bg-sky-950 hover:text-sky-300 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50 hover:border-sky-500/40 transition flex items-center gap-1"
          >
            <span>{chip}</span>
            <ArrowRight className="w-2.5 h-2.5 text-slate-500" />
          </button>
        ))}
      </div>
    </div>
  );
}
