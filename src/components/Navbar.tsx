import React from 'react';
import { ShieldCheck, Database, RefreshCw, LogOut, Terminal, Download, Globe } from 'lucide-react';

interface NavbarProps {
  activeTab: 'links' | 'logs' | 'simulator' | 'export' | 'settings';
  setActiveTab: (tab: 'links' | 'logs' | 'simulator' | 'export' | 'settings') => void;
  storageStatus: {
    connected: boolean;
    provider: 'upstash' | 'local_kv';
    latencyMs?: number;
  };
  onRefresh: () => void;
  isRefreshing: boolean;
  onLogout: () => void;
  onOpenCreate: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  storageStatus,
  onRefresh,
  isRefreshing,
  onLogout,
  onOpenCreate,
}) => {
  return (
    <header className="border-b border-neutral-800/80 bg-neutral-950/90 backdrop-blur sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Zone 1: Single text wordmark */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-lg">
            ⚡
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-base font-bold tracking-tight text-white">CloakFlow</span>
              <span className="text-xs text-neutral-400 hidden sm:inline">Meta Edge Redirection</span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-neutral-400">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Edge Active</span>
              <span aria-hidden="true">&middot;</span>
              <span className="font-mono text-neutral-300">
                {storageStatus.provider === 'upstash' ? 'Upstash Redis' : 'Local KV Store'}
              </span>
              {storageStatus.latencyMs !== undefined && (
                <>
                  <span aria-hidden="true">&middot;</span>
                  <span className="font-mono text-neutral-400">{storageStatus.latencyMs}ms</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-neutral-900/80 p-1 rounded-lg border border-neutral-800">
          <button
            onClick={() => setActiveTab('links')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'links'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Links & Routing
          </button>
          <button
            onClick={() => setActiveTab('logs')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'logs'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Real-Time Logs
          </button>
          <button
            onClick={() => setActiveTab('simulator')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'simulator'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Meta Simulator
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'export'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-indigo-300 hover:text-white'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            Vercel Deployment Kit
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-neutral-800 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            Database & Settings
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={onRefresh}
            title="Refresh logs & statistics"
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={onOpenCreate}
            className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm whitespace-nowrap flex items-center gap-1.5"
          >
            <span className="text-base leading-none">+</span>
            New Short Link
          </button>
          <button
            onClick={onLogout}
            title="Sign out of Admin"
            className="p-2 text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900 rounded-lg transition-colors border border-transparent hover:border-neutral-800"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-neutral-800/80 bg-neutral-950 px-2 py-1.5 text-xs">
        <button
          onClick={() => setActiveTab('links')}
          className={`px-2.5 py-1 rounded font-medium ${
            activeTab === 'links' ? 'text-white bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Links
        </button>
        <button
          onClick={() => setActiveTab('logs')}
          className={`px-2.5 py-1 rounded font-medium ${
            activeTab === 'logs' ? 'text-white bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Logs
        </button>
        <button
          onClick={() => setActiveTab('simulator')}
          className={`px-2.5 py-1 rounded font-medium ${
            activeTab === 'simulator' ? 'text-white bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Tester
        </button>
        <button
          onClick={() => setActiveTab('export')}
          className={`px-2.5 py-1 rounded font-medium ${
            activeTab === 'export' ? 'text-white bg-indigo-600' : 'text-indigo-400'
          }`}
        >
          Vercel Kit
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-2.5 py-1 rounded font-medium ${
            activeTab === 'settings' ? 'text-white bg-neutral-800' : 'text-neutral-400'
          }`}
        >
          Config
        </button>
      </div>
    </header>
  );
};
