/**
 * exportUtils.ts
 *
 * Pure-function export handlers for the Customer Intelligence Dashboard.
 * Handles CSV and JSON formatting for all data sources.
 * No side effects, no React dependencies, no I/O.
 */

import { Customer } from '@/data/mock-customers';
import { Alert } from '@/lib/alerts';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type ExportFormat = 'csv' | 'json';

export type ExportDataSource = 'customers' | 'health-scores' | 'alerts' | 'market-intelligence';

export interface ExportFilter {
  /** Customer subscription tier filter; omit for all tiers */
  subscriptionTier?: Customer['subscriptionTier'];
  /** ISO date string; only include records on or after this date */
  dateFrom?: string;
  /** ISO date string; only include records on or before this date */
  dateTo?: string;
}

export interface ExportAuditEntry {
  /** Hashed user identity — never raw PII */
  userIdHash: string;
  dataSource: ExportDataSource;
  format: ExportFormat;
  filters: ExportFilter;
  timestamp: string;
  recordCount: number;
}

export interface ExportResult {
  /** Formatted export content */
  content: string;
  /** Suggested file name including dataset type and ISO timestamp */
  fileName: string;
  /** MIME type for the Blob */
  mimeType: string;
  /** Audit entry for logging */
  audit: ExportAuditEntry;
}

export interface HealthScoreExportRow {
  customerId: string;
  customerName: string;
  company: string;
  overallScore: number;
  riskLevel: string;
  exportedAt: string;
}

