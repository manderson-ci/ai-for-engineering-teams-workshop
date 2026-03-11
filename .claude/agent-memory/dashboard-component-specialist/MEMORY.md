# Agent Memory Index

## Project

- [CustomerCard component baseline](project_customer_card.md) — Health score color logic, card dimensions, clickable card pattern, domain display, React.memo usage, dark mode, import alias convention
- [MarketIntelligenceWidget feature](project_market_intelligence.md) — API route, service class, UI component paths and patterns; sentiment color logic, cache implementation, Next.js 15 async params
- [Health Score Calculator feature](project_health_score_calculator.md) — lib/healthCalculator.ts pure functions, CustomerHealthDisplay.tsx widget, error class, memoization, accessible breakdown toggle
- [Alerts Panel feature](project_alerts_panel.md) — lib/alerts.ts pure alert engine + AlertsPanel.tsx widget; six alert types, cooldown deduplication, dismiss/action audit trail, history toggle, AlertDetailDrawer bug fix
- [PredictiveIntelligence feature](project_predictive_intelligence.md) — PredictiveIntelligenceWidget.tsx + AlertDetailDrawer.tsx; combined alerts + market sentiment panel, independent loading/error states, aria-live region, inline detail drawer
- [DashboardOrchestrator feature](project_dashboard_orchestrator.md) — DashboardErrorBoundary + WidgetErrorBoundary class components, exportUtils.ts pure fns, /api/health route, next.config.ts security headers, page.tsx lazy-loaded composition
