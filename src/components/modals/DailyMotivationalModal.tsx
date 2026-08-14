import React, { useState, useEffect } from 'react';
import { Sparkles, Quote, CheckCircle, Zap, RefreshCw, X, Play } from 'lucide-react';
import { getDailyQuote, getRandomQuote, QuoteItem } from '../../data/quotes';
import { useStudyStore } from '../../store/useStudyStore';

interface DailyMotivationalModalProps {
  isOpen?: boolean;
  onClose?: () => void;
  isManualTrigger?: boolean;
}

export const DailyMotivationalModal: React.FC<DailyMotivationalModalProps> = ({
  isOpen: propsIsOpen,
  onClose: propsOnClose,
  isManualTrigger = false
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<QuoteItem>(getDailyQuote());
  const [isCopied, setIsCopied] = useState(false);
  
  const { setActiveTab, toggleTimer, isTimerRunning } = useStudyStore();

  useEffect(() => {
    // Check if auto-popup should trigger on initial daily login
    if (propsIsOpen !== undefined) {
      setInternalIsOpen(propsIsOpen);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const lastSeenDate = localStorage.getItem('space_learner_last_motivation_date');

    if (lastSeenDate !== todayStr && !isManualTrigger) {
      setInternalIsOpen(true);
      localStorage.setItem('space_learner_last_motivation_date', todayStr);
    }
  }, [propsIsOpen, isManualTrigger]);

  const handleClose = () => {
    setInternalIsOpen(false);
    if (propsOnClose) propsOnClose();
  };

  const handleStartTimer = () => {
    handleClose();
    setActiveTab('timer');
    if (!isTimerRunning) {
      toggleTimer();
    }
  };

  const handleNextQuote = () => {
    const next = getRandomQuote(currentQuote.id);
    setCurrentQuote(next);
  };

  if (!internalIsOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
      <div 
        className="relative w-full max-w-lg overflow-hidden border bg-gradient-to-b from-slate-900 via-indigo-950/90 to-purple-950/95 border-purple-500/30 rounded-3xl p-6 md:p-8 shadow-2xl shadow-purple-900/40 transform transition-all animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle Background Elements */}
        <div className="absolute -right-12 -top-12 w-48 h-48 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -left-12 -bottom-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-full bg-slate-800/50 hover:bg-slate-700/80 transition-all z-20"
          title="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Badge */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-400/30 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-4">
          <Sparkles className="w-3.5 h-3.5 text-yellow-400 animate-pulse" />
          <span>Daily Focus Boost</span>
          <span className="text-xl leading-none">{currentQuote.emoji}</span>
        </div>

        {/* Main Title */}
        <h2 className="text-xl md:text-2xl font-extrabold font-outfit text-white mb-4 tracking-tight">
          Ready to Elevate Your Mind Today?
        </h2>

        {/* Quote Card Box */}
        <div className="relative bg-indigo-950/60 border border-purple-500/20 rounded-2xl p-5 mb-5 shadow-inner">
          <Quote className="w-7 h-7 text-purple-400/40 mb-2" />
          <p className="text-sm md:text-base font-medium text-slate-100 italic leading-relaxed">
            &ldquo;{currentQuote.quote}&rdquo;
          </p>
          <div className="mt-3 flex items-center justify-between">
            <span className="text-xs font-semibold text-purple-300">
              — {currentQuote.author}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-purple-900/60 text-purple-200 border border-purple-500/30">
              #{currentQuote.category}
            </span>
          </div>
        </div>

        {/* Actionable Focus Tip */}
        <div className="bg-purple-950/40 border border-purple-500/30 rounded-2xl p-4 mb-6 flex items-start gap-3">
          <div className="p-2 rounded-xl bg-purple-500/20 text-yellow-400 shrink-0 mt-0.5">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-yellow-300 uppercase tracking-wider block mb-1">
              Today's Focus Action
            </span>
            <p className="text-xs text-slate-300 leading-relaxed">
              {currentQuote.tip}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 z-10 relative">
          <button
            onClick={handleStartTimer}
            className="w-full sm:flex-1 py-3 px-5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs md:text-sm tracking-wide uppercase shadow-lg shadow-purple-900/50 flex items-center justify-center gap-2 transition-all transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Start 25m Focus Session</span>
          </button>

          <button
            onClick={handleNextQuote}
            className="w-full sm:w-auto py-3 px-4 rounded-2xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
            title="Get another quote"
          >
            <RefreshCw className="w-3.5 h-3.5 text-purple-300" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
