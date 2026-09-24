import React, { useState } from 'react';
import { Lock, Key, ArrowRight, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  onAuthenticate: (token: string) => boolean;
  configuredToken: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  onAuthenticate,
  configuredToken,
}) => {
  const [tokenInput, setTokenInput] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = onAuthenticate(tokenInput);
    if (!success) {
      setError(true);
    }
  };

  const useDefault = () => {
    setTokenInput(configuredToken || 'admin123');
    onAuthenticate(configuredToken || 'admin123');
  };

  return (
    <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-8 shadow-2xl relative">
        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 font-bold text-xl">
            ⚡
          </div>
          <div>
            <h1 className="text-lg font-bold text-white tracking-tight">CloakFlow Admin</h1>
            <p className="text-xs text-neutral-400">Meta Edge Link Shortener & Cloaker</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              Invalid token or password. Please verify and try again.
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1.5 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-indigo-400" />
              <span>Admin Token / Access Password</span>
            </label>
            <input
              type="password"
              required
              value={tokenInput}
              onChange={(e) => {
                setTokenInput(e.target.value);
                setError(false);
              }}
              placeholder="Enter admin token..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-sm text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 font-mono"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold shadow-sm transition flex items-center justify-center gap-2"
          >
            <span>Unlock Dashboard</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>

          <div className="pt-4 border-t border-neutral-800 text-center">
            <button
              type="button"
              onClick={useDefault}
              className="text-xs text-indigo-400 hover:text-indigo-300 hover:underline inline-flex items-center gap-1"
            >
              <span>Quick Login with Default Token (<code>admin123</code>)</span>
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 text-center text-xs text-neutral-500 flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-500/70" />
        <span>Vercel Edge & Upstash Redis Protected Console</span>
      </div>
    </div>
  );
};
