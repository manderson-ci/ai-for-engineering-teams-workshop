import { NextRequest, NextResponse } from 'next/server';
import {
  MarketIntelligenceService,
  MarketIntelligenceError,
} from '@/lib/MarketIntelligenceService';

const service = new MarketIntelligenceService();

/** Only allow letters, numbers, spaces, and hyphens */
const VALID_COMPANY_RE = /^[a-zA-Z0-9 \-]+$/;

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ company: string }> },
): Promise<NextResponse> {
  const { company: rawCompany } = await params;
  const company = decodeURIComponent(rawCompany ?? '').trim();

  if (!company || !VALID_COMPANY_RE.test(company)) {
    return NextResponse.json(
      { error: 'Invalid or missing company name.' },
      { status: 400 },
    );
  }

  try {
    const data = await service.getMarketIntelligence(company);
    return NextResponse.json(data);
  } catch (err) {
    if (err instanceof MarketIntelligenceError) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json(
      { error: 'An unexpected error occurred.' },
      { status: 500 },
    );
  }
}
