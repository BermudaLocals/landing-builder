/** @type {import('next').NextConfig} */

// Baseline production security headers. The app CSP is intentionally
// permissive enough for Clerk (https: script/connect/frame sources) and the
// builder's inline styles; tighten once a nonce-based policy is practical.
const baseHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
];

const appCSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https:",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'self' https:",
  "frame-src 'self' https:",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');

// Published pages are static snapshots that pull Tailwind from the jsDelivr
// CDN, so their style-src must allow that origin.
const publicPageCSP = [
  "default-src 'self'",
  "script-src 'none'",
  "style-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net",
  "img-src 'self' data: https:",
  "font-src 'self' data:",
  "connect-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'none'",
].join('; ');

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
    ],
  },
  async headers() {
    return [
      // Order matters: when several sources match, the later definition wins
      // for a duplicated header key — so the relaxed public-page CSP must be
      // listed after the catch-all app CSP.
      {
        source: '/:path*',
        headers: [...baseHeaders, { key: 'Content-Security-Policy', value: appCSP }],
      },
      {
        source: '/p/:path*',
        headers: [...baseHeaders, { key: 'Content-Security-Policy', value: publicPageCSP }],
      },
    ];
  },
};
module.exports = nextConfig;
