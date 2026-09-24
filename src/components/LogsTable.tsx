import React, { useState } from 'react';
import {
  ShieldAlert,
  Users,
  Search,
  Trash2,
  RefreshCw,
  ExternalLink,
  Bot,
  Globe,
  Radio,
} from 'lucide-react';
import { VisitLog } from '../types/index.js';

interface LogsTableProps {
  logs: VisitLog[];
  onClearLogs: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export const LogsTable: React.FC<LogsTableProps> = ({
  logs,
  onClearLogs,
  onRefresh,
  isRefreshing,
}) => {
  const [filter, setFilter] = useState<'all' | 'crawler' | 'user'>('all');
  const [search, setSearch] = useState('');

  const filteredLogs = logs.filter((log) => {
    if (filter === 'crawler' && !log.isCrawler) return false;
    if (filter === 'user' && log.isCrawler) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        log.slug.toLowerCase().includes(q) ||
        log.ip.toLowerCase().includes(q) ||
        log.userAgent.toLowerCase().includes(q) ||
        (log.crawlerType && log.crawlerType.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden">
      {/* Header and Controls */}
      <div className="p-4 border-b border-neutral-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></div>
          <div>
            <h2 className="text-base font-semibold text-white">Real-Time Event Stream</h2>
            <p className="text-xs text-neutral-400">
              Live inspection stream capturing edge requests and crawler classifications.
            </p>
          </div>
        </div>

        {/* Filter Segmented Controls & Search */}
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Segmented Filter */}
          <div className="flex items-center p-1 bg-neutral-950 rounded-lg border border-neutral-800">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                filter === 'all'
                  ? 'bg-neutral-800 text-white shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All ({logs.length})
            </button>
            <button
              onClick={() => setFilter('crawler')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filter === 'crawler'
                  ? 'bg-neutral-800 text-amber-300 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Bot className="w-3 h-3 text-amber-400" />
              Meta Crawlers ({logs.filter((l) => l.isCrawler).length})
            </button>
            <button
              onClick={() => setFilter('user')}
              className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                filter === 'user'
                  ? 'bg-neutral-800 text-emerald-300 shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              <Users className="w-3 h-3 text-emerald-400" />
              Real Users ({logs.filter((l) => !l.isCrawler).length})
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search IP, UA, slug..."
              className="bg-neutral-950 border border-neutral-800 rounded-lg pl-7 pr-3 py-1 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500 w-44"
            />
          </div>

          {/* Action buttons */}
          <button
            onClick={onRefresh}
            title="Refresh stream"
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 border border-neutral-800 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-indigo-400' : ''}`} />
          </button>
          <button
            onClick={onClearLogs}
            title="Clear all recorded logs"
            className="p-1.5 text-neutral-400 hover:text-red-400 rounded-lg hover:bg-neutral-800 border border-neutral-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Logs Table */}
      <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-neutral-950/80 sticky top-0 z-10 border-b border-neutral-800 text-neutral-400 font-sans text-xs">
            <tr>
              <th className="py-2.5 px-4">Time</th>
              <th className="py-2.5 px-4">Classification</th>
              <th className="py-2.5 px-4">Slug</th>
              <th className="py-2.5 px-4">Edge Action</th>
              <th className="py-2.5 px-4">IP Address</th>
              <th className="py-2.5 px-4">User-Agent</th>
              <th className="py-2.5 px-4">Target / Served</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/60">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-12 text-center text-neutral-500 font-sans">
                  No log entries recorded yet. Test incoming links or use the Meta Simulator tab.
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const timeStr = dateObj.toLocaleTimeString('en-US', {
                  hour12: false,
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                return (
                  <tr key={log.id} className="hover:bg-neutral-800/20 transition-colors">
                    {/* Timestamp */}
                    <td className="py-2.5 px-4 text-neutral-400 whitespace-nowrap tabular-nums">
                      {timeStr}
                    </td>

                    {/* Classification */}
                    <td className="py-2.5 px-4 font-sans whitespace-nowrap">
                      {log.isCrawler ? (
                        <div className="flex items-center gap-1.5 text-amber-400 font-medium">
                          <Bot className="w-3.5 h-3.5 shrink-0" />
                          <span>Meta Crawler</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-emerald-400 font-medium">
                          <Users className="w-3.5 h-3.5 shrink-0" />
                          <span>Real User</span>
                        </div>
                      )}
                    </td>

                    {/* Slug */}
                    <td className="py-2.5 px-4 text-indigo-400 font-semibold whitespace-nowrap">
                      /l/{log.slug}
                    </td>

                    {/* Action */}
                    <td className="py-2.5 px-4 whitespace-nowrap">
                      {log.actionTaken === 'redirect_307' ? (
                        <span className="text-emerald-300 font-medium bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/40">
                          307 Redirect
                        </span>
                      ) : log.actionTaken === 'compliance_html' ? (
                        <span className="text-amber-300 font-medium bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40">
                          200 Safe HTML
                        </span>
                      ) : (
                        <span className="text-neutral-400 bg-neutral-800/50 px-2 py-0.5 rounded">
                          {log.actionTaken}
                        </span>
                      )}
                    </td>

                    {/* IP */}
                    <td className="py-2.5 px-4 text-neutral-400 whitespace-nowrap">
                      {log.ip}
                    </td>

                    {/* User Agent */}
                    <td className="py-2.5 px-4 max-w-xs truncate text-neutral-400" title={log.userAgent}>
                      {log.userAgent}
                    </td>

                    {/* Destination */}
                    <td className="py-2.5 px-4 max-w-xs truncate text-neutral-500 font-sans" title={log.destination}>
                      {log.destination}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
