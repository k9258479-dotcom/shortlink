import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import { detectMetaCrawler } from './src/lib/crawler-detection.js';
import { renderComplianceHtml } from './src/lib/compliance-template.js';
import {
  getLinks,
  getLink,
  saveLink,
  deleteLink,
  recordVisit,
  getLogs,
  clearAllLogs,
  checkStorageStatus,
  setCustomUpstashCredentials,
} from './src/lib/kv-store.js';
import { NEXTJS_EXPORT_FILES } from './src/lib/nextjs-export.js';
import JSZip from 'jszip';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;
  const isProduction = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Helper to extract client IP
  const getClientIp = (req: Request): string => {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string') {
      return forwarded.split(',')[0].trim();
    }
    return req.socket.remoteAddress || '127.0.0.1';
  };

  /**
   * ==========================================
   * 1. CORE EDGE ROUTE: /l/:slug
   * Intercepts short links, detects Meta crawler,
   * logs visit to KV/Redis, and branches behavior
   * ==========================================
   */
  app.get('/l/:slug', async (req: Request, res: Response) => {
    const slug = req.params.slug.trim().toLowerCase();
    const userAgent = req.headers['user-agent'] || '';
    const ip = getClientIp(req);
    const referrer = (req.headers['referer'] as string) || '';

    // Lookup link
    const link = await getLink(slug);

    if (!link || !link.isActive) {
      await recordVisit(
        slug,
        false,
        null,
        userAgent,
        ip,
        referrer,
        'not_found',
        'Link not found or deactivated'
      );
      return res.status(404).send(`
        <!DOCTYPE html>
        <html>
        <head><title>Link Not Found</title><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
        <body style="font-family: sans-serif; background: #0f172a; color: #f8fafc; text-align: center; padding: 4rem 1rem;">
          <h1 style="font-size: 2rem; margin-bottom: 1rem;">Link Not Found</h1>
          <p style="color: #94a3b8; margin-bottom: 2rem;">The short link <code>/l/${slug}</code> does not exist or has been paused.</p>
          <a href="/admin" style="display: inline-block; background: #4f46e5; color: white; padding: 0.75rem 1.5rem; text-decoration: none; border-radius: 6px; font-weight: 500;">Go to Dashboard</a>
        </body>
        </html>
      `);
    }

    // Inspect User-Agent for Meta Crawlers
    const detection = detectMetaCrawler(userAgent);
    const fullReqUrl = `${req.protocol}://${req.get('host')}${req.originalUrl}`;

    if (detection.isMetaCrawler) {
      // BRANCH A: META / FACEBOOK CRAWLER DETECTED
      console.log(`[META CRAWLER DETECTED] Slug: ${slug} | Bot: ${detection.botName} | IP: ${ip}`);

      // Async record crawler inspection
      await recordVisit(
        slug,
        true,
        detection.botName || 'Meta Crawler',
        userAgent,
        ip,
        referrer,
        'compliance_html',
        'Safe HTML Compliance Page'
      );

      // Return 200 OK with safe, compliant HTML page including OpenGraph tags
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      res.setHeader('X-Robots-Tag', 'index, follow');
      res.setHeader('X-Cloak-Branch', 'meta-crawler-compliance');
      return res.status(200).send(renderComplianceHtml(link, fullReqUrl));
    }

    // BRANCH B: REAL USER DETECTED
    console.log(`[REAL USER VISIT] Slug: ${slug} -> Redirecting to: ${link.destinationUrl} | IP: ${ip}`);

    // Async record real user click
    await recordVisit(
      slug,
      false,
      null,
      userAgent,
      ip,
      referrer,
      'redirect_307',
      link.destinationUrl
    );

    // Instant HTTP 307 Temporary Redirect to active destination (e.g. Lazada)
    res.setHeader('X-Cloak-Branch', 'real-user-redirect');
    return res.redirect(307, link.destinationUrl);
  });

  /**
   * Preview safe compliance page directly
   */
  app.get('/compliance/:slug', async (req: Request, res: Response) => {
    const slug = req.params.slug.trim().toLowerCase();
    const link = await getLink(slug);
    if (!link) {
      return res.status(404).send('Link not found');
    }
    const fullReqUrl = `${req.protocol}://${req.get('host')}/l/${slug}`;
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    return res.status(200).send(renderComplianceHtml(link, fullReqUrl));
  });

  /**
   * ==========================================
   * 2. REST API ENDPOINTS
   * ==========================================
   */

  // GET /api/links - list all links
  app.get('/api/links', async (_req: Request, res: Response) => {
    try {
      const links = await getLinks();
      res.json(links);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/links - create link
  app.post('/api/links', async (req: Request, res: Response) => {
    try {
      const {
        slug,
        destinationUrl,
        complianceTitle,
        complianceDescription,
        ogImage,
        brandName,
        category,
        isActive,
      } = req.body;

      if (!slug || !destinationUrl) {
        return res.status(400).json({ error: 'Slug and destinationUrl are required' });
      }

      const existing = await getLink(slug);
      const now = Date.now();

      const newLink = {
        slug: slug.trim().toLowerCase(),
        destinationUrl: destinationUrl.trim(),
        complianceTitle: complianceTitle?.trim() || 'Verified Consumer Showcase',
        complianceDescription: complianceDescription?.trim() || 'Product specifications and editorial assessment.',
        ogImage: ogImage?.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop',
        brandName: brandName?.trim() || 'Consumer Review Hub',
        category: category?.trim() || 'Lifestyle & Technology',
        createdAt: existing?.createdAt || now,
        updatedAt: now,
        totalClicks: existing?.totalClicks || 0,
        userClicks: existing?.userClicks || 0,
        crawlerVisits: existing?.crawlerVisits || 0,
        lastMetaInspection: existing?.lastMetaInspection || null,
        lastUserClick: existing?.lastUserClick || null,
        isActive: isActive !== undefined ? isActive : true,
      };

      const saved = await saveLink(newLink);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // PUT /api/links/:slug - update link
  app.put('/api/links/:slug', async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug.trim().toLowerCase();
      const existing = await getLink(slug);
      if (!existing) {
        return res.status(404).json({ error: 'Link not found' });
      }

      const updated = {
        ...existing,
        ...req.body,
        slug, // cannot change slug via PUT
        updatedAt: Date.now(),
      };

      const saved = await saveLink(updated);
      res.json(saved);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/links/:slug
  app.delete('/api/links/:slug', async (req: Request, res: Response) => {
    try {
      const slug = req.params.slug.trim().toLowerCase();
      const success = await deleteLink(slug);
      res.json({ success });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/logs
  app.get('/api/logs', async (req: Request, res: Response) => {
    try {
      const limit = Number(req.query.limit) || 100;
      const logs = await getLogs(limit);
      res.json(logs);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // DELETE /api/logs - clear logs
  app.delete('/api/logs', async (_req: Request, res: Response) => {
    try {
      await clearAllLogs();
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/test-crawler - live simulator endpoint
  app.post('/api/test-crawler', async (req: Request, res: Response) => {
    try {
      const { userAgent = '', slug = 'offer1', ip = '157.240.241.35' } = req.body;
      const detection = detectMetaCrawler(userAgent);
      const link = await getLink(slug);

      const isMeta = detection.isMetaCrawler;
      const willRedirect = !isMeta && !!link;
      const statusCode = isMeta ? 200 : willRedirect ? 307 : 404;
      const action = isMeta
        ? 'Serve Safe Compliance HTML (200 OK)'
        : willRedirect
        ? `HTTP 307 Redirect to: ${link.destinationUrl}`
        : 'HTTP 404 Not Found';

      const simulatedHeaders: Record<string, string> = {
        'content-type': isMeta ? 'text/html; charset=utf-8' : 'text/plain',
        'x-cloak-branch': isMeta ? 'meta-crawler-compliance' : 'real-user-redirect',
      };

      if (willRedirect) {
        simulatedHeaders['location'] = link.destinationUrl;
      }

      res.json({
        detection,
        isMetaCrawler: isMeta,
        slug,
        linkExists: !!link,
        destinationUrl: link?.destinationUrl,
        statusCode,
        action,
        simulatedHeaders,
        compliancePreviewUrl: `/compliance/${slug}`,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/status - system health & storage status
  app.get('/api/status', async (req: Request, res: Response) => {
    try {
      const storage = await checkStorageStatus();
      const links = await getLinks();
      const logs = await getLogs(500);

      const totalClicks = links.reduce((sum, l) => sum + (l.totalClicks || 0), 0);
      const totalUserClicks = links.reduce((sum, l) => sum + (l.userClicks || 0), 0);
      const totalCrawlerVisits = links.reduce((sum, l) => sum + (l.crawlerVisits || 0), 0);

      const host = req.get('host') || 'localhost:3000';
      const protocol = req.protocol || 'http';
      const baseUrl = `${protocol}://${host}`;

      res.json({
        storage,
        stats: {
          totalLinks: links.length,
          totalClicks,
          totalUserClicks,
          totalCrawlerVisits,
          inspectionRatio: totalClicks > 0 ? ((totalCrawlerVisits / totalClicks) * 100).toFixed(1) + '%' : '0%',
        },
        baseUrl,
        adminTokenConfigured: !!(process.env.ADMIN_TOKEN || 'admin123'),
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // POST /api/config/upstash - connect runtime Upstash credentials
  app.post('/api/config/upstash', async (req: Request, res: Response) => {
    try {
      const { url, token } = req.body;
      if (!url || !token) {
        return res.status(400).json({ error: 'URL and Token are required' });
      }
      setCustomUpstashCredentials(url, token);
      const status = await checkStorageStatus();
      res.json(status);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // GET /api/export-zip - download full Next.js App Router project as ZIP
  app.get('/api/export-zip', async (_req: Request, res: Response) => {
    try {
      const zip = new JSZip();
      for (const file of NEXTJS_EXPORT_FILES) {
        zip.file(file.path, file.content);
      }
      const buffer = await zip.generateAsync({ type: 'nodebuffer' });
      res.setHeader('Content-Type', 'application/zip');
      res.setHeader('Content-Disposition', 'attachment; filename="meta-link-cloaker-nextjs.zip"');
      return res.send(buffer);
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  /**
   * ==========================================
   * 3. FRONTEND SERVING
   * ==========================================
   */
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CloakFlow server running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
