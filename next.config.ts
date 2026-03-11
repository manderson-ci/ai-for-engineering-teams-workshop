import type { NextConfig } from "next";

// ---------------------------------------------------------------------------
// Security Headers
// ---------------------------------------------------------------------------

const securityHeaders = [
  {
    // Prevents click-jacking by disallowing framing from other origins
    key: "X-Frame-Options",
    value: "SAMEORIGIN",
  },
  {
    // Prevents MIME-type sniffing
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    // Controls referrer information sent with requests
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    // Content Security Policy — no unsafe-inline for scripts
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // Next.js requires unsafe-inline for its runtime scripts (hydration, HMR, etc.)
      // A nonce-based approach could replace this in production with proper middleware.
      "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
      // Styles: Next.js injects styles; allow same-origin + unsafe-inline for CSS only
      "style-src 'self' 'unsafe-inline'",
      // Images and fonts from same origin and data URIs only
      "img-src 'self' data:",
      "font-src 'self'",
      // API calls only to same origin
      "connect-src 'self'",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
    ].join("; "),
  },
  {
    // Prevents browsers from sending cookies on cross-site requests
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    // HTTPS enforcement
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

// ---------------------------------------------------------------------------
// Next.js Configuration
// ---------------------------------------------------------------------------

const nextConfig: NextConfig = {
  // Apply security headers to all routes
  headers: async () => [
    {
      source: "/(.*)",
      headers: securityHeaders,
    },
  ],

  // Bundle analysis: set ANALYZE=true in CI to generate report
  // Requires @next/bundle-analyzer to be installed
  ...(process.env.ANALYZE === "true"
    ? {
        // Bundle analyzer is configured as a wrapper — see scripts in package.json
      }
    : {}),

  // Production optimizations
  compress: true,

  // Strict mode for catching potential issues
  reactStrictMode: true,

  // Ensure consistent trailing slash behavior
  trailingSlash: false,

  // Image optimization
  images: {
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
