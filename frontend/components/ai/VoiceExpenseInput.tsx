'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Sparkles, Send, Loader2, Volume2 } from 'lucide-react';
import { aiApi, ExpenseParseResponse } from '@/lib/api/ai';

interface VoiceExpenseInputProps {
  onParsed: (data: ExpenseParseResponse) => void;
}

export function VoiceExpenseInput({ onParsed }: VoiceExpenseInputProps) {
  const [text, setText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [lang, setLang] = useState<'mr-IN' | 'en-IN' | 'hi-IN'>('mr-IN');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);

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
        setText(transcript);
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          setErrorMessage('Could not recognize voice. Please try typing your expense.');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [lang]);

  const toggleListening = () => {
    setErrorMessage(null);
    if (!recognitionRef.current) {
      setErrorMessage('Voice input is not supported in this browser. Please type your expense.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
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
      const res = await aiApi.parseExpense(targetText);
      onParsed(res);
      setText('');
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
            Smart Voice & Text Entry <span className="text-xs text-sky-400 font-normal">(Multilingual AI)</span>
          </h4>
        </div>

        {/* Language selector pill */}
        <div className="flex items-center bg-slate-800/80 rounded-lg p-0.5 border border-slate-700/60 text-xs">
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
                ? 'Listening... Speak now (e.g. Spent ₹350 on lunch yesterday)...'
                : 'e.g. Paid ₹450 for groceries at D-Mart yesterday via UPI...'
            }
            className={`w-full bg-slate-900/90 text-sm text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 border transition outline-none ${
              isListening
                ? 'border-red-500 ring-2 ring-red-500/20 animate-pulse'
                : 'border-slate-700/70 focus:border-sky-500 focus:ring-1 focus:ring-sky-500/30'
            }`}
          />
        </div>

        {/* Mic toggle button */}
        <button
          type="button"
          onClick={toggleListening}
          title={isListening ? 'Stop Listening' : 'Start Voice Input'}
          className={`p-2.5 rounded-xl border transition flex items-center justify-center ${
            isListening
              ? 'bg-red-500/20 text-red-400 border-red-500 animate-bounce'
              : 'bg-slate-800/80 text-sky-400 border-sky-500/30 hover:bg-sky-500/20 hover:border-sky-500/60'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>

        {/* Submit parse button */}
        <button
          type="button"
          disabled={!text.trim() || isParsing}
          onClick={() => handleParse()}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 font-semibold text-xs flex items-center gap-1.5 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-md shadow-sky-500/20"
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

      {/* Error display */}
      {errorMessage && (
        <p className="text-xs text-amber-400 mt-2 flex items-center gap-1">
          <span>⚠️</span> {errorMessage}
        </p>
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

