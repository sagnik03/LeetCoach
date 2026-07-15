import React from 'react';
import ReactDOM from 'react-dom/client';
import '../styles/index.css';

function Popup() {
  const openSidepanel = () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]?.id) {
        chrome.sidePanel.open({ tabId: tabs[0].id });
      }
    });
  };

  return (
    <div className="w-80 p-6 bg-slate-900 text-slate-100 flex flex-col items-center">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center font-bold text-white text-lg shadow-md shadow-indigo-500/20">
          L
        </div>
        <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
          LeetCoach
        </h1>
      </div>
      <p className="text-sm text-slate-400 text-center mb-6 leading-relaxed">
        AI-Powered Spaced Repetition and RAG Learning Companion for LeetCode.
      </p>
      <button
        onClick={openSidepanel}
        className="w-full py-2.5 px-4 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm transition-all duration-200 hover:shadow-lg hover:shadow-indigo-500/20 active:scale-95"
      >
        Open Side Panel
      </button>
      <div className="mt-4 pt-4 border-t border-slate-800 w-full text-center">
        <span className="text-xs text-slate-500">v1.0.0 • Connected to LeetCoach Cloud</span>
      </div>
    </div>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Popup />
  </React.StrictMode>
);
