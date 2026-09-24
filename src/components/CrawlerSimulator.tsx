import React, { useState } from 'react';
import {
  Play,
  Bot,
  Users,
  ArrowRight,
  ShieldCheck,
  CheckCircle,
  ExternalLink,
  Code,
  Eye,
  Server,
} from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface CrawlerSimulatorProps {
  links: ShortLink[];
  baseUrl: string;
  initialSlug?: string;
  onOpenCompliancePreview: (link: ShortLink) => void;
}

const PRESET_USER_AGENTS = [
  {
    name: 'Meta OpenGraph Scraper (facebookexternalhit/1.1)',
    ua: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    type: 'crawler',
    desc: 'Official Facebook scraper invoked when a link is shared or previewed in Messenger / Feed.',
  },
  {
    name: 'Facebot (Meta Page Indexer)',
    ua: 'Facebot',
    type: 'crawler',
    desc: 'Meta background indexer checking link health and page content.',
  },
  {
    name: 'MetaInspector (Ad Compliance Reviewer)',
    ua: 'MetaInspector/2.0 (+https://www.facebook.com)',
    type: 'crawler',
    desc: 'Automated compliance bot verifying advertising landing page guidelines.',
  },
  {
    name: 'Real User - iPhone Safari (iOS 17.4)',
    ua: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    type: 'user',
    desc: 'Genuine mobile shopper clicking from Facebook Ad or Instagram Bio.',
  },
  {
    name: 'Real User - Android Samsung Galaxy (Chrome 122)',
    ua: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36',
    type: 'user',
    desc: 'Genuine Android buyer browsing Facebook Feed or Marketplace.',
  },
  {
    name: 'Real User - Desktop Mac (Chrome 122)',
    ua: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
    type: 'user',
    desc: 'Desktop consumer clicking short link.',
  },
];

