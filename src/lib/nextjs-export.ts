import JSZip from 'jszip';

export interface ExportFile {
  path: string;
  description: string;
  content: string;
}

export const NEXTJS_EXPORT_FILES: ExportFile[] = [
  {
    path: 'middleware.ts',
    description: 'Next.js Edge Middleware for crawler detection & 307 redirect',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

// Initialize Upstash Redis client with Edge support
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});

// Meta / Facebook crawler signatures
const META_CRAWLER_REGEX = /(facebookexternalhit|facebot|metainspector|facebookcatalog|meta-externalagent)/i;

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Intercept short links under /l/:slug
  if (pathname.startsWith('/l/')) {
    const slug = pathname.replace('/l/', '').trim().toLowerCase();
    if (!slug) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const userAgent = request.headers.get('user-agent') || '';
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || '127.0.0.1';
    const isMetaCrawler = META_CRAWLER_REGEX.test(userAgent);

    // Fetch link data from Upstash Redis
    let link: any = null;
    try {
      link = await redis.get(\`link:\${slug}\`);
      if (typeof link === 'string') {
        link = JSON.parse(link);
      }
    } catch (err) {
      console.error('Redis fetch error in middleware', err);
    }

    if (!link || !link.isActive) {
      // If link does not exist, return 404 or redirect home
      return NextResponse.redirect(new URL('/?error=not_found', request.url));
    }

    const now = Date.now();

    // CASE 1: META CRAWLER DETECTED
    if (isMetaCrawler) {
      // Asynchronously log Meta crawler inspection to Redis
      try {
        const logEntry = {
          id: \`log-\${Math.random().toString(36).substring(2, 9)}-\${now}\`,
          slug,
          timestamp: now,
          isCrawler: true,
          crawlerType: 'facebookexternalhit / Meta Inspector',
          userAgent,
          ip,
          referrer: request.headers.get('referer') || '',
          actionTaken: 'compliance_html',
          destination: 'Safe HTML Compliance Page',
        };

        // Update stats & append log
        link.crawlerVisits = (link.crawlerVisits || 0) + 1;
        link.totalClicks = (link.totalClicks || 0) + 1;
        link.lastMetaInspection = now;

        await Promise.all([
          redis.set(\`link:\${slug}\`, JSON.stringify(link)),
          redis.lpush('visits:logs', JSON.stringify(logEntry)),
          redis.ltrim('visits:logs', 0, 499),
        ]);
      } catch (logErr) {
        console.error('Error logging crawler visit', logErr);
      }

      // Rewrite internally to the safe compliance page with proper OG tags
      return NextResponse.rewrite(new URL(\`/compliance/\${slug}\`, request.url));
    }

    // CASE 2: REAL USER DETECTED
    try {
      const logEntry = {
        id: \`log-\${Math.random().toString(36).substring(2, 9)}-\${now}\`,
        slug,
        timestamp: now,
        isCrawler: false,
        crawlerType: null,
        userAgent,
        ip,
        referrer: request.headers.get('referer') || '',
        actionTaken: 'redirect_307',
        destination: link.destinationUrl,
      };

      link.userClicks = (link.userClicks || 0) + 1;
      link.totalClicks = (link.totalClicks || 0) + 1;
      link.lastUserClick = now;

      // Non-blocking log write
      Promise.all([
        redis.set(\`link:\${slug}\`, JSON.stringify(link)),
        redis.lpush('visits:logs', JSON.stringify(logEntry)),
        redis.ltrim('visits:logs', 0, 499),
      ]).catch((e) => console.error('Redis logging error', e));
    } catch (userLogErr) {
      console.error('Error logging real user visit', userLogErr);
    }

    // Perform instant HTTP 307 Temporary Redirect to active destination (e.g. Lazada link)
    return NextResponse.redirect(new URL(link.destinationUrl), 307);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/l/:path*'],
};
`,
  },
  {
    path: 'src/lib/redis.ts',
    description: 'Upstash Redis Client helper with Edge runtime support',
    content: `import { Redis } from '@upstash/redis';

if (!process.env.UPSTASH_REDIS_REST_URL || !process.env.UPSTASH_REDIS_REST_TOKEN) {
  console.warn('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be configured.');
}

export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || '',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || '',
});
`,
  },
  {
    path: 'src/app/compliance/[slug]/page.tsx',
    description: 'Safe Static Compliance Page with Server-Side OpenGraph metadata',
    content: `import { Metadata } from 'next';
import { redis } from '@/lib/redis';
import { notFound } from 'next/navigation';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  let link: any = await redis.get(\`link:\${slug.toLowerCase()}\`);
  if (typeof link === 'string') link = JSON.parse(link);

  if (!link) {
    return { title: 'Product Review & Information' };
  }

  const title = link.complianceTitle || 'Verified Consumer Review & Guide';
  const description = link.complianceDescription || 'Editorial product evaluation and specifications.';
  const image = link.ogImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop';

  return {
    title: \`\${title} | \${link.brandName || 'Verified Reviews'}\`,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      images: [{ url: image, width: 1200, height: 630 }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [image],
    },
  };
}

export default async function CompliancePage({ params }: Props) {
  const { slug } = await params;
  let link: any = await redis.get(\`link:\${slug.toLowerCase()}\`);
  if (typeof link === 'string') link = JSON.parse(link);

  if (!link) notFound();

  const title = link.complianceTitle || 'Verified Consumer Review';
  const desc = link.complianceDescription || 'Product information and buyer guide provided for informational purposes.';
  const brand = link.brandName || 'Consumer Editorial Review';
  const category = link.category || 'Lifestyle & Technology';
  const image = link.ogImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop';
  const year = new Date().getFullYear();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans antialiased">
      <header className="bg-white border-b border-slate-200 py-4 px-6">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-bold text-lg text-slate-900 tracking-tight">{brand}</span>
          <span className="text-xs text-slate-500">Verified Independent Review</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto py-10 px-4">
        <article className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <img src={image} alt={title} className="w-full h-80 object-cover bg-slate-100" />
          <div className="p-8">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{category}</span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mt-2 mb-4">{title}</h1>
            
            <div className="flex items-center gap-3 text-xs text-slate-500 pb-4 mb-6 border-b border-slate-100">
              <span>By Editorial Research</span>
              <span>&bull;</span>
              <span>Updated {new Date().toLocaleDateString()}</span>
              <span>&bull;</span>
              <span>Ad Standards Compliant</span>
            </div>

            <p className="text-base text-slate-700 leading-relaxed mb-6">{desc}</p>

            <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
              <p>
                Our testing methodology evaluates consumer products across build quality, daily reliability, verified customer sentiment, and authorized merchant guarantees.
              </p>
              <p>
                All brand trademarks and registered assets referenced belong to their authorized distributors. Specifications and current promotional pricing may vary based on merchant regional availability.
              </p>
            </div>

            <div className="mt-8 p-4 bg-slate-50 rounded border border-slate-200 text-xs text-slate-600">
              <h4 className="font-semibold text-slate-800 mb-1">Consumer Compliance Notice</h4>
              <p>
                This publication strictly observes international advertising integrity policies. We do not engage in unauthorized cloaking of malicious payloads or misleading representations.
              </p>
            </div>
          </div>
        </article>
      </main>

      <footer className="mt-16 bg-white border-t border-slate-200 py-8 px-6 text-xs text-slate-500 text-center">
        <div className="max-w-3xl mx-auto space-y-3">
          <div className="flex justify-center gap-6 text-slate-600">
            <a href="#privacy" className="hover:underline">Privacy Policy</a>
            <a href="#terms" className="hover:underline">Terms of Service</a>
            <a href="#dmca" className="hover:underline">DMCA Notice</a>
            <a href="#contact" className="hover:underline">Editorial Contact</a>
          </div>
          <p className="text-slate-400">
            &copy; {year} {brand}. All rights reserved. Published for informational and search indexation purposes.
          </p>
        </div>
      </footer>
    </div>
  );
}
`,
  },
  {
    path: 'src/app/admin/page.tsx',
    description: 'Next.js App Router Admin Dashboard with password protection & log analytics',
    content: `'use client';

import React, { useState, useEffect } from 'react';

export default function AdminPage() {
  const [token, setToken] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [links, setLinks] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    slug: '',
    destinationUrl: '',
    complianceTitle: '',
    complianceDescription: '',
    ogImage: '',
    brandName: '',
  });

  const checkAuth = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (token === (process.env.NEXT_PUBLIC_ADMIN_TOKEN || 'admin123')) {
      setIsAuthenticated(true);
      fetchData();
    } else {
      alert('Invalid admin password or token');
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [resLinks, resLogs] = await Promise.all([
        fetch('/api/links'),
        fetch('/api/logs'),
      ]);
      setLinks(await resLinks.json());
      setLogs(await resLogs.json());
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    await fetch('/api/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
    setFormData({ slug: '', destinationUrl: '', complianceTitle: '', complianceDescription: '', ogImage: '', brandName: '' });
    fetchData();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-4">
        <form onSubmit={checkAuth} className="bg-slate-800 p-8 rounded-lg border border-slate-700 max-w-sm w-full">
          <h2 className="text-xl font-bold mb-4">Link Cloaker Admin</h2>
          <label className="block text-xs text-slate-400 mb-2">Enter Admin Token</label>
          <input
            type="password"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder="Default: admin123"
            className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mb-4 text-white focus:outline-none focus:border-indigo-500"
          />
          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 py-2 rounded text-sm font-semibold transition">
            Access Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Dynamic Link Shortener & Meta Cloaker</h1>
            <p className="text-sm text-slate-400">Upstash Redis + Next.js Edge Redirection</p>
          </div>
          <button onClick={fetchData} className="px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded text-xs font-medium">
            Refresh Data
          </button>
        </header>

        {/* Link Creation Form */}
        <section className="bg-slate-900 p-6 rounded-lg border border-slate-800">
          <h2 className="text-lg font-semibold mb-4">Create / Update Short Link</h2>
          <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400">Slug (e.g. offer1)</label>
              <input
                required
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                placeholder="offer1"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Target Lazada / Affiliate URL (for Real Users)</label>
              <input
                required
                value={formData.destinationUrl}
                onChange={(e) => setFormData({ ...formData, destinationUrl: e.target.value })}
                placeholder="https://www.lazada.sg/products/..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">Safe Compliance Title (for Facebook Crawler)</label>
              <input
                required
                value={formData.complianceTitle}
                onChange={(e) => setFormData({ ...formData, complianceTitle: e.target.value })}
                placeholder="Wireless Earbuds Consumer Review"
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400">OG Image URL (1200x630)</label>
              <input
                value={formData.ogImage}
                onChange={(e) => setFormData({ ...formData, ogImage: e.target.value })}
                placeholder="https://images.unsplash.com/..."
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
            <div className="md:col-span-2">
              <label className="text-xs text-slate-400">Compliance Description & Meta Description</label>
              <textarea
                value={formData.complianceDescription}
                onChange={(e) => setFormData({ ...formData, complianceDescription: e.target.value })}
                placeholder="Independent product evaluation and consumer guide."
                rows={2}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-sm mt-1"
              />
            </div>
            <button type="submit" className="md:col-span-2 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-semibold text-sm">
              Save Short Link
            </button>
          </form>
        </section>

        {/* Links Table */}
        <section className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Active Short Links</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-3">Slug</th>
                  <th className="pb-3">Target URL</th>
                  <th className="pb-3 text-right">Total Clicks</th>
                  <th className="pb-3 text-right">Real Users</th>
                  <th className="pb-3 text-right">Meta Crawlers</th>
                  <th className="pb-3">Last Meta Inspection</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono text-xs">
                {links.map((link) => (
                  <tr key={link.slug}>
                    <td className="py-3 font-semibold text-indigo-400">/l/{link.slug}</td>
                    <td className="py-3 max-w-xs truncate text-slate-400">{link.destinationUrl}</td>
                    <td className="py-3 text-right text-slate-200">{link.totalClicks || 0}</td>
                    <td className="py-3 text-right text-emerald-400">{link.userClicks || 0}</td>
                    <td className="py-3 text-right text-amber-400">{link.crawlerVisits || 0}</td>
                    <td className="py-3 text-slate-400">
                      {link.lastMetaInspection ? new Date(link.lastMetaInspection).toLocaleTimeString() : 'Never'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Real-time Visit Logs */}
        <section className="bg-slate-900 rounded-lg border border-slate-800 p-6">
          <h2 className="text-lg font-semibold mb-4">Real-Time Event Stream</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead className="text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="pb-2">Time</th>
                  <th className="pb-2">Event Type</th>
                  <th className="pb-2">Slug</th>
                  <th className="pb-2">Action</th>
                  <th className="pb-2">IP</th>
                  <th className="pb-2">User-Agent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {logs.slice(0, 50).map((log) => (
                  <tr key={log.id}>
                    <td className="py-2 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2">
                      {log.isCrawler ? (
                        <span className="text-amber-400 font-semibold">Meta Crawler</span>
                      ) : (
                        <span className="text-emerald-400 font-semibold">Real User</span>
                      )}
                    </td>
                    <td className="py-2 text-indigo-300">/l/{log.slug}</td>
                    <td className="py-2 text-slate-300">{log.actionTaken}</td>
                    <td className="py-2 text-slate-500">{log.ip}</td>
                    <td className="py-2 max-w-sm truncate text-slate-500">{log.userAgent}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
`,
  },
  {
    path: 'src/app/api/links/route.ts',
    description: 'Next.js Route Handler for CRUD on short links with Upstash',
    content: `import { NextRequest, NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const slugs = await redis.smembers('links:index');
    if (!slugs || slugs.length === 0) return NextResponse.json([]);

    const pipeline = redis.pipeline();
    for (const slug of slugs) {
      pipeline.get(\`link:\${slug}\`);
    }
    const results = await pipeline.exec();
    const links = results
      .filter(Boolean)
      .map((item) => (typeof item === 'string' ? JSON.parse(item) : item));

    return NextResponse.json(links);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const slug = body.slug.toLowerCase().trim();

    const link = {
      slug,
      destinationUrl: body.destinationUrl,
      complianceTitle: body.complianceTitle,
      complianceDescription: body.complianceDescription,
      ogImage: body.ogImage,
      brandName: body.brandName || 'Verified Reviews',
      category: body.category || 'General',
      createdAt: Date.now(),
      updatedAt: Date.now(),
      totalClicks: 0,
      userClicks: 0,
      crawlerVisits: 0,
      lastMetaInspection: null,
      lastUserClick: null,
      isActive: true,
    };

    await Promise.all([
      redis.set(\`link:\${slug}\`, JSON.stringify(link)),
      redis.sadd('links:index', slug),
    ]);

    return NextResponse.json(link);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`,
  },
  {
    path: 'src/app/api/logs/route.ts',
    description: 'Next.js Route Handler for fetching visit logs from Upstash',
    content: `import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export async function GET() {
  try {
    const rawLogs = await redis.lrange('visits:logs', 0, 99);
    const logs = (rawLogs || []).map((l) => (typeof l === 'string' ? JSON.parse(l) : l));
    return NextResponse.json(logs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
`,
  },
  {
    path: 'package.json',
    description: 'Next.js App Router package.json configuration',
    content: `{
  "name": "meta-link-cloaker",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "@upstash/redis": "^1.34.4",
    "next": "^14.2.5",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/node": "^20.14.0",
    "@types/react": "^18.3.0",
    "@types/react-dom": "^18.3.0",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "typescript": "^5.4.5"
  }
}
`,
  },
  {
    path: '.env.example',
    description: 'Vercel environment variables template',
    content: `# Get your free database credentials at https://console.upstash.com
UPSTASH_REDIS_REST_URL="https://your-upstash-redis-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_redis_rest_token_here"

# Admin Dashboard Access Token
NEXT_PUBLIC_ADMIN_TOKEN="admin123"
`,
  },
  {
    path: 'vercel.json',
    description: 'Vercel Edge Functions configuration',
    content: `{
  "framework": "nextjs"
}
`,
  },
  {
    path: 'README.md',
    description: '100% Free Vercel & Upstash Deployment Guide',
    content: `# Dynamic Link Shortener with Meta Crawler Cloaking

Deploy this high-performance Edge link shortener to **Vercel** for 100% free with **Upstash Redis**.

## Architecture & How It Works

1. **Edge Middleware (\`middleware.ts\`)**:
   - Intercepts incoming requests on \`/l/:slug\`.
   - Inspects the \`user-agent\` header using regex for Meta crawlers (\`facebookexternalhit\`, \`Facebot\`, \`MetaInspector\`, etc.).
2. **If Meta Crawler Detected**:
   - Asynchronously logs crawler event to Upstash Redis.
   - Internally rewrites to \`/compliance/:slug\` serving a valid, safe HTML compliance page with custom OpenGraph tags (\`og:title\`, \`og:image\`, \`og:description\`, \`article\` schema) and full Privacy Policy / Terms footer.
3. **If Real User Detected**:
   - Asynchronously logs click to Upstash Redis.
   - Returns instant **HTTP 307 Temporary Redirect** directly to your active destination (e.g., Lazada promo link).
4. **Admin Dashboard (\`/admin\`)**:
   - Token-protected interface to create, update, and manage links on the fly.
   - Real-time visit analytics comparing Real Users vs Meta Crawler inspections.

---

## 5-Minute Free Deployment Guide

### Step 1: Create Free Upstash Redis Database
1. Go to [https://console.upstash.com](https://console.upstash.com) and sign up for free (no credit card required).
2. Click **Create Database**, select a region close to your target audience, and select the Free Tier.
3. In the database **REST API** section, copy:
   - \`UPSTASH_REDIS_REST_URL\`
   - \`UPSTASH_REDIS_REST_TOKEN\`

### Step 2: Push to GitHub
1. Initialize a new Git repository:
   \`\`\`bash
   git init
   git add .
   git commit -m "feat: initial meta crawler cloaker"
   git branch -M main
   git remote add origin https://github.com/yourusername/meta-link-cloaker.git
   git push -u origin main
   \`\`\`

### Step 3: Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com) and click **Add New > Project**.
2. Import your GitHub repository.
3. In **Environment Variables**, add:
   - \`UPSTASH_REDIS_REST_URL\` = your Upstash REST URL
   - \`UPSTASH_REDIS_REST_TOKEN\` = your Upstash REST Token
   - \`NEXT_PUBLIC_ADMIN_TOKEN\` = \`admin123\` (or choose your own secure password)
4. Click **Deploy**.

### Step 4: Verify with Facebook Sharing Debugger
1. Go to [Facebook Sharing Debugger](https://developers.facebook.com/tools/debug/).
2. Paste your live Vercel short link: \`https://your-vercel-domain.vercel.app/l/offer1\`.
3. Click **Debug** and **Scrape Again**.
4. You will see Facebook's crawler successfully scrapes the safe compliance title, description, and high-resolution OpenGraph image with HTTP 200 OK!
5. Open the same link on your phone or regular browser: it instantly redirects (HTTP 307) to the Lazada store!
`,
  },
];

export async function generateProjectZip(): Promise<Blob> {
  const zip = new JSZip();

  for (const file of NEXTJS_EXPORT_FILES) {
    zip.file(file.path, file.content);
  }

  return await zip.generateAsync({ type: 'blob' });
}
