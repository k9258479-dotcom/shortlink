import { Redis } from '@upstash/redis';
import fs from 'fs';
import path from 'path';
import { ShortLink, VisitLog } from '../types/index.js';

const DATA_DIR = path.resolve(process.cwd(), '.data');
const LINKS_FILE = path.join(DATA_DIR, 'links.json');
const LOGS_FILE = path.join(DATA_DIR, 'logs.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch (err) {
    console.error('Failed to create data dir', err);
  }
}

// In-memory cache for fast sync
let cachedLinks: Record<string, ShortLink> = {};
let cachedLogs: VisitLog[] = [];

// Seed sample links if empty
const DEFAULT_LINKS: ShortLink[] = [
  {
    slug: 'offer1',
    destinationUrl: 'https://www.lazada.sg/products/wireless-noise-cancelling-headphones-i102938475.html?spm=a2o42.searchlist.offer1',
    complianceTitle: 'Premium Wireless Noise Cancelling Headphones - Verified Review',
    complianceDescription: 'Comprehensive test results, soundstage benchmarks, battery life measurements, and verified authentic customer ratings.',
    ogImage: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1200&h=630&fit=crop',
    brandName: 'AudioLab Reviews',
    category: 'Electronics & Audio',
    createdAt: Date.now() - 86400000 * 2,
    updatedAt: Date.now() - 86400000,
    totalClicks: 42,
    userClicks: 35,
    crawlerVisits: 7,
    lastMetaInspection: Date.now() - 3600000 * 4,
    lastUserClick: Date.now() - 60000 * 12,
    isActive: true,
  },
  {
    slug: 'lazada-mega',
    destinationUrl: 'https://www.lazada.com.my/tag/smartphones-sale/?spm=a2o4k.home.categories',
    complianceTitle: 'Official 2026 Flagship Smartphone Buyer Guide & Specs',
    complianceDescription: 'Technical performance review, camera comparisons, battery longevity metrics, and warranty guarantee information.',
    ogImage: 'https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=1200&h=630&fit=crop',
    brandName: 'TechRadar Buyer Guide',
    category: 'Consumer Electronics',
    createdAt: Date.now() - 86400000 * 5,
    updatedAt: Date.now() - 86400000 * 2,
    totalClicks: 118,
    userClicks: 94,
    crawlerVisits: 24,
    lastMetaInspection: Date.now() - 3600000 * 1,
    lastUserClick: Date.now() - 60000 * 25,
    isActive: true,
  },
  {
    slug: 'flash-sale',
    destinationUrl: 'https://www.lazada.co.th/products/smart-fitness-tracker-watch-waterproof-i8492019.html',
    complianceTitle: 'Ergonomic Smart Fitness Tracker & Health Monitor Guide',
    complianceDescription: 'In-depth overview of bio-metric tracking precision, water resistance ratings, and everyday fitness styling.',
    ogImage: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop',
    brandName: 'Consumer Health Journal',
    category: 'Health & Wearables',
    createdAt: Date.now() - 86400000 * 7,
    updatedAt: Date.now() - 86400000 * 3,
    totalClicks: 79,
    userClicks: 68,
    crawlerVisits: 11,
    lastMetaInspection: Date.now() - 3600000 * 8,
    lastUserClick: Date.now() - 60000 * 45,
    isActive: true,
  },
];

