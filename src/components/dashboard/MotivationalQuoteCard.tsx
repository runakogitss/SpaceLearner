import React from 'react';
import { Quote } from 'lucide-react';

export const MotivationalQuoteCard: React.FC = () => {
  return (
    <div className="bg-gradient-to-tr from-indigo-950/80 to-purple-950/80 border border-purple-500/20 rounded-3xl p-5 relative overflow-hidden flex items-center justify-between shadow-glow-card">
      <div className="relative z-10 max-w-[75%]">
        <Quote className="w-6 h-6 text-purple-400 opacity-60 mb-2" />
        <p className="text-xs font-medium text-slate-200 leading-relaxed italic">
          &ldquo;Discipline is the bridge between goals and accomplishment.&rdquo;
        </p>
        <span className="text-[11px] text-purple-400 font-semibold block mt-2">
          — Jim Rohn
        </span>
      </div>

      {/* Cosmic Illustration */}
      <div className="relative z-10 text-4xl transform hover:rotate-12 transition-transform duration-300">
        🧑‍🚀
      </div>
      <div className="absolute right-0 bottom-0 w-32 h-32 bg-purple-600/10 rounded-full blur-2xl pointer-events-none" />
    </div>
  );
};