export const CrawlerSimulator: React.FC<CrawlerSimulatorProps> = ({
  links,
  baseUrl,
  initialSlug,
  onOpenCompliancePreview,
}) => {
  const [selectedSlug, setSelectedSlug] = useState<string>(
    initialSlug || (links.length > 0 ? links[0].slug : 'offer1')
  );
  const [selectedUa, setSelectedUa] = useState<string>(PRESET_USER_AGENTS[0].ua);
  const [simulatedIp, setSimulatedIp] = useState<string>('31.13.115.10');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any | null>(null);

  const activeLink = links.find((l) => l.slug === selectedSlug);

  const runSimulation = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/test-crawler', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userAgent: selectedUa,
          slug: selectedSlug,
          ip: simulatedIp,
        }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error('Simulation error', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6">
        <div>
          <h2 className="text-base font-semibold text-white">Meta Crawler & Redirection Simulator</h2>
          <p className="text-xs text-neutral-400 mt-1">
            Test how Edge Middleware intercepts and classifies requests in real-time before going live on Vercel.
          </p>
        </div>

        {/* Configuration grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
          {/* Column 1: Link Selection */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Select Short Link
              </label>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-indigo-400 focus:outline-none focus:border-indigo-500"
              >
                {links.map((link) => (
                  <option key={link.slug} value={link.slug}>
                    /l/{link.slug} — {link.complianceTitle.slice(0, 30)}...
                  </option>
                ))}
              </select>
            </div>

            {activeLink && (
              <div className="p-3 bg-neutral-950/70 rounded-lg border border-neutral-800 text-xs space-y-2">
                <div>
                  <span className="text-neutral-500 block text-[11px]">Real User Target:</span>
                  <span className="font-mono text-emerald-400 break-all text-[11px]">
                    {activeLink.destinationUrl}
                  </span>
                </div>
                <div>
                  <span className="text-neutral-500 block text-[11px]">Safe Compliance Title:</span>
                  <span className="text-neutral-300">{activeLink.complianceTitle}</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Simulated Client IP
              </label>
              <input
                type="text"
                value={simulatedIp}
                onChange={(e) => setSimulatedIp(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs font-mono text-neutral-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Column 2: User Agent Presets */}
          <div className="lg:col-span-2 space-y-3">
            <label className="block text-xs font-medium text-neutral-300">
              Select Client User-Agent Persona
            </label>
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {PRESET_USER_AGENTS.map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedUa(item.ua)}
                  className={`w-full text-left p-2.5 rounded-lg border text-xs transition flex items-start gap-3 ${
                    selectedUa === item.ua
                      ? 'bg-neutral-800/80 border-indigo-500/60 shadow-sm'
                      : 'bg-neutral-950/50 border-neutral-800/80 hover:bg-neutral-900 text-neutral-400'
                  }`}
                >
                  <div className="mt-0.5">
                    {item.type === 'crawler' ? (
                      <Bot className="w-4 h-4 text-amber-400" />
                    ) : (
                      <Users className="w-4 h-4 text-emerald-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className={`font-semibold ${selectedUa === item.ua ? 'text-white' : 'text-neutral-300'}`}>
                        {item.name}
                      </span>
                      <span className={`text-[10px] uppercase font-mono px-1.5 py-0.2 rounded ${
                        item.type === 'crawler' ? 'text-amber-400 bg-amber-950/40' : 'text-emerald-400 bg-emerald-950/40'
                      }`}>
                        {item.type}
                      </span>
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-1">{item.desc}</p>
                    <p className="font-mono text-[10px] text-neutral-600 truncate mt-1">{item.ua}</p>
                  </div>
                </button>
              ))}
            </div>

            {/* Custom User Agent */}
            <div>
              <label className="block text-[11px] text-neutral-400 mb-1">
                Or Edit Custom User-Agent Header
              </label>
              <textarea
                rows={2}
                value={selectedUa}
                onChange={(e) => setSelectedUa(e.target.value)}
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-2 text-xs font-mono text-neutral-300 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 pt-4 border-t border-neutral-800 flex justify-end">
          <button
            onClick={runSimulation}
            disabled={isLoading}
            className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-2"
          >
            <Play className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Inspecting Headers...' : 'Simulate Edge Interception'}
          </button>
        </div>
      </div>

      {/* Simulation Results Display */}
      {result && (
        <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pb-4 border-b border-neutral-800">
            <div>
              <span className="text-xs text-neutral-400 uppercase tracking-wider font-semibold">
                Simulation Output
              </span>
              <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-0.5">
                {result.isMetaCrawler ? (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-amber-400"></span>
                    <span>Meta Crawler Detected & Cloaked</span>
                  </>
                ) : (
                  <>
                    <span className="inline-block w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                    <span>Real User Detected & Redirected</span>
                  </>
                )}
              </h3>
            </div>
            <div className="flex items-center gap-2 font-mono">
              <span className="text-xs text-neutral-400">Response Code:</span>
              <span
                className={`text-sm font-bold px-2 py-0.5 rounded ${
                  result.statusCode === 200
                    ? 'bg-amber-950/50 text-amber-300 border border-amber-800/40'
                    : 'bg-emerald-950/50 text-emerald-300 border border-emerald-800/40'
                }`}
              >
                HTTP {result.statusCode}
              </span>
            </div>
          </div>

          {/* Execution Pipeline Steps */}
          <div>
            <span className="text-xs text-neutral-400 font-medium block mb-3">
              Edge Middleware Execution Flow
            </span>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-[11px] text-neutral-500 font-mono">1. Intercept Request</span>
                <p className="font-semibold text-white">/l/{result.slug}</p>
                <p className="text-[11px] text-neutral-400">IP: {simulatedIp}</p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-[11px] text-neutral-500 font-mono">2. Analyze Headers</span>
                <p className="font-semibold text-white truncate" title={selectedUa}>
                  {result.detection.botName || 'Browser User-Agent'}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {result.detection.isMetaCrawler ? 'Pattern: ' + result.detection.matchedPattern : 'No crawler match'}
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-[11px] text-neutral-500 font-mono">3. Edge Branch Action</span>
                <p className={`font-semibold ${result.isMetaCrawler ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {result.action}
                </p>
                <p className="text-[11px] text-neutral-400">
                  {result.isMetaCrawler ? 'Rewrite to /compliance' : 'Instant 307 redirect'}
                </p>
              </div>

              <div className="p-3 bg-neutral-950 rounded-lg border border-neutral-800 space-y-1">
                <span className="text-[11px] text-neutral-500 font-mono">4. Redis Storage</span>
                <p className="font-semibold text-white">Log Event Persisted</p>
                <p className="text-[11px] text-neutral-400">Async pipeline increment</p>
              </div>
            </div>
          </div>

          {/* Response Headers & Content Preview */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Headers */}
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800">
              <span className="text-xs text-neutral-400 font-medium block mb-2 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-indigo-400" />
                Edge Response Headers
              </span>
              <pre className="font-mono text-[11px] text-neutral-300 space-y-1 overflow-x-auto">
                <div>status: {result.statusCode}</div>
                {Object.entries(result.simulatedHeaders).map(([k, v]) => (
                  <div key={k} className="text-neutral-400">
                    <span className="text-neutral-500">{k}:</span> {String(v)}
                  </div>
                ))}
              </pre>
            </div>

            {/* Visual Preview Card */}
            <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 flex flex-col justify-between">
              <div>
                <span className="text-xs text-neutral-400 font-medium block mb-2 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-indigo-400" />
                  What the Client Receives
                </span>
                {result.isMetaCrawler ? (
                  <div className="text-xs text-neutral-300 space-y-1">
                    <p className="text-amber-300 font-medium">Safe Compliance Page with OpenGraph Tags</p>
                    <p className="text-neutral-400 text-[11px]">
                      Facebook's crawler parses the OpenGraph title, description, and preview image without seeing the affiliate redirect.
                    </p>
                  </div>
                ) : (
                  <div className="text-xs text-neutral-300 space-y-1">
                    <p className="text-emerald-300 font-medium">Immediate Browser Redirection (307)</p>
                    <p className="text-neutral-400 text-[11px]">
                      The user's browser follows the <code className="text-neutral-300">Location</code> header directly to Lazada or target store in 15ms.
                    </p>
                  </div>
                )}
              </div>

              <div className="pt-4 flex items-center gap-2">
                {result.isMetaCrawler && activeLink && (
                  <button
                    onClick={() => onOpenCompliancePreview(activeLink)}
                    className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded text-xs font-medium transition flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview Safe Page HTML
                  </button>
                )}
                <a
                  href="https://developers.facebook.com/tools/debug/"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="px-3 py-1.5 bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 rounded text-xs font-medium transition flex items-center gap-1.5 border border-blue-500/20"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test with Facebook Sharing Debugger
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
