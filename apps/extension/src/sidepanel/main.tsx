import React, { useState } from 'react';
import ReactDOM from 'react-dom/client';
import { 
  LayoutDashboard, 
  BookOpen, 
  MessageSquare, 
  Settings as SettingsIcon, 
  Flame, 
  User 
} from 'lucide-react';
import '../styles/index.css';

function Sidepanel() {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'queue' | 'chat' | 'settings'>('queue');
  const [streak] = useState(5);

  return (
    <div className="flex flex-col h-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-indigo-600 flex items-center justify-center font-bold text-white shadow shadow-indigo-500/30">
            L
          </div>
          <span className="font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            LeetCoach
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-semibold">
            <Flame className="w-3.5 h-3.5 fill-orange-500/20" />
            <span>{streak} days</span>
          </div>
          <button className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-slate-700 text-slate-300 hover:text-white transition-colors">
            <User className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-4">
        {activeTab === 'queue' && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-900/40 to-slate-900 border border-indigo-500/15">
              <h2 className="text-lg font-semibold text-indigo-200">Daily Revision Queue</h2>
              <p className="text-xs text-slate-400 mt-1">Review solved problems to maintain your recall memory.</p>
              <div className="mt-4 p-6 rounded-lg bg-slate-900/60 border border-slate-800/80 text-center">
                <p className="text-sm text-slate-400">All caught up! No problems scheduled for review today.</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200">Analytics Dashboard</h2>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Total Solved</span>
                <p className="text-2xl font-bold mt-1 text-indigo-400">0</p>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400">Mastery Level</span>
                <p className="text-2xl font-bold mt-1 text-cyan-400">0.0%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex flex-col h-full space-y-4">
            <div className="flex-1 flex flex-col justify-center items-center text-center p-4">
              <MessageSquare className="w-10 h-10 text-indigo-500/50 mb-3" />
              <h3 className="font-medium text-slate-300">LeetCoach RAG Chat</h3>
              <p className="text-xs text-slate-500 max-w-[200px] mt-1 leading-relaxed">
                Query your personalized LeetCode knowledge base. Ask about past solutions, mistakes, or concepts.
              </p>
            </div>
            <div className="border-t border-slate-800 pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Ask LeetCoach..."
                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                disabled
              />
              <button 
                className="px-3 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-500 disabled:opacity-50 transition-colors"
                disabled
              >
                Send
              </button>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-200">Settings</h2>
            <div className="space-y-2">
              <label className="text-xs text-slate-400">Model Selection</label>
              <select className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500">
                <option>Gemini 1.5 Flash (Recommended)</option>
                <option>Gemini 1.5 Pro</option>
                <option>GPT-4o Mini</option>
              </select>
            </div>
          </div>
        )}
      </main>

      {/* Navigation Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 px-2 py-1 flex justify-around">
        <button
          onClick={() => setActiveTab('queue')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors ${
            activeTab === 'queue' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Queue</span>
        </button>
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors ${
            activeTab === 'dashboard' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <LayoutDashboard className="w-4 h-4" />
          <span>Dashboard</span>
        </button>
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors ${
            activeTab === 'chat' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat</span>
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex flex-col items-center gap-1 py-1 px-3 rounded-lg text-[10px] transition-colors ${
            activeTab === 'settings' ? 'text-indigo-400 bg-indigo-500/5' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <SettingsIcon className="w-4 h-4" />
          <span>Settings</span>
        </button>
      </footer>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Sidepanel />
  </React.StrictMode>
);
