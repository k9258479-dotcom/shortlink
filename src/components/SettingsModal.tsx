import React, { useState } from 'react';
import { Database, Shield, Check, AlertCircle, RefreshCw, Key, Eye, EyeOff } from 'lucide-react';

interface SettingsModalProps {
  storageStatus: {
    connected: boolean;
    provider: 'upstash' | 'local_kv';
    latencyMs?: number;
    error?: string;
  };
  onUpdateUpstash: (url: string, token: string) => Promise<any>;
  onResetStorage?: () => Promise<any>;
  currentAdminToken: string;
  onUpdateAdminToken: (token: string) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  storageStatus,
  onUpdateUpstash,
  onResetStorage,
  currentAdminToken,
  onUpdateAdminToken,
}) => {
  const [upstashUrl, setUpstashUrl] = useState('');
  const [upstashToken, setUpstashToken] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [testResult, setTestResult] = useState<any | null>(null);
  const [tokenInput, setTokenInput] = useState(currentAdminToken);
  const [tokenSaved, setTokenSaved] = useState(false);

  // Auto clean URL: strip variable prefixes, quotes, normalize unicode dashes, strip trailing slashes
  const handleUrlChange = (val: string) => {
    let clean = val.replace(/^UPSTASH_REDIS_REST_URL\s*=\s*/i, '');
    clean = clean.replace(/^['"]|['"]$/g, '');
    clean = clean.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
    setUpstashUrl(clean);
  };

  // Auto clean Token: strip variable prefixes, quotes, trim whitespace
  const handleTokenChange = (val: string) => {
    let clean = val.replace(/^UPSTASH_REDIS_REST_TOKEN\s*=\s*/i, '');
    clean = clean.replace(/^['"]|['"]$/g, '');
    setUpstashToken(clean.trim());
  };

  const handleTestAndSaveUpstash = async (e: React.FormEvent) => {
    e.preventDefault();
    let cleanUrl = upstashUrl.trim().replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-').replace(/\/+$/, '');
    if (!cleanUrl.startsWith('http://') && !cleanUrl.startsWith('https://')) {
      cleanUrl = `https://${cleanUrl}`;
    }
    const cleanToken = upstashToken.trim();

    if (!cleanUrl || !cleanToken) return;

    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await onUpdateUpstash(cleanUrl, cleanToken);
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ connected: false, error: err.message });
    } finally {
      setIsTesting(false);
    }
  };

  const handleRevertToLocal = async () => {
    if (!onResetStorage) return;
    setIsResetting(true);
    try {
      const res = await onResetStorage();
      setTestResult(res);
      setUpstashUrl('');
      setUpstashToken('');
    } catch (err: any) {
      setTestResult({ connected: false, error: err.message });
    } finally {
      setIsResetting(false);
    }
  };

  const handleSaveToken = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdminToken(tokenInput);
    setTokenSaved(true);
    setTimeout(() => setTokenSaved(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Upstash Redis Configuration */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h2 className="text-base font-semibold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Database & Upstash Redis Integration</span>
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Connect your free Upstash Redis database to store links, counters, and logs across edge instances.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono">
            <span className="text-neutral-500">Status:</span>
            {storageStatus.connected ? (
              <span className="text-emerald-400 font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                {storageStatus.provider === 'upstash' ? 'Upstash Connected' : 'Local Persistent KV (Active)'}
              </span>
            ) : (
              <span className="text-red-400 font-semibold flex items-center gap-1">
                <AlertCircle className="w-3.5 h-3.5" />
                Connection Error
              </span>
            )}
          </div>
        </div>

        {/* Informational callout */}
        <div className="p-3.5 bg-neutral-950 rounded-lg border border-neutral-800 text-xs text-neutral-400 space-y-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-neutral-200">💡 Local KV is Ready & Active</span>
            {storageStatus.provider === 'upstash' && (
              <button
                type="button"
                onClick={handleRevertToLocal}
                disabled={isResetting}
                className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
              >
                {isResetting ? 'Switching...' : 'Switch back to Local KV'}
              </button>
            )}
          </div>
          <p>
            Kahit walang Upstash Redis, <strong>100% functional na ang CloakFlow</strong> gamit ang built-in <strong>Local Persistent KV</strong>. Naka-save ang lahat ng short links at visit logs mo.
          </p>
          <div className="p-2.5 rounded bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-300 space-y-1">
            <div className="font-medium text-indigo-300">Paano kunin ang tamang Upstash Credentials:</div>
            <ol className="list-decimal list-inside space-y-0.5 text-neutral-400">
              <li>Pumunta sa <a href="https://console.upstash.com" target="_blank" rel="noreferrer" className="text-indigo-400 hover:underline">console.upstash.com</a> at i-click ang iyong Redis Database.</li>
              <li>Mag-scroll pababa sa <strong>REST API</strong> section (i-click ang <strong>.env</strong> tab).</li>
              <li>Kopyahin ang <code className="text-neutral-200 bg-neutral-800 px-1 rounded">UPSTASH_REDIS_REST_URL</code> (hal. https://...upstash.io).</li>
              <li>Kopyahin ang <code className="text-neutral-200 bg-neutral-800 px-1 rounded">UPSTASH_REDIS_REST_TOKEN</code> (mahabang key na nagsisimula sa AX...).</li>
              <li className="text-amber-400 font-medium">Huwag kopyahin ang Redis CLI password o Read-Only token!</li>
            </ol>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleTestAndSaveUpstash} className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-300">
                UPSTASH_REDIS_REST_URL
              </label>
              {upstashUrl && (
                <span className="text-[10px] text-neutral-500 font-mono">
                  {upstashUrl.includes('.upstash.io') ? '✓ valid domain' : 'dapat nagtatapos sa .upstash.io'}
                </span>
              )}
            </div>
            <input
              type="text"
              required
              value={upstashUrl}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://flexible-mullet-294948.upstash.io"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-medium text-neutral-300">
                UPSTASH_REDIS_REST_TOKEN
              </label>
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="text-[11px] text-neutral-400 hover:text-white flex items-center gap-1 transition"
              >
                {showToken ? (
                  <>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Hide Token</span>
                  </>
                ) : (
                  <>
                    <Eye className="w-3.5 h-3.5" />
                    <span>Show Token</span>
                  </>
                )}
              </button>
            </div>
            <div className="relative">
              <input
                type={showToken ? 'text' : 'password'}
                required
                value={upstashToken}
                onChange={(e) => handleTokenChange(e.target.value)}
                placeholder="AXb7ACQgZTA0YjFlMmMtMGZhZS00Y2..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 pr-10 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-300 transition"
              >
                {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {upstashToken && !upstashToken.startsWith('AX') && upstashToken.length < 35 && (
              <p className="mt-1 text-[11px] text-amber-400/90 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0" />
                Paalala: Ang REST token ay karaniwang mahaba at nagsisimula sa <strong>AX...</strong>. Paki-verify kung kinuha ito mula sa REST API tab (hindi CLI password).
              </p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              {testResult && (
                <div className="text-xs">
                  {testResult.connected ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" />
                      Connected to Upstash! Latency: {testResult.latencyMs}ms
                    </span>
                  ) : (
                    <div className="text-red-400 flex items-start gap-1.5 max-w-md">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold">Error sa Koneksyon:</div>
                        <div className="text-[11px] text-neutral-400">{testResult.error || 'Failed to ping Upstash'}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {storageStatus.provider === 'upstash' && (
                <button
                  type="button"
                  onClick={handleRevertToLocal}
                  disabled={isResetting}
                  className="px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-medium transition"
                >
                  Use Local KV
                </button>
              )}
              <button
                type="submit"
                disabled={isTesting}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center gap-1.5"
              >
                {isTesting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Testing Ping...
                  </>
                ) : (
                  'Save & Test Upstash Connection'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Admin Password / Token */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-4">
        <div className="pb-3 border-b border-neutral-800">
          <h2 className="text-base font-semibold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>Admin Authentication Token</span>
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">
            Password or token required to access the dashboard on <code className="text-neutral-300 font-mono">/admin</code>.
          </p>
        </div>

        <form onSubmit={handleSaveToken} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Admin Access Token
            </label>
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="admin123"
              className="w-full max-w-md bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg text-xs font-semibold transition"
            >
              Update Admin Token
            </button>
            {tokenSaved && (
              <span className="text-xs text-emerald-400 flex items-center gap-1">
                <Check className="w-3.5 h-3.5" />
                Updated!
              </span>
            )}
          </div>
        </form>
      </div>

      {/* Meta Crawler Rules Reference */}
      <div className="rounded-xl border border-neutral-800/80 bg-neutral-900/40 p-6 space-y-3">
        <h3 className="text-sm font-semibold text-white">Active Meta Crawler User-Agent Patterns</h3>
        <p className="text-xs text-neutral-400">
          The edge middleware matches against the following official Meta signatures:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono">
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">facebookexternalhit</span> (OpenGraph scraper)
          </div>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">Facebot</span> (Facebook page indexer)
          </div>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">MetaInspector</span> (Ad policy compliance checker)
          </div>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">facebookcatalog</span> (Commerce feed crawler)
          </div>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">meta-externalagent</span> (Meta AI & Ad reviewer)
          </div>
          <div className="p-2.5 bg-neutral-950 rounded border border-neutral-800 text-neutral-300">
            <span className="text-indigo-400">meta-externalfetcher</span> (Background asset fetcher)
          </div>
        </div>
      </div>
    </div>
  );
};
