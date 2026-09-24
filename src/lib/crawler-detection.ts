import { CrawlerDetectionResult } from '../types/index.js';

export const DEFAULT_META_PATTERNS = [
  'facebookexternalhit',
  'facebot',
  'metainspector',
  'facebookcatalog',
  'facebookplatform',
  'meta-externalagent',
  'meta-externalfetcher',
];

export const OTHER_BOT_PATTERNS = [
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'pinterestbot',
  'whatsapp',
  'telegrambot',
  'googlebot',
  'bingbot',
];

/**
 * Evaluates a User-Agent string to determine if it belongs to Meta/Facebook crawler.
 */
export function detectMetaCrawler(
  userAgent: string = '',
  customPatterns: string[] = []
): CrawlerDetectionResult {
  const ua = (userAgent || '').toLowerCase();
  
  const allMetaPatterns = [...DEFAULT_META_PATTERNS, ...customPatterns.map((p) => p.toLowerCase())];

  for (const pattern of allMetaPatterns) {
    if (ua.includes(pattern)) {
      let botName = 'Meta Crawler';
      if (ua.includes('facebookexternalhit')) {
        botName = 'facebookexternalhit (Meta OpenGraph Scraper)';
      } else if (ua.includes('facebot')) {
        botName = 'Facebot (Meta Page Indexer)';
      } else if (ua.includes('metainspector')) {
        botName = 'MetaInspector (Ad Compliance Checker)';
      } else if (ua.includes('facebookcatalog')) {
        botName = 'FacebookCatalog (Commerce Feed Crawler)';
      } else if (ua.includes('meta-externalagent')) {
        botName = 'Meta-ExternalAgent (AI & Ad Review)';
      }

      return {
        isMetaCrawler: true,
        matchedPattern: pattern,
        botName,
        isOtherBot: false,
      };
    }
  }

  // Check if it's another bot (not Meta)
  for (const bot of OTHER_BOT_PATTERNS) {
    if (ua.includes(bot)) {
      return {
        isMetaCrawler: false,
        isOtherBot: true,
        matchedPattern: bot,
        botName: bot.charAt(0).toUpperCase() + bot.slice(1),
      };
    }
  }

  return {
    isMetaCrawler: false,
    isOtherBot: false,
  };
}
