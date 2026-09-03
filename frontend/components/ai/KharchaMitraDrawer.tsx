'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Loader2,
  ChevronRight,
  TrendingDown,
  HelpCircle,
  Minimize2
} from 'lucide-react';
import { aiApi, AIChatMessage, SuggestedAction } from '@/lib/api/ai';

export function KharchaMitraDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [messages, setMessages] = useState<AIChatMessage[]>([
    {
      role: 'assistant',
      content:
        "Hello! I am **Kharcha AI**, your smart personal financial assistant & copilot. 🚀\nAsk me anything about your monthly spending, budget forecasts, or smart ways to save money!",
    },
  ]);
  const [suggestedActions, setSuggestedActions] = useState<SuggestedAction[]>([
    { label: 'View All Expenses', href: '/expenses' },
    { label: 'Check Budgets', href: '/budgets' },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = async (customPrompt?: string) => {
    const textToSend = customPrompt || inputMessage;
    if (!textToSend.trim() || isThinking) return;

    const userMsg: AIChatMessage = { role: 'user', content: textToSend };
    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsThinking(true);

    try {
      const res = await aiApi.chat(textToSend, messages);
      setMessages((prev) => [...prev, { role: 'assistant', content: res.reply }]);
      if (res.suggested_actions && res.suggested_actions.length > 0) {
        setSuggestedActions(res.suggested_actions);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Kharcha AI is currently busy or connecting to the server. Please try again shortly.',
        },
      ]);
    } finally {
      setIsThinking(false);
    }
  };

  const quickPills = [
    'How much did I spend this month?',
    'What is my highest expense category?',
    'Tips to save money',
    'Am I on track with my budget?',
  ];

  return (
    <>
      {/* Floating Launcher Button */}
      <motion.button
        id="kharcha-mitra-launcher"
        type="button"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 px-4 py-3 rounded-full bg-gradient-to-r from-sky-500 via-cyan-500 to-blue-600 text-slate-950 font-bold text-xs sm:text-sm flex items-center gap-2 shadow-[0_10px_30px_rgba(14,165,233,0.5)] border border-sky-300/60 hover:shadow-sky-400/70 transition cursor-pointer"
      >
        <Bot className="w-5 h-5 animate-pulse" />
        <span>Kharcha AI</span>
        <Sparkles className="w-3.5 h-3.5 text-amber-200" />
      </motion.button>


      {/* Slide-over Drawer */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            />

            {/* Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-md bg-slate-900 border-l border-sky-500/20 shadow-2xl flex flex-col h-full z-10"
            >
              {/* Drawer Header */}
              <div className="px-5 py-4 border-b border-slate-800 bg-slate-950/80 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/30 to-cyan-500/10 text-sky-400 border border-sky-500/30 shadow-inner">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-100 text-sm flex items-center gap-1.5">
                      Kharcha AI <span className="text-[11px] font-normal px-2 py-0.5 rounded-full bg-sky-500/20 text-sky-300">Copilot</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Your Smart Personal Financial Advisor</p>
                  </div>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3 text-xs">
                {messages.map((m, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-2.5 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    {m.role === 'assistant' && (
                      <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/30">
                        <Bot className="w-4 h-4" />
                      </div>
                    )}
                    <div
                      className={`max-w-[82%] px-3.5 py-2.5 rounded-2xl leading-relaxed whitespace-pre-wrap ${
                        m.role === 'user'
                          ? 'bg-gradient-to-r from-sky-600 to-cyan-600 text-slate-100 rounded-tr-none shadow-md'
                          : 'bg-slate-800/80 text-slate-200 border border-slate-700/60 rounded-tl-none shadow-sm'
                      }`}
                    >
                      {m.content}
                    </div>
                  </div>
                ))}

                {isThinking && (
                  <div className="flex gap-2.5 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center flex-shrink-0 border border-sky-500/30">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="px-3.5 py-2.5 rounded-2xl bg-slate-800/80 text-slate-400 border border-slate-700/60 rounded-tl-none flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />
                      <span>Kharcha AI is analyzing your finances...</span>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Suggested Actions Navigation Pills */}
              {suggestedActions.length > 0 && (
                <div className="px-4 py-2 bg-slate-950/40 border-t border-slate-800/60 flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-500 self-center">Quick Actions:</span>
                  {suggestedActions.map((action, i) => (
                    <Link
                      key={i}
                      href={action.href}
                      onClick={() => setIsOpen(false)}
                      className="px-2.5 py-1 text-[11px] rounded-lg bg-sky-950/60 text-sky-300 border border-sky-500/30 hover:bg-sky-500/20 transition flex items-center gap-1"
                    >
                      <span>{action.label}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  ))}
                </div>
              )}

              {/* Quick Questions Carousel */}
              <div className="px-4 py-2 bg-slate-950/60 border-t border-slate-800/60 flex gap-1.5 overflow-x-auto no-scrollbar">
                {quickPills.map((pill, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleSend(pill)}
                    className="whitespace-nowrap px-2.5 py-1 text-[11px] rounded-lg bg-slate-800/60 hover:bg-slate-700 text-slate-300 border border-slate-700/50 transition flex-shrink-0"
                  >
                    {pill}
                  </button>
                ))}
              </div>

              {/* Message Input Footer */}
              <div className="p-3 border-t border-slate-800 bg-slate-950/90">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                  className="flex items-center gap-2"
                >
                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    placeholder="Ask Kharcha AI (e.g. How can I save ₹2,000 this month?)..."
                    className="flex-1 bg-slate-900 text-xs text-slate-100 placeholder-slate-500 rounded-xl px-3.5 py-2.5 border border-slate-700/80 focus:border-sky-500 outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!inputMessage.trim() || isThinking}
                    className="p-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 text-slate-950 hover:from-sky-400 hover:to-cyan-400 disabled:opacity-40 transition shadow-md shadow-sky-500/20"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
