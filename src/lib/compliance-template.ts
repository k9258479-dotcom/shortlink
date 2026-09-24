import { ShortLink } from '../types/index.js';

export function renderComplianceHtml(link: ShortLink, reqUrl: string): string {
  const safeTitle = escapeHtml(link.complianceTitle || 'Special Product Showcase & Review');
  const safeDesc = escapeHtml(
    link.complianceDescription ||
      'Verified product information, specifications, and buyer guide provided for informational and editorial purposes.'
  );
  const safeBrand = escapeHtml(link.brandName || 'Verified Consumer Review');
  const safeCategory = escapeHtml(link.category || 'Consumer Goods & Lifestyle');
  const safeImage = escapeHtml(
    link.ogImage ||
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=1200&h=630&fit=crop'
  );
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${safeTitle} | ${safeBrand}</title>
  <meta name="description" content="${safeDesc}">
  <meta name="robots" content="index, follow">
  <link rel="canonical" href="${escapeHtml(reqUrl)}">

  <!-- OpenGraph Metadata for Facebook & Meta Crawlers -->
  <meta property="og:type" content="article">
  <meta property="og:site_name" content="${safeBrand}">
  <meta property="og:title" content="${safeTitle}">
  <meta property="og:description" content="${safeDesc}">
  <meta property="og:image" content="${safeImage}">
  <meta property="og:image:width" content="1200">
  <meta property="og:image:height" content="630">
  <meta property="og:url" content="${escapeHtml(reqUrl)}">

  <!-- Twitter Cards -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${safeTitle}">
  <meta name="twitter:description" content="${safeDesc}">
  <meta name="twitter:image" content="${safeImage}">

  <!-- Structured Schema.org Article/Product -->
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "headline": "${safeTitle}",
    "image": ["${safeImage}"],
    "publisher": {
      "@type": "Organization",
      "name": "${safeBrand}"
    },
    "description": "${safeDesc}",
    "mainEntityOfPage": "${escapeHtml(reqUrl)}"
  }
  </script>

  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      line-height: 1.6;
      color: #1e293b;
      background-color: #f8fafc;
      padding: 0;
    }
    header {
      background: #ffffff;
      border-bottom: 1px solid #e2e8f0;
      padding: 1rem 1.5rem;
    }
    .header-container {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .logo {
      font-weight: 700;
      font-size: 1.25rem;
      color: #0f172a;
      text-decoration: none;
      letter-spacing: -0.025em;
    }
    .header-meta {
      font-size: 0.8125rem;
      color: #64748b;
    }
    main {
      max-width: 860px;
      margin: 2.5rem auto;
      padding: 0 1.5rem;
    }
    .card {
      background: #ffffff;
      border-radius: 8px;
      border: 1px solid #e2e8f0;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05);
      overflow: hidden;
    }
    .hero-image {
      width: 100%;
      height: 380px;
      object-fit: cover;
      background-color: #f1f5f9;
      display: block;
    }
    .content-body {
      padding: 2rem;
    }
    .kicker {
      font-size: 0.8125rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    h1 {
      font-size: 2rem;
      font-weight: 700;
      color: #0f172a;
      line-height: 1.25;
      margin-bottom: 1rem;
      letter-spacing: -0.02em;
    }
    .meta-bar {
      display: flex;
      gap: 1rem;
      font-size: 0.875rem;
      color: #64748b;
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid #f1f5f9;
    }
    .lead {
      font-size: 1.125rem;
      color: #334155;
      margin-bottom: 1.5rem;
      line-height: 1.7;
    }
    .article-section {
      margin-top: 1.5rem;
      color: #475569;
    }
    .article-section p {
      margin-bottom: 1rem;
    }
    .trust-box {
      margin-top: 2rem;
      padding: 1.25rem;
      background-color: #f8fafc;
      border-radius: 6px;
      border: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #475569;
    }
    .trust-box h3 {
      font-size: 0.9375rem;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }
    footer {
      background: #ffffff;
      border-top: 1px solid #e2e8f0;
      margin-top: 4rem;
      padding: 3rem 1.5rem;
      font-size: 0.8125rem;
      color: #64748b;
    }
    .footer-container {
      max-width: 960px;
      margin: 0 auto;
    }
    .footer-links {
      display: flex;
      gap: 1.5rem;
      margin-bottom: 1.5rem;
      list-style: none;
    }
    .footer-links a {
      color: #64748b;
      text-decoration: underline;
    }
    .footer-disclaimer {
      font-size: 0.75rem;
      line-height: 1.6;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <header>
    <div class="header-container">
      <a href="#" class="logo">${safeBrand}</a>
      <span class="header-meta">Verified Consumer Report &bull; Updated Daily</span>
    </div>
  </header>

  <main>
    <article class="card">
      <img src="${safeImage}" alt="${safeTitle}" class="hero-image" loading="eager" />
      <div class="content-body">
        <div class="kicker">${safeCategory}</div>
        <h1>${safeTitle}</h1>
        <div class="meta-bar">
          <span>By Editorial Research Team</span>
          <span>&bull;</span>
          <span>Independent Consumer Evaluation</span>
          <span>&bull;</span>
          <span>Compliant Publication</span>
        </div>
        <p class="lead">${safeDesc}</p>
        <div class="article-section">
          <p>This independent editorial overview aggregates genuine buyer feedback, verified merchant listings, and detailed specification checks to help consumers make informed purchasing decisions.</p>
          <p>Product availability, regional promotions, and merchant pricing are subject to verification directly at authorized partner storefronts. We adhere strictly to digital advertising standards and consumer privacy protocols.</p>
        </div>

        <div class="trust-box">
          <h3>Editorial Disclosure & Transparency</h3>
          <p>Our editorial team provides unbiased product descriptions. Content hosted here complies fully with international commercial advertising standards, consumer protection policies, and copyright directives.</p>
        </div>
      </div>
    </article>
  </main>

  <footer>
    <div class="footer-container">
      <ul class="footer-links">
        <li><a href="#privacy">Privacy Policy</a></li>
        <li><a href="#terms">Terms of Service</a></li>
        <li><a href="#dmca">DMCA Notice</a></li>
        <li><a href="#editorial">Editorial Standards</a></li>
        <li><a href="#contact">Contact Support</a></li>
      </ul>
      <p class="footer-disclaimer">
        &copy; ${currentYear} ${safeBrand}. All rights reserved. Content is published for informational and product preview purposes. Third-party trademarks and store logos remain the property of their respective owners. We do not engage in unauthorized scraping or misleading representations.
      </p>
    </div>
  </footer>
</body>
</html>`;
}

function escapeHtml(text: string): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
