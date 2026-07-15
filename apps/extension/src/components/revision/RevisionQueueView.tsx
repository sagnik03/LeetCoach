import React from 'react';
import { useQueue, UserProblem } from '../../context/QueueContext.js';
import { RefreshCw, ChevronRight, CheckCircle2 } from 'lucide-react';

interface RevisionQueueViewProps {
  onSelectCard: (card: UserProblem) => void;
}

export const RevisionQueueView: React.FC<RevisionQueueViewProps> = ({ onSelectCard }) => {
  const { queue, isLoading, error, fetchQueue } = useQueue();

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-base font-bold text-slate-100">Revision Deck</h1>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {queue.length} {queue.length === 1 ? 'problem' : 'problems'} scheduled for recall review
          </p>
        </div>
        <button
          onClick={fetchQueue}
          disabled={isLoading}
          className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-indigo-400 transition-colors disabled:opacity-50 cursor-pointer"
          title="Refresh Queue"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px]">
          {error}
        </div>
      )}

      {/* Main card list scroll area */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-2.5 pr-0.5">
        {queue.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 bg-gradient-to-br from-indigo-950/20 to-slate-900/35 border border-indigo-500/10 rounded-xl text-center">
            <CheckCircle2 className="w-9 h-9 text-emerald-400/80 mb-2.5" />
            <h3 className="font-semibold text-slate-200 mb-1">Queue Clear!</h3>
            <p className="text-[10px] text-slate-500 max-w-[200px] leading-normal">
              You are all caught up for today. Solved LeetCode problems will automatically enqueue here based on the SM-2 algorithm.
            </p>
          </div>
        ) : (
          queue.map((item) => (
            <div
              key={item.id}
              onClick={() => onSelectCard(item)}
              className="group p-3 rounded-xl bg-slate-900 border border-slate-800/80 hover:border-indigo-500/30 transition-all hover:bg-slate-900/80 cursor-pointer flex items-center justify-between gap-3"
            >
              <div className="space-y-1.5 min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold shrink-0 ${
                    item.problem.difficulty === 'Easy' ? 'bg-emerald-500/10 border border-emerald-500/25 text-emerald-400' :
                    item.problem.difficulty === 'Medium' ? 'bg-amber-500/10 border border-amber-500/25 text-amber-400' :
                    'bg-rose-500/10 border border-rose-500/25 text-rose-400'
                  }`}>
                    {item.problem.difficulty}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Mastery: Level {item.masteryLevel}
                  </span>
                </div>
                
                <h3 className="font-bold text-slate-200 group-hover:text-indigo-400 transition-colors truncate text-xs">
                  {item.problem.title}
                </h3>

                {item.problem.topicTags && item.problem.topicTags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {item.problem.topicTags.slice(0, 3).map((tag, idx) => (
                      <span
                        key={idx}
                        className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-800 text-[8px] text-slate-400"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all shrink-0" />
            </div>
          ))
        )}
      </div>
    </div>
  );
};