// Seed sample logs
const DEFAULT_LOGS: VisitLog[] = [
  {
    id: 'log-1',
    slug: 'offer1',
    timestamp: Date.now() - 3600000 * 4,
    isCrawler: true,
    crawlerType: 'facebookexternalhit (Meta OpenGraph Scraper)',
    userAgent: 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)',
    ip: '31.13.115.10',
    referrer: 'https://facebook.com',
    actionTaken: 'compliance_html',
    destination: 'Safe HTML Compliance Page',
  },
  {
    id: 'log-2',
    slug: 'offer1',
    timestamp: Date.now() - 60000 * 12,
    isCrawler: false,
    crawlerType: null,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1',
    ip: '118.200.41.98',
    referrer: 'https://m.facebook.com/',
    actionTaken: 'redirect_307',
    destination: 'https://www.lazada.sg/products/wireless-noise-cancelling-headphones-i102938475.html?spm=a2o42.searchlist.offer1',
  },
  {
    id: 'log-3',
    slug: 'lazada-mega',
    timestamp: Date.now() - 3600000 * 1,
    isCrawler: true,
    crawlerType: 'Facebot (Meta Page Indexer)',
    userAgent: 'Facebot',
    ip: '69.171.251.22',
    referrer: 'https://facebook.com',
    actionTaken: 'compliance_html',
    destination: 'Safe HTML Compliance Page',
  },
  {
    id: 'log-4',
    slug: 'lazada-mega',
    timestamp: Date.now() - 60000 * 25,
    isCrawler: false,
    crawlerType: null,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; SM-S918B) AppleWebKit/537.36 Chrome/122.0.0.0 Mobile Safari/537.36',
    ip: '202.168.85.12',
    referrer: 'https://l.facebook.com/',
    actionTaken: 'redirect_307',
    destination: 'https://www.lazada.com.my/tag/smartphones-sale/?spm=a2o4k.home.categories',
  },
];

// Initialize local file cache
function initLocalStorage() {
  try {
    if (fs.existsSync(LINKS_FILE)) {
      const data = fs.readFileSync(LINKS_FILE, 'utf-8');
      cachedLinks = JSON.parse(data);
    } else {
      cachedLinks = {};
      for (const link of DEFAULT_LINKS) {
        cachedLinks[link.slug] = link;
      }
      fs.writeFileSync(LINKS_FILE, JSON.stringify(cachedLinks, null, 2));
    }

    if (fs.existsSync(LOGS_FILE)) {
      const data = fs.readFileSync(LOGS_FILE, 'utf-8');
      cachedLogs = JSON.parse(data);
    } else {
      cachedLogs = [...DEFAULT_LOGS];
      fs.writeFileSync(LOGS_FILE, JSON.stringify(cachedLogs, null, 2));
    }
  } catch (err) {
    console.error('Error loading local storage files', err);
    cachedLinks = {};
    for (const link of DEFAULT_LINKS) {
      cachedLinks[link.slug] = link;
    }
    cachedLogs = [...DEFAULT_LOGS];
  }
}

initLocalStorage();

function persistLocalLinks() {
  try {
    fs.writeFileSync(LINKS_FILE, JSON.stringify(cachedLinks, null, 2));
  } catch (err) {
    console.error('Failed to write links to disk', err);
  }
}

function persistLocalLogs() {
  try {
    fs.writeFileSync(LOGS_FILE, JSON.stringify(cachedLogs.slice(0, 500), null, 2));
  } catch (err) {
    console.error('Failed to write logs to disk', err);
  }
}

/**
 * Returns configured Upstash Redis instance if available
 */
let upstashClient: Redis | null = null;
let customUpstashUrl = process.env.UPSTASH_REDIS_REST_URL || '';
let customUpstashToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

export function getUpstashClient(): Redis | null {
  if (customUpstashUrl && customUpstashToken && customUpstashUrl.startsWith('http')) {
    if (!upstashClient) {
      try {
        upstashClient = new Redis({
          url: customUpstashUrl,
          token: customUpstashToken,
        });
      } catch (err) {
        console.error('Failed to init Upstash Redis client', err);
        return null;
      }
    }
    return upstashClient;
  }
  return null;
}

export function sanitizeUpstashUrl(url: string): string {
  let cleaned = (url || '').trim();
  // Strip variable name prefix if copied from .env
  cleaned = cleaned.replace(/^UPSTASH_REDIS_REST_URL\s*=\s*/i, '');
  // Strip wrapping quotes
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');
  // Replace unicode en-dash, em-dash, and minus characters with ASCII hyphen '-'
  cleaned = cleaned.replace(/[\u2010-\u2015\u2212\uFE58\uFE63\uFF0D]/g, '-');
  // Strip trailing slashes
  cleaned = cleaned.trim().replace(/\/+$/, '');
  if (cleaned && !cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
    cleaned = `https://${cleaned}`;
  }
  return cleaned;
}

