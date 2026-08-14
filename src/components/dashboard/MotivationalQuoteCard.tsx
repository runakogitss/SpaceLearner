import React, { useState } from 'react';
import { Quote, RefreshCw, Copy, Check, Sparkles, Zap } from 'lucide-react';
import { getDailyQuote, getRandomQuote, QuoteItem } from '../../data/quotes';
import { DailyMotivationalModal } from '../modals/DailyMotivationalModal';

export const MotivationalQuoteCard: React.FC = () => {
  const [currentQuote, setCurrentQuote] = useState<QuoteItem>(getDailyQuote());
  const [isCopied, setIsCopied] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const handleShuffle = () => {
    setCurrentQuote(getRandomQuote(currentQuote.id));
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(`"${currentQuote.quote}" — ${currentQuote.author}`);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <>
      <div className="bg-gradient-to-tr from-indigo-950/90 via-purple-950/80 to-slate-900 border border-purple-500/30 rounded-3xl p-5 relative overflow-hidden flex flex-col justify-between shadow-glow-card group">
        {/* Subtle Background Glow */}
        <div className="absolute right-0 bottom-0 w-36 h-36 bg-purple-600/15 rounded-full blur-2xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-center justify-between z-10 mb-3">
          <div className="flex items-center gap-2">
            <Quote className="w-5 h-5 text-purple-400 opacity-80" />
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-300 bg-purple-950/60 border border-purple-500/30 px-2 py-0.5 rounded-full">
              Quote of the Day
            </span>
            <span className="text-xs">{currentQuote.emoji}</span>
          </div>

          {/* Action Icons */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowModal(true)}
              className="p-1.5 rounded-xl bg-purple-900/40 hover:bg-purple-800/60 border border-purple-500/30 text-purple-200 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1"
              title="Open Daily Focus Boost Modal"
            >
              <Sparkles className="w-3.5 h-3.5 text-yellow-400" />
              <span className="hidden sm:inline">Boost</span>
            </button>

            <button
              onClick={handleShuffle}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
              title="Shuffle another quote"
            >
              <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
            </button>

            <button
              onClick={handleCopy}
              className="p-1.5 rounded-xl bg-slate-800/60 hover:bg-slate-700/80 border border-slate-700/80 text-slate-300 hover:text-white transition-all"
              title="Copy quote to clipboard"
            >
              {isCopied ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-purple-300" />
              )}
            </button>
          </div>
        </div>

        {/* Quote Content */}
        <div className="relative z-10 my-1">
          <p className="text-xs md:text-sm font-medium text-slate-100 leading-relaxed italic">
            &ldquo;{currentQuote.quote}&rdquo;
          </p>
          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-purple-300 font-semibold">
              — {currentQuote.author}
            </span>
            <span className="text-[10px] font-bold text-slate-400 bg-slate-900/60 px-2 py-0.5 rounded-md border border-slate-800">
              #{currentQuote.category}
            </span>
          </div>
        </div>

        {/* Actionable Focus Tip Footer */}
        <div className="mt-3 pt-2.5 border-t border-purple-500/20 flex items-center gap-2 z-10">
          <Zap className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
          <p className="text-[11px] text-slate-300 truncate">
            <span className="font-semibold text-yellow-300">Tip:</span> {currentQuote.tip}
          </p>
        </div>
      </div>

      {/* Daily Motivational Modal */}
      {showModal && (
        <DailyMotivationalModal 
          isOpen={showModal} 
          onClose={() => setShowModal(false)}
          isManualTrigger={true}
        />
      )}
    </>
  );
};
