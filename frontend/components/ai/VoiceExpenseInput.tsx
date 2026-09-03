'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Send, Loader2, Volume2, CheckCircle2 } from 'lucide-react';
import { aiApi, ExpenseParseResponse } from '@/lib/api/ai';

interface VoiceExpenseInputProps {
  onParsed: (data: ExpenseParseResponse) => void;
}

export function VoiceExpenseInput({ onParsed }: VoiceExpenseInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [lang, setLang] = useState<'mr-IN' | 'en-IN' | 'hi-IN'>('en-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const lastTranscriptRef = useRef('');

  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = lang;

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setText(transcript);
          lastTranscriptRef.current = transcript;
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setErrorMessage('Could not recognize voice. Please allow microphone or type your expense.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        // Automatically parse as soon as the user stops speaking!
        if (lastTranscriptRef.current && lastTranscriptRef.current.trim()) {
          const spoken = lastTranscriptRef.current;
          lastTranscriptRef.current = '';
          handleParse(spoken);
        }
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    setErrorMessage(null);
    setSuccessNotice(null);

    if (!recognitionRef.current) {
      setErrorMessage('Voice input is not supported in this browser. Please type your expense in the box.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
      if (lastTranscriptRef.current && lastTranscriptRef.current.trim()) {
        const spoken = lastTranscriptRef.current;
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

  const handleParse = async (inputToParse?: string) => {
    const targetText = inputToParse || text;
    if (!targetText.trim() || isParsing) return;

    try {
      setIsParsing(true);
      setErrorMessage(null);
      setSuccessNotice(null);
      const res = await aiApi.parseExpense(targetText);
      onParsed(res);
      setText('');
      setSuccessNotice(`Parsed ₹${res.amount || 0} (${res.suggested_category_name || 'Expense'})! Form updated.`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err: any) {
      setErrorMessage(err?.message || 'AI parsing failed. Please check the entered text.');
    } finally {
      setIsParsing(false);
    }
  };

  const sampleChips = [
    'Paid ₹450 for groceries at D-Mart yesterday',
    'Petrol ₹500 today via UPI',
    'Dinner with friends ₹850 via Card',
    'Auto rickshaw fare ₹120 cash',
  ];

  return (
    <div className="rounded-2xl p-4 sm:p-5 bg-gradient-to-r from-sky-950/40 via-slate-900/60 to-cyan-950/40 border border-sky-500/20 shadow-lg shadow-sky-950/30">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-sky-500/20 text-sky-400 border border-sky-500/30">
            <Sparkles className="w-4 h-4" />
          </span>
          <h4 className="text-sm font-semibold text-slate-200">
            Smart Voice & Text Entry <span className="text-xs text-sky-400 font-normal">(Auto-fills form)</span>
          </h4>
        </div>

        {/* Language Switcher */}
        <div className="flex items-center gap-1 text-[11px] bg-slate-950/60 px-2 py-1 rounded-lg border border-slate-800">
          <span className="text-slate-400">Language:</span>
          <button
            type="button"
            onClick={() => setLang('en-IN')}
            className={`px-2 py-0.5 rounded transition ${
              lang === 'en-IN' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            English
          </button>
          <button
            type="button"
            onClick={() => setLang('mr-IN')}
            className={`px-2 py-0.5 rounded transition ${
              lang === 'mr-IN' ? 'bg-sky-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Marathi
          </button>
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
                ? '🎙️ Listening... Speak now (e.g. "Dinner ₹600 via UPI")'
                : 'Type or click mic to speak (e.g. "Coffee ₹150 with friends")...'
            }
            className={`glass-input w-full text-xs sm:text-sm pl-4 pr-10 py-2.5 transition-all ${
              isListening
                ? 'border-sky-400 ring-2 ring-sky-500/30 bg-sky-950/30 placeholder-sky-300'
                : 'border-slate-700/80 focus:border-sky-500'
            }`}
          />

          {/* Inline Clear Button if text present */}
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

        {/* Mic Toggle Button */}
        <button
          type="button"
          onClick={toggleListening}
          className={`relative p-2.5 rounded-xl border transition-all flex items-center justify-center shadow-lg ${
            isListening
              ? 'bg-rose-500 border-rose-400 text-white shadow-rose-500/40 animate-pulse'
              : 'bg-sky-500/20 hover:bg-sky-500/30 border-sky-500/40 text-sky-300 shadow-sky-500/20'
          }`}
          title={isListening ? 'Click to stop & auto-fill' : 'Click to speak'}
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

        {/* Submit / Parse button */}
        <button
          type="button"
          disabled={!text.trim() || isParsing}
          onClick={() => handleParse()}
          className="btn-primary text-xs py-2.5 px-4 flex items-center gap-1.5 shadow-md shadow-sky-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isParsing ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing...</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Fill Form</span>
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

      {/* Error display */}
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
            className="text-[11px] bg-slate-800/60 hover:bg-sky-950 hover:text-sky-300 text-slate-300 px-2.5 py-1 rounded-lg border border-slate-700/50 hover:border-sky-500/40 transition"
          >
            {chip}
          </button>
        ))}
      </div>
    </div>
  );
}
