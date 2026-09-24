import React, { useState } from 'react';
import { X, ExternalLink, ShieldCheck, Code, Globe } from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface CompliancePreviewModalProps {
  isOpen: boolean;
  link: ShortLink | null;
  onClose: () => void;
}

export const CompliancePreviewModal: React.FC<CompliancePreviewModalProps> = ({
  isOpen,
  link,
  onClose,
}) => {
  const [viewMode, setViewMode] = useState<'preview' | 'metadata'>('preview');

  if (!isOpen || !link) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-4xl w-full h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-neutral-800 flex items-center justify-between bg-neutral-950/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <span>Compliance Preview: /l/{link.slug}</span>
                <span className="text-[10px] bg-amber-950/50 text-amber-300 border border-amber-800/40 px-1.5 py-0.5 rounded font-mono">
                  Meta Crawler View
                </span>
              </h3>
              <p className="text-[11px] text-neutral-400">
                This clean HTML article and valid OpenGraph tags are served when Facebook or Instagram scrapes this link.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View Mode Toggle */}
            <div className="flex items-center p-0.5 bg-neutral-900 rounded-lg border border-neutral-800 text-xs">
              <button
                onClick={() => setViewMode('preview')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  viewMode === 'preview' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                Rendered Page
              </button>
              <button
                onClick={() => setViewMode('metadata')}
                className={`px-2.5 py-1 rounded font-medium transition ${
                  viewMode === 'metadata' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'
                }`}
              >
                OpenGraph Tags
              </button>
            </div>

            <a
              href={`/compliance/${link.slug}`}
              target="_blank"
              rel="noreferrer"
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
              title="Open raw compliance page in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded hover:bg-neutral-800 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden bg-neutral-950">
          {viewMode === 'preview' ? (
            <iframe
              src={`/compliance/${link.slug}`}
              title="Safe Compliance Page Preview"
              className="w-full h-full border-0 bg-white"
            />
          ) : (
            <div className="p-6 overflow-y-auto h-full space-y-4 font-mono text-xs">
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
                <span className="text-neutral-400 font-sans font-semibold text-xs block mb-2">
                  Generated Meta & OpenGraph Tags (Visible to Meta Scraper)
                </span>
                <div className="space-y-1.5 text-neutral-300">
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> property="og:type" content="article" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> property="og:title" content="{link.complianceTitle}" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> property="og:description" content="{link.complianceDescription}" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> property="og:image" content="{link.ogImage}" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> property="og:site_name" content="{link.brandName}" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> name="twitter:card" content="summary_large_image" <span className="text-indigo-400">/&gt;</span>
                  </div>
                  <div>
                    <span className="text-indigo-400">&lt;meta</span> name="robots" content="index, follow" <span className="text-indigo-400">/&gt;</span>
                  </div>
                </div>
              </div>

              {/* Social Share Card Mockup */}
              <div className="p-4 bg-neutral-900 rounded-lg border border-neutral-800 font-sans">
                <span className="text-neutral-400 text-xs font-semibold block mb-3">
                  Facebook Link Share Card Preview
                </span>
                <div className="max-w-md bg-white rounded-lg overflow-hidden border border-slate-300 shadow-sm text-slate-800">
                  <img
                    src={link.ogImage}
                    alt={link.complianceTitle}
                    className="w-full h-48 object-cover bg-slate-100"
                  />
                  <div className="p-3 bg-slate-50 border-t border-slate-200">
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
                      {link.brandName.toUpperCase()}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 line-clamp-1 mt-0.5">
                      {link.complianceTitle}
                    </h4>
                    <p className="text-xs text-slate-600 line-clamp-2 mt-1">
                      {link.complianceDescription}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
