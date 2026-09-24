import React, { useState } from 'react';
import {
  Download,
  Copy,
  Check,
  FileCode,
  FolderTree,
  ExternalLink,
  Terminal,
  Zap,
  CheckCircle2,
} from 'lucide-react';
import { NEXTJS_EXPORT_FILES, generateProjectZip } from '../lib/nextjs-export.js';

export const VercelExportHub: React.FC = () => {
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [isZipping, setIsZipping] = useState(false);

  const currentFile = NEXTJS_EXPORT_FILES[selectedFileIndex];

  const handleCopy = () => {
    navigator.clipboard.writeText(currentFile.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadZip = async () => {
    try {
      setIsZipping(true);
      const blob = await generateProjectZip();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'meta-link-cloaker-nextjs.zip';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error generating zip', err);
      // Fallback to backend export endpoint
      window.location.href = '/api/export-zip';
    } finally {
      setIsZipping(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Hero Banner with 1-click Download */}
      <div className="rounded-xl border border-indigo-500/30 bg-gradient-to-r from-indigo-950/40 via-neutral-900 to-neutral-950 p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" />
            100% Free Production Deployment
          </span>
          <h2 className="text-lg font-bold text-white mt-1">
            Next.js App Router & Vercel Edge Codebase
          </h2>
          <p className="text-xs text-neutral-400 mt-1 max-w-2xl">
            Complete, self-contained Next.js repository with Edge Middleware crawler interception, Upstash Redis key-value integration, and Server-Side OpenGraph rendering.
          </p>
        </div>

        <button
          onClick={handleDownloadZip}
          disabled={isZipping}
          className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-lg transition flex items-center gap-2 whitespace-nowrap shrink-0"
        >
          <Download className={`w-4 h-4 ${isZipping ? 'animate-bounce' : ''}`} />
          {isZipping ? 'Packaging ZIP...' : 'Download Project (.ZIP)'}
        </button>
      </div>

      {/* Code Browser Grid */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 overflow-hidden grid grid-cols-1 md:grid-cols-4">
        {/* Left: File Tree Explorer */}
        <div className="border-b md:border-b-0 md:border-r border-neutral-800/80 bg-neutral-950/60 p-4">
          <span className="text-xs font-medium text-neutral-400 uppercase tracking-wider block mb-3 flex items-center gap-1.5">
            <FolderTree className="w-3.5 h-3.5 text-indigo-400" />
            Repository Files
          </span>
          <div className="space-y-1">
            {NEXTJS_EXPORT_FILES.map((file, idx) => (
              <button
                key={file.path}
                onClick={() => setSelectedFileIndex(idx)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition flex items-center gap-2 ${
                  selectedFileIndex === idx
                    ? 'bg-neutral-800 text-indigo-300 font-medium'
                    : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900'
                }`}
              >
                <FileCode className="w-3.5 h-3.5 shrink-0 opacity-70" />
                <span className="truncate">{file.path}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Right: Code Viewer */}
        <div className="md:col-span-3 flex flex-col bg-neutral-950">
          {/* File Header */}
          <div className="p-3 border-b border-neutral-800 flex items-center justify-between bg-neutral-900/60">
            <div>
              <span className="font-mono text-xs font-semibold text-white">{currentFile.path}</span>
              <p className="text-[11px] text-neutral-400">{currentFile.description}</p>
            </div>
            <button
              onClick={handleCopy}
              className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded text-xs font-medium transition flex items-center gap-1.5"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto max-h-[500px] overflow-y-auto">
            <pre className="font-mono text-xs text-neutral-300 leading-relaxed">
              <code>{currentFile.content}</code>
            </pre>
          </div>
        </div>
      </div>

      {/* Step-by-Step Vercel Deployment Checklist */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <span>Step-by-Step Free Vercel Deployment Guide</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Step 1 */}
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">
                1
              </span>
              <span>Create Free Upstash Redis</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Visit <a href="https://console.upstash.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">console.upstash.com</a>, create a free Redis database, and copy <code className="text-neutral-300 font-mono">UPSTASH_REDIS_REST_URL</code> and <code className="text-neutral-300 font-mono">UPSTASH_REDIS_REST_TOKEN</code>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">
                2
              </span>
              <span>Push to GitHub Repo</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              Extract the downloaded ZIP or push the files to your GitHub account:
              <br />
              <code className="text-neutral-300 font-mono text-[11px] block mt-1">git init &amp;&amp; git add . &amp;&amp; git push</code>
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-4 bg-neutral-950 rounded-lg border border-neutral-800 space-y-2">
            <div className="flex items-center gap-2 text-indigo-400 font-semibold">
              <span className="w-5 h-5 rounded-full bg-indigo-950 border border-indigo-800 flex items-center justify-center text-[10px]">
                3
              </span>
              <span>Deploy on Vercel</span>
            </div>
            <p className="text-neutral-400 leading-relaxed">
              In Vercel, import your repository, add the Upstash Redis environment variables, and click <strong>Deploy</strong>. Your short links will be live at <code className="text-neutral-300 font-mono">yourapp.vercel.app/l/slug</code>!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
