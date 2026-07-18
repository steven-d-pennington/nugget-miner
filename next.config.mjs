import { dirname } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const root = dirname(fileURLToPath(import.meta.url));
const releaseId = process.env.VERCEL_DEPLOYMENT_ID
  ?? process.env.VERCEL_GIT_COMMIT_SHA
  ?? process.env.NEXT_PUBLIC_NUGGET_RELEASE
  ?? `local-${Date.now().toString(36)}`;

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_NUGGET_RELEASE: releaseId,
  },
  allowedDevOrigins: ['127.0.0.1', 'localhost', '10.0.0.181'],
  turbopack: {
    root,
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'microphone=(self), camera=(), geolocation=()' },
          { key: 'Content-Security-Policy', value: "frame-ancestors 'none'; base-uri 'self'; form-action 'self'" },
        ],
      },
    ];
  },
};

export default nextConfig;
