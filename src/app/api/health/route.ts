import { NextResponse } from 'next/server';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface DependencyStatus {
  status: 'ok' | 'degraded' | 'unavailable';
  latencyMs?: number;
  message?: string;
}

interface HealthResponse {
  status: 'healthy' | 'degraded';
  version: string;
  timestamp: string;
  dependencies: {
    marketIntelligence: DependencyStatus;
  };
}

// ---------------------------------------------------------------------------
// Health Check Route
// ---------------------------------------------------------------------------

/**
 * GET /api/health
 *
 * Returns 200 with full dependency status when all systems are healthy.
 * Returns 503 with degraded status when any dependency is unavailable.
 *
 * Used by load balancers and uptime monitoring.
 * Response never includes PII or sensitive configuration.
 */
export async function GET(): Promise<NextResponse> {
  const timestamp = new Date().toISOString();
  const version = process.env.npm_package_version ?? '0.0.0';

  // Check market intelligence dependency by exercising its endpoint.
  // We use a short timeout to avoid blocking the health check.
  let marketStatus: DependencyStatus;
  const marketStart = Date.now();

  try {
    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL ??
      (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 2000);

    try {
      const res = await fetch(`${baseUrl}/api/market-intelligence/healthcheck`, {
        signal: controller.signal,
        method: 'GET',
        headers: { 'x-health-check': '1' },
      });
      clearTimeout(timeout);

      marketStatus = {
        status: res.ok || res.status === 400 ? 'ok' : 'degraded',
        latencyMs: Date.now() - marketStart,
      };
    } catch {
      clearTimeout(timeout);
      // A 400 (invalid company name) from the market route is acceptable —
      // it means the route is alive. AbortError or network failure = degraded.
      marketStatus = {
        status: 'degraded',
        latencyMs: Date.now() - marketStart,
        message: 'Market intelligence endpoint unreachable',
      };
    }
  } catch {
    marketStatus = {
      status: 'unavailable',
      message: 'Dependency check failed',
    };
  }

  const allHealthy = marketStatus.status === 'ok';

  const body: HealthResponse = {
    status: allHealthy ? 'healthy' : 'degraded',
    version,
    timestamp,
    dependencies: {
      marketIntelligence: marketStatus,
    },
  };

  return NextResponse.json(body, { status: allHealthy ? 200 : 503 });
}