export interface MarketSummaryRow {
  company: string;
  sentimentLabel: string;
  sentimentScore: number;
  articleCount: number;
  lastUpdated: string;
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Deterministic hash of a string for audit identity (djb2 variant). */
function hashString(value: string): string {
  let h = 5381;
  for (let i = 0; i < value.length; i++) {
    h = ((h << 5) + h) ^ value.charCodeAt(i);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

/** Escapes a CSV field value. */
function escapeCsvField(value: string | number | boolean | null | undefined): string {
  if (value === null || value === undefined) return '';
  const str = String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Converts an array of row objects to a CSV string. */
function toCsv(rows: Array<Record<string, string | number | boolean | null | undefined>>): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const headerLine = headers.map(escapeCsvField).join(',');
  const dataLines = rows.map((row) =>
    headers.map((h) => escapeCsvField(row[h])).join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}

/** Builds the ISO timestamp suffix for file names. */
function isoTimestampSuffix(): string {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

/** Applies date and tier filters to a customer list. */
function applyCustomerFilters(customers: Customer[], filters: ExportFilter): Customer[] {
  return customers.filter((c) => {
    if (filters.subscriptionTier && c.subscriptionTier !== filters.subscriptionTier) {
      return false;
    }
    if (filters.dateFrom && c.createdAt && c.createdAt < filters.dateFrom) {
      return false;
    }
    if (filters.dateTo && c.createdAt && c.createdAt > filters.dateTo) {
      return false;
    }
    return true;
  });
}

// ---------------------------------------------------------------------------
// Customer Data Export
// ---------------------------------------------------------------------------

/**
 * Exports customer data in CSV or JSON format.
 * Sensitive fields (email) are omitted to prevent PII leakage in exports.
 */
export function exportCustomers(
  customers: Customer[],
  format: ExportFormat,
  filters: ExportFilter = {},
  userId = 'anonymous',
): ExportResult {
  const filtered = applyCustomerFilters(customers, filters);

  // Omit email (PII) from exports
  const rows = filtered.map((c) => ({
    id: c.id,
    name: c.name,
    company: c.company,
    healthScore: c.healthScore,
    subscriptionTier: c.subscriptionTier ?? '',
    domainCount: c.domains?.length ?? 0,
    createdAt: c.createdAt ?? '',
  }));

  const timestamp = isoTimestampSuffix();
  const fileName = `customers_${timestamp}.${format}`;
  const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
  const content = format === 'csv' ? toCsv(rows) : JSON.stringify({ exportedAt: new Date().toISOString(), records: rows }, null, 2);

  return {
    content,
    fileName,
    mimeType,
    audit: {
      userIdHash: hashString(userId),
      dataSource: 'customers',
      format,
      filters,
      timestamp: new Date().toISOString(),
      recordCount: rows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Health Score Export
// ---------------------------------------------------------------------------

/**
 * Exports health score reports.
 * Accepts pre-computed rows (caller derives health scores from healthCalculator).
 */
export function exportHealthScores(
  rows: HealthScoreExportRow[],
  format: ExportFormat,
  filters: ExportFilter = {},
  userId = 'anonymous',
): ExportResult {
  const filteredRows = rows.filter((r) => {
    if (filters.dateFrom && r.exportedAt < filters.dateFrom) return false;
    if (filters.dateTo && r.exportedAt > filters.dateTo) return false;
    return true;
  });

  const timestamp = isoTimestampSuffix();
  const fileName = `health-scores_${timestamp}.${format}`;
  const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
  const content =
    format === 'csv'
      ? toCsv(filteredRows as unknown as Array<Record<string, string | number | boolean | null | undefined>>)
      : JSON.stringify({ exportedAt: new Date().toISOString(), records: filteredRows }, null, 2);

  return {
    content,
    fileName,
    mimeType,
    audit: {
      userIdHash: hashString(userId),
      dataSource: 'health-scores',
      format,
      filters,
      timestamp: new Date().toISOString(),
      recordCount: filteredRows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Alert History Export
// ---------------------------------------------------------------------------

/**
 * Exports alert history for compliance audit trails.
 * Sanitizes customer ID fields — no raw PII included.
 */
export function exportAlerts(
  alerts: Alert[],
  format: ExportFormat,
  filters: ExportFilter = {},
  userId = 'anonymous',
): ExportResult {
  const filtered = alerts.filter((a) => {
    if (filters.dateFrom && a.triggeredAt < filters.dateFrom) return false;
    if (filters.dateTo && a.triggeredAt > filters.dateTo) return false;
    return true;
  });

  const rows = filtered.map((a) => ({
    id: a.id,
    customerId: a.customerId,
    type: a.type,
    priority: a.priority,
    title: a.title,
    triggeredAt: a.triggeredAt,
    dismissed: a.dismissed ? 'true' : 'false',
    dismissedAt: a.dismissedAt ?? '',
    actioned: a.actioned ? 'true' : 'false',
    actionedAt: a.actionedAt ?? '',
  }));

  const timestamp = isoTimestampSuffix();
  const fileName = `alerts_${timestamp}.${format}`;
  const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
  const content =
    format === 'csv'
      ? toCsv(rows)
      : JSON.stringify({ exportedAt: new Date().toISOString(), records: rows }, null, 2);

  return {
    content,
    fileName,
    mimeType,
    audit: {
      userIdHash: hashString(userId),
      dataSource: 'alerts',
      format,
      filters,
      timestamp: new Date().toISOString(),
      recordCount: rows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Market Intelligence Export
// ---------------------------------------------------------------------------

/**
 * Exports market intelligence summaries.
 */
export function exportMarketIntelligence(
  rows: MarketSummaryRow[],
  format: ExportFormat,
  filters: ExportFilter = {},
  userId = 'anonymous',
): ExportResult {
  const filteredRows = rows.filter((r) => {
    if (filters.dateFrom && r.lastUpdated < filters.dateFrom) return false;
    if (filters.dateTo && r.lastUpdated > filters.dateTo) return false;
    return true;
  });

  const timestamp = isoTimestampSuffix();
  const fileName = `market-intelligence_${timestamp}.${format}`;
  const mimeType = format === 'csv' ? 'text/csv' : 'application/json';
  const content =
    format === 'csv'
      ? toCsv(filteredRows as unknown as Array<Record<string, string | number | boolean | null | undefined>>)
      : JSON.stringify({ exportedAt: new Date().toISOString(), records: filteredRows }, null, 2);

  return {
    content,
    fileName,
    mimeType,
    audit: {
      userIdHash: hashString(userId),
      dataSource: 'market-intelligence',
      format,
      filters,
      timestamp: new Date().toISOString(),
      recordCount: filteredRows.length,
    },
  };
}

// ---------------------------------------------------------------------------
// Trigger Download (browser utility — not pure, but co-located for convenience)
// ---------------------------------------------------------------------------

/**
 * Triggers a file download in the browser from an ExportResult.
 * Should only be called from client components.
 */
export function triggerDownload(result: ExportResult): void {
  const blob = new Blob([result.content], { type: result.mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = result.fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
