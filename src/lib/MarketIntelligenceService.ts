import {
  generateMockMarketData,
  calculateMockSentiment,
  MockHeadline,
} from '@/data/mock-market-intelligence';

export interface MarketIntelligenceResponse {
  company: string;
  sentiment: {
    score: number;
    label: 'positive' | 'neutral' | 'negative';
    confidence: number;
  };
  articleCount: number;
  headlines: Array<{
    title: string;
    source: string;
    publishedAt: string;
  }>;
  lastUpdated: string;
}

interface CacheEntry {
  data: MarketIntelligenceResponse;
  fetchedAt: number;
}

export class MarketIntelligenceError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'MarketIntelligenceError';
  }
}

/** Normalize a company name to a consistent cache key */
export function getCacheKey(company: string): string {
  return company.trim().toLowerCase();
}

/** Return true if the cache entry is still within the 10-minute TTL */
export function isCacheValid(entry: CacheEntry): boolean {
  const TEN_MINUTES_MS = 10 * 60 * 1000;
  return Date.now() - entry.fetchedAt < TEN_MINUTES_MS;
}

export class MarketIntelligenceService {
  private cache = new Map<string, CacheEntry>();

  async getMarketIntelligence(
    company: string,
  ): Promise<MarketIntelligenceResponse> {
    const key = getCacheKey(company);

    if (!key) {
      throw new MarketIntelligenceError(
        'Company name must not be empty.',
        'INVALID_COMPANY',
      );
    }

    const cached = this.cache.get(key);
    if (cached && isCacheValid(cached)) {
      return cached.data;
    }

    // Simulate realistic API latency (300–600 ms)
    const delay = 300 + Math.floor(Math.random() * 301);
    await new Promise((resolve) => setTimeout(resolve, delay));

    let marketData;
    let sentiment;
    try {
      marketData = generateMockMarketData(company);
      sentiment = calculateMockSentiment(marketData.headlines);
    } catch (err) {
      throw new MarketIntelligenceError(
        'Failed to generate market data.',
        'DATA_GENERATION_FAILED',
      );
    }

    const headlines: Array<{ title: string; source: string; publishedAt: string }> =
      marketData.headlines.slice(0, 3).map((h: MockHeadline) => ({
        title: h.title,
        source: h.source,
        publishedAt: h.publishedAt,
      }));

    const response: MarketIntelligenceResponse = {
      company,
      sentiment,
      articleCount: marketData.articleCount,
      headlines,
      lastUpdated: new Date().toISOString(),
    };

    this.cache.set(key, { data: response, fetchedAt: Date.now() });

    return response;
  }
}
