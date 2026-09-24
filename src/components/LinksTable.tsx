import React, { useState } from 'react';
import {
  ExternalLink,
  Copy,
  Check,
  Edit2,
  Trash2,
  Eye,
  Play,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  Shield,
} from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface LinksTableProps {
  links: ShortLink[];
  baseUrl: string;
  onEditUrl: (link: ShortLink) => void;
  onEditFull: (link: ShortLink) => void;
  onDelete: (slug: string) => void;
  onPreviewCompliance: (link: ShortLink) => void;
  onTestCrawler: (slug: string) => void;
  onToggleActive: (link: ShortLink) => void;
}

export const LinksTable: React.FC<LinksTableProps> = ({
  links,
  baseUrl,
  onEditUrl,
  onEditFull,
  onDelete,
  onPreviewCompliance,
  onTestCrawler,
  onToggleActive,
}) => {
  const [search, setSearch] = useState('');
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const copyToClipboard = (slug: string) => {
    const fullUrl = `${baseUrl}/l/${slug}`;
    navigator.clipboard.writeText(fullUrl);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 2000);
  };

  const filteredLinks = links.filter(
    (l) =>
      l.slug.toLowerCase().includes(search.toLowerCase()) ||
      l.destinationUrl.toLowerCase().includes(search.toLowerCase()) ||
      l.complianceTitle.toLowerCase().includes(search.toLowerCase())
  );

  const formatRelativeTime = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    const delta = Math.floor((Date.now() - timestamp) / 1000);
    if (delta < 60) return `${delta}s ago`;
    if (delta < 3600) return `${Math.floor(delta / 60)}m ago`;
    if (delta < 86400) return `${Math.floor(delta / 3600)}h ago`;
    return `${Math.floor(delta / 86400)}d ago`;
  };

  return (
    <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden">
      {/* Table Header Controls */}
      <div className="p-4 border-b border-neutral-800/80 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h2 className="text-base font-semibold text-white">Active Short Links</h2>
          <p className="text-xs text-neutral-400">
            Incoming requests on <span className="font-mono text-neutral-300">/l/:slug</span> branch based on User-Agent inspection.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter by slug or URL..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-neutral-950/70 border-b border-neutral-800 text-neutral-400 font-medium">
            <tr>
              <th className="py-3 px-4">Short Slug</th>
              <th className="py-3 px-4">Active Destination (Real Users)</th>
              <th className="py-3 px-4">Compliance Title (Meta Crawler)</th>
              <th className="py-3 px-4 text-right">Real Users</th>
              <th className="py-3 px-4 text-right">Meta Crawlers</th>
              <th className="py-3 px-4">Last Meta Check</th>
              <th className="py-3 px-4 text-center">Status</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/70 font-mono">
            {filteredLinks.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-neutral-500 font-sans">
                  No short links matching query. Click "+ New Short Link" to create one.
                </td>
              </tr>
            ) : (
              filteredLinks.map((link) => (
                <tr key={link.slug} className="hover:bg-neutral-800/20 transition-colors">
                  {/* Slug */}
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-indigo-400">/l/{link.slug}</span>
                      <button
                        onClick={() => copyToClipboard(link.slug)}
                        title="Copy short link to clipboard"
                        className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
                      >
                        {copiedSlug === link.slug ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>
                  </td>

                  {/* Destination URL */}
                  <td className="py-3.5 px-4 font-sans max-w-xs">
                    <div className="flex items-center gap-1.5 group">
                      <span
                        className="truncate text-neutral-300 hover:text-white block"
                        title={link.destinationUrl}
                      >
                        {link.destinationUrl}
                      </span>
                      <button
                        onClick={() => onEditUrl(link)}
                        title="Quick edit destination Lazada/Target URL"
                        className="opacity-60 group-hover:opacity-100 p-1 text-neutral-400 hover:text-indigo-300 rounded hover:bg-neutral-800 transition shrink-0"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <a
                        href={link.destinationUrl}
                        target="_blank"
                        rel="noreferrer noopener"
                        title="Open target URL in new tab"
                        className="opacity-40 group-hover:opacity-100 p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </td>

                  {/* Compliance Title */}
                  <td className="py-3.5 px-4 font-sans max-w-[200px]">
                    <span className="truncate text-neutral-400 block" title={link.complianceTitle}>
                      {link.complianceTitle}
                    </span>
                  </td>

                  {/* Real Users */}
                  <td className="py-3.5 px-4 text-right tabular-nums text-emerald-400 font-semibold">
                    {link.userClicks.toLocaleString()}
                  </td>

                  {/* Meta Crawlers */}
                  <td className="py-3.5 px-4 text-right tabular-nums text-amber-400 font-semibold">
                    {link.crawlerVisits.toLocaleString()}
                  </td>

                  {/* Last Meta Inspection */}
                  <td className="py-3.5 px-4 font-sans text-neutral-400 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-500" />
                      <span
                        title={
                          link.lastMetaInspection
                            ? new Date(link.lastMetaInspection).toLocaleString()
                            : 'No inspections yet'
                        }
                      >
                        {formatRelativeTime(link.lastMetaInspection)}
                      </span>
                    </div>
                  </td>

                  {/* Active Toggle */}
                  <td className="py-3.5 px-4 text-center font-sans">
                    <button
                      onClick={() => onToggleActive(link)}
                      className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded transition ${
                        link.isActive
                          ? 'text-emerald-400 hover:text-emerald-300 hover:bg-emerald-950/30'
                          : 'text-neutral-500 hover:text-neutral-400 hover:bg-neutral-800/40'
                      }`}
                    >
                      {link.isActive ? (
                        <>
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" />
                          <span>Paused</span>
                        </>
                      )}
                    </button>
                  </td>

                  {/* Actions */}
                  <td className="py-3.5 px-4 text-right font-sans whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => onTestCrawler(link.slug)}
                        title="Simulate Meta Crawler vs User request"
                        className="px-2 py-1 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 hover:text-indigo-200 rounded text-[11px] font-medium transition flex items-center gap-1 border border-indigo-500/20"
                      >
                        <Play className="w-3 h-3" />
                        Test
                      </button>
                      <button
                        onClick={() => onPreviewCompliance(link)}
                        title="Preview Safe HTML Compliance Page"
                        className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditFull(link)}
                        title="Edit link details & metadata"
                        className="p-1.5 text-neutral-400 hover:text-neutral-200 rounded hover:bg-neutral-800 transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDelete(link.slug)}
                        title="Delete link"
                        className="p-1.5 text-neutral-400 hover:text-red-400 rounded hover:bg-neutral-800 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