export function sanitizeUpstashToken(token: string): string {
  let cleaned = (token || '').trim();
  // Strip variable name prefix if copied from .env
  cleaned = cleaned.replace(/^UPSTASH_REDIS_REST_TOKEN\s*=\s*/i, '');
  // Strip wrapping quotes
  cleaned = cleaned.replace(/^['"]|['"]$/g, '');
  return cleaned.trim();
}

export function setCustomUpstashCredentials(url: string, token: string) {
  customUpstashUrl = sanitizeUpstashUrl(url);
  customUpstashToken = sanitizeUpstashToken(token);
  upstashClient = null; // force re-init
}

export function resetToLocalKvStorage() {
  customUpstashUrl = '';
  customUpstashToken = '';
  upstashClient = null;
}

export async function checkStorageStatus(): Promise<{
  connected: boolean;
  provider: 'upstash' | 'local_kv';
  latencyMs?: number;
  error?: string;
}> {
  const client = getUpstashClient();
  if (client) {
    try {
      const start = Date.now();
      await client.ping();
      const latencyMs = Date.now() - start;
      return { connected: true, provider: 'upstash', latencyMs };
    } catch (err: any) {
      const rawMsg = err?.message || 'Connection failed';
      let friendlyMsg = rawMsg;
      if (rawMsg.includes('WRONGPASS') || rawMsg.includes('auth token') || rawMsg.includes('unauthorized')) {
        friendlyMsg = 'Invalid REST Token (WRONGPASS). Siguraduhing kinopya ang "UPSTASH_REDIS_REST_TOKEN" mula sa REST API tab sa console.upstash.com, hindi ang Redis CLI password.';
      } else if (rawMsg.includes('ENOTFOUND') || rawMsg.includes('getaddrinfo') || rawMsg.includes('fetch failed')) {
        friendlyMsg = 'Hindi ma-reach ang Upstash URL. Paki-check kung tama ang address (dapat nagtatapos sa .upstash.io).';
      } else if (rawMsg.includes('Unable to parse') || rawMsg.includes('is not valid JSON')) {
        friendlyMsg = 'Invalid response mula sa Upstash REST endpoint. Siguraduhing walang extra path o slash sa dulo ng URL.';
      }
      return { connected: false, provider: 'upstash', error: friendlyMsg };
    }
  }

  return { connected: true, provider: 'local_kv' };
}

/**
 * ShortLink Operations
 */
export async function getLinks(): Promise<ShortLink[]> {
  const client = getUpstashClient();
  if (client) {
    try {
      const slugs = await client.smembers('links:index');
      if (slugs && slugs.length > 0) {
        const pipeline = client.pipeline();
        for (const slug of slugs) {
          pipeline.get(`link:${slug}`);
        }
        const results = await pipeline.exec();
        const links: ShortLink[] = [];
        for (const res of results) {
          if (res) {
            links.push(typeof res === 'string' ? JSON.parse(res) : (res as ShortLink));
          }
        }
        return links.sort((a, b) => b.createdAt - a.createdAt);
      }
    } catch (err) {
      console.error('Upstash read error, falling back to local cache', err);
    }
  }

  return Object.values(cachedLinks).sort((a, b) => b.createdAt - a.createdAt);
}

export async function getLink(slug: string): Promise<ShortLink | null> {
  const normalizedSlug = slug.toLowerCase();
  const client = getUpstashClient();
  if (client) {
    try {
      const data = await client.get(`link:${normalizedSlug}`);
      if (data) {
        return typeof data === 'string' ? JSON.parse(data) : (data as ShortLink);
      }
    } catch (err) {
      console.error('Upstash getLink error', err);
    }
  }

  return cachedLinks[normalizedSlug] || null;
}

export async function saveLink(link: ShortLink): Promise<ShortLink> {
  const normalizedSlug = link.slug.toLowerCase();
  const updatedLink: ShortLink = {
    ...link,
    slug: normalizedSlug,
    updatedAt: Date.now(),
  };

  cachedLinks[normalizedSlug] = updatedLink;
  persistLocalLinks();

  const client = getUpstashClient();
  if (client) {
    try {
      await client.set(`link:${normalizedSlug}`, JSON.stringify(updatedLink));
      await client.sadd('links:index', normalizedSlug);
    } catch (err) {
      console.error('Upstash saveLink error', err);
    }
  }

  return updatedLink;
}

export async function deleteLink(slug: string): Promise<boolean> {
  const normalizedSlug = slug.toLowerCase();
  if (!cachedLinks[normalizedSlug]) {
    return false;
  }

  delete cachedLinks[normalizedSlug];
  persistLocalLinks();

  const client = getUpstashClient();
  if (client) {
    try {
      await client.del(`link:${normalizedSlug}`);
      await client.srem('links:index', normalizedSlug);
    } catch (err) {
      console.error('Upstash deleteLink error', err);
    }
  }

  return true;
}

/**
 * Record a visit and increment counters
 */
export async function recordVisit(
  slug: string,
  isCrawler: boolean,
  crawlerType: string | null,
  userAgent: string,
  ip: string,
  referrer: string,
  actionTaken: VisitLog['actionTaken'],
  destination: string
): Promise<VisitLog> {
  const now = Date.now();
  const log: VisitLog = {
    id: 'log-' + Math.random().toString(36).substring(2, 9) + '-' + now,
    slug,
    timestamp: now,
    isCrawler,
    crawlerType,
    userAgent,
    ip,
    referrer,
    actionTaken,
    destination,
  };

  // Update link statistics
  const link = cachedLinks[slug.toLowerCase()];
  if (link) {
    link.totalClicks++;
    if (isCrawler) {
      link.crawlerVisits++;
      link.lastMetaInspection = now;
    } else {
      link.userClicks++;
      link.lastUserClick = now;
    }
    persistLocalLinks();
  }

  // Prepend to logs
  cachedLogs.unshift(log);
  if (cachedLogs.length > 500) {
    cachedLogs = cachedLogs.slice(0, 500);
  }
  persistLocalLogs();

  // Async push to Upstash if active
  const client = getUpstashClient();
  if (client) {
    try {
      const pipeline = client.pipeline();
      if (link) {
        pipeline.set(`link:${slug.toLowerCase()}`, JSON.stringify(link));
      }
      pipeline.lpush('visits:logs', JSON.stringify(log));
      pipeline.ltrim('visits:logs', 0, 499);
      if (isCrawler) {
        pipeline.incr(`stats:${slug.toLowerCase()}:crawlers`);
      } else {
        pipeline.incr(`stats:${slug.toLowerCase()}:users`);
      }
      await pipeline.exec();
    } catch (err) {
      console.error('Upstash recordVisit error', err);
    }
  }

  return log;
}

export async function getLogs(limit = 100): Promise<VisitLog[]> {
  const client = getUpstashClient();
  if (client) {
    try {
      const rawLogs = await client.lrange('visits:logs', 0, limit - 1);
      if (rawLogs && rawLogs.length > 0) {
        return rawLogs.map((item) => (typeof item === 'string' ? JSON.parse(item) : item));
      }
    } catch (err) {
      console.error('Upstash getLogs error', err);
    }
  }

  return cachedLogs.slice(0, limit);
}

export async function clearAllLogs(): Promise<void> {
  cachedLogs = [];
  persistLocalLogs();

  const client = getUpstashClient();
  if (client) {
    try {
      await client.del('visits:logs');
    } catch (err) {
      console.error('Upstash clearAllLogs error', err);
    }
  }
}
