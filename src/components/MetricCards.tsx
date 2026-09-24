import React from 'react';
import { Users, Bot, MousePointerClick, ShieldCheck, Activity } from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface MetricCardsProps {
  links: ShortLink[];
}

export const MetricCards: React.FC<MetricCardsProps> = ({ links }) => {
  const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
  const totalUsers = links.reduce((sum, l) => sum + (l.userClicks || 0), 0);
  const totalCrawlers = links.reduce((sum, l) => sum + (l.crawlerVisits || 0), 0);
  const inspectionRate =
    totalClicks > 0 ? ((totalCrawlers / totalClicks) * 100).toFixed(1) : '0.0';

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {/* Total Clicks */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Total Edge Invocations</span>
          <MousePointerClick className="w-3.5 h-3.5 text-neutral-500" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-white font-mono tabular-nums">
            {totalClicks.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-500">all events</span>
        </div>
      </div>

      {/* Real Users */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Real Users Redirected</span>
          <Users className="w-3.5 h-3.5 text-emerald-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-emerald-400 font-mono tabular-nums">
            {totalUsers.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-500">HTTP 307 instant</span>
        </div>
      </div>

      {/* Meta Crawler Visits */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Meta Crawler Inspections</span>
          <Bot className="w-3.5 h-3.5 text-amber-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-amber-400 font-mono tabular-nums">
            {totalCrawlers.toLocaleString()}
          </span>
          <span className="text-xs text-neutral-500">safe HTML served</span>
        </div>
      </div>

      {/* Crawler Inspection Ratio */}
      <div className="p-4 rounded-xl bg-neutral-900/60 border border-neutral-800/80">
        <div className="flex items-center justify-between text-xs text-neutral-400 mb-1.5">
          <span>Inspection Frequency</span>
          <Activity className="w-3.5 h-3.5 text-indigo-400" />
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-2xl font-bold tracking-tight text-indigo-300 font-mono tabular-nums">
            {inspectionRate}%
          </span>
          <span className="text-xs text-neutral-500">crawler vs user</span>
        </div>
      </div>
    </div>
  );
};
