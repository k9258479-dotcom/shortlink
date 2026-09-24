import React, { useState, useEffect } from 'react';
import { X, Sparkles, Shield, ArrowRight } from 'lucide-react';
import { ShortLink } from '../types/index.js';

interface CreateLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (linkData: Partial<ShortLink>) => Promise<void>;
  editLink: ShortLink | null;
}

export const CreateLinkModal: React.FC<CreateLinkModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editLink,
}) => {
  const [slug, setSlug] = useState('');
  const [destinationUrl, setDestinationUrl] = useState('');
  const [complianceTitle, setComplianceTitle] = useState('');
  const [complianceDescription, setComplianceDescription] = useState('');
  const [ogImage, setOgImage] = useState('');
  const [brandName, setBrandName] = useState('');
  const [category, setCategory] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editLink) {
      setSlug(editLink.slug);
      setDestinationUrl(editLink.destinationUrl);
      setComplianceTitle(editLink.complianceTitle);
      setComplianceDescription(editLink.complianceDescription);
      setOgImage(editLink.ogImage);
      setBrandName(editLink.brandName);
      setCategory(editLink.category);
    } else {
      setSlug('');
      setDestinationUrl('');
      setComplianceTitle('');
      setComplianceDescription('');
      setOgImage('');
      setBrandName('');
      setCategory('');
    }
    setError(null);
  }, [editLink, isOpen]);

  if (!isOpen) return null;

  const applyPreset = (type: 'lazada' | 'shopee' | 'gadget') => {
    if (type === 'lazada') {
      setSlug(slug || 'lazada-mega');
      setDestinationUrl('https://www.lazada.sg/products/smart-wearable-device-offer1.html?spm=a2o42.campaign.topdeals');
      setComplianceTitle('Comprehensive Wearable Smartwatch & Fitness Tracker Review 2026');
      setComplianceDescription('Independent battery life benchmark, heart rate monitor accuracy testing, and consumer satisfaction analysis.');
      setOgImage('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop');
      setBrandName('Verified Consumer Health Tech');
      setCategory('Electronics & Wearables');
    } else if (type === 'shopee') {
      setSlug(slug || 'shopee-deal');
      setDestinationUrl('https://shopee.sg/product/892019/392018420');
      setComplianceTitle('Wireless Mechanical Keyboard Technical Overview & Sound Tests');
      setComplianceDescription('Acoustic frequency profiles, switch durability metrics, and latency measurement for productivity setups.');
      setOgImage('https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=1200&h=630&fit=crop');
      setBrandName('Hardware Desk Journal');
      setCategory('Computer Accessories');
    } else {
      setSlug(slug || 'offer1');
      setDestinationUrl('https://www.lazada.com.my/tag/headphones-sale');
      setComplianceTitle('Studio Hi-Fi Wireless Headphones Benchmark & Noise Cancelling Guide');
      setComplianceDescription('Laboratory frequency response curve test, active noise cancellation decibel reduction metrics.');
      setOgImage('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop');
      setBrandName('Acoustic Digest Reviews');
      setCategory('Audio Equipment');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug.trim()) {
      setError('Please provide a short slug (e.g., offer1)');
      return;
    }
    if (!destinationUrl.trim()) {
      setError('Please provide the target destination URL');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSave({
        slug: slug.trim().toLowerCase(),
        destinationUrl: destinationUrl.trim(),
        complianceTitle: complianceTitle.trim() || 'Verified Product Showcase',
        complianceDescription: complianceDescription.trim() || 'Consumer product information and specifications.',
        ogImage: ogImage.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop',
        brandName: brandName.trim() || 'Consumer Review Hub',
        category: category.trim() || 'General Products',
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save short link');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl max-w-2xl w-full p-6 my-8 shadow-2xl relative">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div>
            <h3 className="text-lg font-bold text-white">
              {editLink ? `Edit Short Link: /l/${editLink.slug}` : 'Create Dynamic Short Link'}
            </h3>
            <p className="text-xs text-neutral-400">
              Configure real-user redirection target and crawler safe compliance metadata.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Presets (when creating new) */}
        {!editLink && (
          <div className="mt-4 p-3 bg-neutral-950/60 rounded-xl border border-neutral-800/80">
            <div className="flex items-center justify-between text-xs mb-2">
              <span className="text-neutral-400 flex items-center gap-1.5 font-medium">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                Quick Templates
              </span>
              <span className="text-neutral-500 text-[11px]">Click to auto-populate compliance data</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => applyPreset('lazada')}
                className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition"
              >
                Lazada Smartwatch Review
              </button>
              <button
                type="button"
                onClick={() => applyPreset('gadget')}
                className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition"
              >
                Hi-Fi Audio Headphones
              </button>
              <button
                type="button"
                onClick={() => applyPreset('shopee')}
                className="px-2.5 py-1 text-xs bg-neutral-900 hover:bg-neutral-800 text-neutral-300 rounded border border-neutral-700 transition"
              >
                Mechanical Keyboard Guide
              </button>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800/60 rounded-lg text-xs text-red-300">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Slug */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Short URL Slug <span className="text-indigo-400">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-neutral-500 font-mono">
                  /l/
                </span>
                <input
                  type="text"
                  required
                  disabled={!!editLink}
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, ''))}
                  placeholder="offer1"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500 disabled:opacity-60"
                />
              </div>
            </div>

            {/* Brand / Publisher */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Brand / Publisher Name
              </label>
              <input
                type="text"
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                placeholder="Verified Consumer Reviews"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Active Target URL */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-emerald-400 flex items-center gap-1.5">
                <span>Active Target URL (Real Users Redirect)</span>
                <span className="text-indigo-400">*</span>
              </label>
              <span className="text-[11px] text-neutral-500">Instant HTTP 307 Redirect</span>
            </div>
            <input
              type="url"
              required
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              placeholder="https://www.lazada.sg/products/headphones-sale.html"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs font-mono text-emerald-300 placeholder-neutral-600 focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Compliance Title */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-amber-400">
                Safe Compliance Title (Served to Meta Crawler / Facebook)
              </label>
              <span className="text-[11px] text-neutral-500">og:title & H1 Header</span>
            </div>
            <input
              type="text"
              value={complianceTitle}
              onChange={(e) => setComplianceTitle(e.target.value)}
              placeholder="Wireless Noise-Cancelling Headphones Consumer Benchmark"
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-amber-500"
            />
          </div>

          {/* Compliance Description */}
          <div>
            <label className="block text-xs font-medium text-neutral-300 mb-1">
              Compliance Description & OpenGraph Snippet
            </label>
            <textarea
              rows={2}
              value={complianceDescription}
              onChange={(e) => setComplianceDescription(e.target.value)}
              placeholder="Independent acoustic testing and buyer guidance published for consumer editorial research."
              className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* OG Image */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                OpenGraph Preview Image URL (1200x630)
              </label>
              <input
                type="url"
                value={ogImage}
                onChange={(e) => setOgImage(e.target.value)}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-medium text-neutral-300 mb-1">
                Category
              </label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Consumer Electronics"
                className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Footer Submit */}
          <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-3">
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
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg shadow-sm transition flex items-center gap-1.5"
            >
              {isSubmitting ? 'Saving...' : editLink ? 'Update Short Link' : 'Create Short Link'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
