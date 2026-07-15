import React, { useState, useEffect } from 'react';
import { UserProblem, useQueue } from '../../context/QueueContext.js';
import { 
  ArrowLeft, 
  ExternalLink, 
  Code2, 
  BookOpen, 
  PlusCircle, 
  Save, 
  Clock, 
  HelpCircle,
  AlertTriangle,
  CheckCircle,
  BrainCircuit,
  CornerDownRight
} from 'lucide-react';

interface ActiveReviewCardProps {
  card: UserProblem;
  onBack: () => void;
}

export const ActiveReviewCard: React.FC<ActiveReviewCardProps> = ({ card, onBack }) => {
  const { submitReview, saveNotes, logMistake } = useQueue();
  
  // Timer state
  const [seconds, setSeconds] = useState(0);
  
  // Tab states
  const [activeSubTab, setActiveSubTab] = useState<'code' | 'notes' | 'mistakes'>('code');
  
  // Input states
  const [notesText, setNotesText] = useState(card.notes || '');
  const [isSavingNotes, setIsSavingNotes] = useState(false);
  const [showNotesSuccess, setShowNotesSuccess] = useState(false);

  // Mistake logger states
  const [mistakeDesc, setMistakeDesc] = useState('');
  const [mistakeCat, setMistakeCat] = useState('Edge Case');
  const [mistakePrev, setMistakePrev] = useState('');
  const [isLoggingMistake, setIsLoggingMistake] = useState(false);

  // Toggle state
  const [showSolution, setShowSolution] = useState(false);

  // Start timer
  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(s => s + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    const success = await saveNotes(card.id, notesText);
    setIsSavingNotes(false);
    if (success) {
      setShowNotesSuccess(true);
      setTimeout(() => setShowNotesSuccess(false), 2000);
    }
  };

  const handleAddMistake = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mistakeDesc || !mistakePrev) return;
    setIsLoggingMistake(true);
    const success = await logMistake(card.id, {
      description: mistakeDesc,
      category: mistakeCat,
      preventionPlan: mistakePrev
    });
    setIsLoggingMistake(false);
    if (success) {
      setMistakeDesc('');
      setMistakePrev('');
    }
  };

  const handleRate = async (rating: 'Green' | 'Yellow' | 'Red') => {
    const success = await submitReview(card.id, rating, seconds);
    if (success) {
      onBack();
    }
  };

  const latestSubmission = card.submissions && card.submissions.length > 0
    ? card.submissions[0]
    : null;

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 text-xs">
      {/* Header toolbar */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3 mb-4">
        <button 
          onClick={onBack} 
          className="flex items-center gap-1 text-slate-400 hover:text-slate-200 bg-transparent border-0 cursor-pointer"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to list</span>
        </button>
        <div className="flex items-center gap-1.5 text-slate-400 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800">
          <Clock className="w-3.5 h-3.5 text-indigo-400" />
          <span className="font-mono text-xs">{formatTime(seconds)}</span>
        </div>
      </div>

      {/* Problem details header */}
      <div className="space-y-2 mb-4">
        <div className="flex items-start justify-between gap-2">
          <h1 className="text-base font-bold text-slate-100 leading-snug">
            {card.problem.title}
          </h1>
          <a
            href={card.problem.url}
            target="_blank"
            rel="noopener noreferrer"
            className="p-1 rounded bg-slate-900 hover:bg-slate-800 border border-slate-800 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
            card.problem.difficulty === 'Easy' ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' :
            card.problem.difficulty === 'Medium' ? 'bg-amber-500/10 border border-amber-500/20 text-amber-400' :
            'bg-rose-500/10 border border-rose-500/20 text-rose-400'
          }`}>
            {card.problem.difficulty}
          </span>
          <span className="text-[10px] text-slate-500">
            Level {card.masteryLevel} (EF: {card.easeFactor})
          </span>
        </div>
      </div>

      {/* Tabs selectors */}
      <div className="flex border-b border-slate-900 mb-3">
        <button
          onClick={() => setActiveSubTab('code')}
          className={`flex items-center gap-1 px-3 py-1.5 font-medium border-b-2 text-[10px] transition-colors bg-transparent cursor-pointer ${
            activeSubTab === 'code' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Code2 className="w-3 h-3" />
          <span>Last Solution</span>
        </button>
        <button
          onClick={() => setActiveSubTab('notes')}
          className={`flex items-center gap-1 px-3 py-1.5 font-medium border-b-2 text-[10px] transition-colors bg-transparent cursor-pointer ${
            activeSubTab === 'notes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-3 h-3" />
          <span>Revision Notes</span>
        </button>
        <button
          onClick={() => setActiveSubTab('mistakes')}
          className={`flex items-center gap-1 px-3 py-1.5 font-medium border-b-2 text-[10px] transition-colors bg-transparent cursor-pointer ${
            activeSubTab === 'mistakes' ? 'border-indigo-500 text-indigo-400' : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-3 h-3" />
          <span>Mistakes ({card.mistakes?.length || 0})</span>
        </button>
      </div>

      {/* Tab Panels */}
      <div className="flex-1 overflow-y-auto min-h-0 mb-4 bg-slate-900/30 border border-slate-900 rounded-xl p-3">
        {activeSubTab === 'code' && (
          <div className="h-full flex flex-col space-y-3 justify-between">
            {latestSubmission ? (
              <div className="space-y-3">
                <div className="flex justify-between items-center bg-slate-900/60 p-2 rounded border border-slate-800/80">
                  <span className="text-[10px] text-slate-400">
                    Language: <span className="text-indigo-300 font-semibold">{latestSubmission.language}</span>
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Submitted: {new Date(latestSubmission.submittedAt).toLocaleDateString()}
                  </span>
                </div>
                
                {showSolution ? (
                  <pre className="p-3 bg-slate-950 border border-slate-900 rounded-lg font-mono text-[10px] overflow-x-auto text-slate-300 leading-relaxed max-h-[220px] select-text">
                    <code>{latestSubmission.code}</code>
                  </pre>
                ) : (
                  <div className="flex flex-col items-center justify-center p-8 bg-slate-900/50 rounded-lg border border-dashed border-slate-800 text-center">
                    <HelpCircle className="w-8 h-8 text-indigo-500/40 mb-2" />
                    <p className="text-slate-300 font-medium mb-1">Try to write it from scratch first!</p>
                    <p className="text-[10px] text-slate-500 max-w-[200px] mb-4">
                      Open the LeetCode URL, solve the problem, and look at your old code only if you get stuck.
                    </p>
                    <button
                      onClick={() => setShowSolution(true)}
                      className="px-3 py-1.5 bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 text-indigo-400 font-semibold rounded-lg hover:border-indigo-500/40 transition-all text-[10px]"
                    >
                      Reveal Previous Code
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-slate-500">
                No code submissions found for this problem tracker.
              </div>
            )}
          </div>
        )}

        {activeSubTab === 'notes' && (
          <div className="space-y-3 h-full flex flex-col justify-between">
            <div className="space-y-2">
              <label className="text-[10px] text-slate-400 font-medium">My Concept & Complexity Summaries</label>
              <textarea
                value={notesText}
                onChange={(e) => setNotesText(e.target.value)}
                placeholder="Write down core concepts, algorithmic strategies, and complexity analyses here..."
                rows={8}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
              />
            </div>
            
            <button
              onClick={handleSaveNotes}
              disabled={isSavingNotes || notesText === card.notes}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors"
            >
              {isSavingNotes ? (
                <span>Saving...</span>
              ) : showNotesSuccess ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Notes Saved Successfully!</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Notes</span>
                </>
              )}
            </button>
          </div>
        )}

        {activeSubTab === 'mistakes' && (
          <div className="space-y-4">
            {/* List existing mistakes */}
            {card.mistakes && card.mistakes.length > 0 && (
              <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
                <label className="text-[10px] text-slate-400 font-semibold block">Logged Mistakes</label>
                {card.mistakes.map((mistake) => (
                  <div key={mistake.id} className="p-2.5 rounded bg-red-950/15 border border-red-500/10 space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="px-1.5 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-[9px] text-red-400 font-semibold">
                        {mistake.category}
                      </span>
                    </div>
                    <p className="text-slate-300 font-medium text-[10px]">{mistake.description}</p>
                    <div className="flex items-start gap-1 text-[9px] text-slate-400">
                      <CornerDownRight className="w-3 h-3 shrink-0 text-slate-600 mt-0.5" />
                      <span><strong className="text-slate-300">Plan:</strong> {mistake.preventionPlan}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Log new mistake form */}
            <form onSubmit={handleAddMistake} className="space-y-2.5 pt-2 border-t border-slate-900">
              <label className="text-[10px] text-slate-400 font-semibold block">Log New Mistake</label>
              
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[9px] text-slate-500 block">Category</label>
                  <select
                    value={mistakeCat}
                    onChange={(e) => setMistakeCat(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-[10px] text-slate-300 focus:outline-none"
                  >
                    <option>Edge Case</option>
                    <option>Time Limit Exceeded</option>
                    <option>Memory Limit Exceeded</option>
                    <option>Off-By-One Error</option>
                    <option>Typo / Syntax</option>
                    <option>Incorrect Strategy</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block">What mistake did you make?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Forgot to check if head is null"
                  value={mistakeDesc}
                  onChange={(e) => setMistakeDesc(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="text-[9px] text-slate-500 block">How will you prevent it next time?</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Always write base case validations first"
                  value={mistakePrev}
                  onChange={(e) => setMistakePrev(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1.5 text-[10px] text-slate-200 placeholder-slate-700 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <button
                type="submit"
                disabled={isLoggingMistake || !mistakeDesc || !mistakePrev}
                className="w-full py-1.5 px-3 rounded bg-red-650/10 border border-red-500/20 text-red-400 font-semibold hover:bg-red-500/10 hover:border-red-500/40 disabled:opacity-50 transition-colors flex items-center justify-center gap-1 text-[10px]"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>Log Mistake</span>
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Recall rating controller actions */}
      <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-900 space-y-2">
        <label className="text-[10px] text-slate-400 font-semibold block text-center">
          How well did you remember this problem solution?
        </label>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => handleRate('Red')}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/20 hover:border-rose-500/40 text-rose-400 font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span className="text-[9px]">Forgot (Red)</span>
          </button>
          <button
            onClick={() => handleRate('Yellow')}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/25 border border-amber-500/20 hover:border-amber-500/40 text-amber-400 font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span className="text-[9px]">Struggled (Yellow)</span>
          </button>
          <button
            onClick={() => handleRate('Green')}
            className="flex flex-col items-center gap-1 py-2 px-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/25 border border-emerald-500/20 hover:border-emerald-500/40 text-emerald-400 font-semibold transition-all hover:-translate-y-0.5 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4" />
            <span className="text-[9px]">Mastered (Green)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
