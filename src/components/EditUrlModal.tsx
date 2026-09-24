import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Check } from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface EditUrlModalProps {
  isOpen: boolean;
  link: ShortLink | null;
  onClose: () => void;
  onSave: (slug: string, newUrl: string) => Promise<void>;
}

export const EditUrlModal: React.FC<EditUrlModalProps> = ({
  isOpen,
  link,
  onClose,
  onSave,
}) => {
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (link) {
      setUrl(link.destinationUrl);
      setError(null);
    }
  }, [link, isOpen]);

  if (!isOpen || !link) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Please provide a valid destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave(link.slug, url.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update destination URL');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h3 className="text-base font-bold text-white">Update Target Destination</h3>
            <p className="text-xs text-neutral-400">
              Change the active Lazada / affiliate destination for <code className="text-indigo-400 font-mono">/l/{link.slug}</code>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-emerald-400 mb-1.5">
              Active Lazada / Affiliate Target URL
            </label>
            <input
              type="url"
              required
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.lazada.sg/products/..."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500"
            />
            <p className="text-[11px] text-neutral-500 mt-1.5">
              Real users clicking this link will immediately be redirected via HTTP 307 to this URL. Meta crawlers will continue seeing the safe compliance page.
            </p>
          </div>

          <div className="pt-3 border-t border-neutral-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              <Check className="w-3.5 h-3.5" />
              {isSubmitting ? 'Updating...' : 'Update Destination URL'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
