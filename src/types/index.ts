export interface ShortLink {
  slug: string;
  destinationUrl: string;
  complianceTitle: string;
  complianceDescription: string;
  ogImage: string;
  brandName: string;
  category: string;
  createdAt: number;
  updatedAt: number;
  totalClicks: number;
  userClicks: number;
  crawlerVisits: number;
  lastMetaInspection: number | null;
  lastUserClick: number | null;
  isActive: boolean;
}

export interface VisitLog {
  id: string;
  slug: string;
  timestamp: number;
  isCrawler: boolean;
  crawlerType: string | null;
  userAgent: string;
  ip: string;
  referrer: string;
  actionTaken: 'redirect_307' | 'compliance_html' | 'not_found' | 'inactive';
  destination: string;
}

export interface SystemConfig {
  adminToken: string;
  upstashUrl?: string;
  upstashToken?: string;
  metaPatterns: string[];
}

export interface CrawlerDetectionResult {
  isMetaCrawler: boolean;
  matchedPattern?: string;
  botName?: string;
  isOtherBot?: boolean;
}
