import type { NextConfig } from 'next';

// Security headers. This site handles authenticated sessions and real PayPal
// payments, so these are production requirements rather than nice-to-haves.
const securityHeaders = [
  // Block the site being framed by another origin (clickjacking / UI redress).
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers guessing content types, which can turn an upload into script.
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Send the origin but not the full path to third parties.
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Force HTTPS for two years, including subdomains.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // Deny access to device APIs the product never uses.
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=()' },
  // Don't leak the site into cross-origin window handles.
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin' },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  async headers() {
    return [{ source: '/:path*', headers: securityHeaders }];
  },
};

export default nextConfig;
