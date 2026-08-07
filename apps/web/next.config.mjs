import { withSentryConfig } from "@sentry/nextjs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const srcDir = path.join(__dirname, "src");

/** @type {import('next').NextConfig} */
const nextConfig = {
  outputFileTracingRoot: path.join(__dirname, "../.."),
  transpilePackages: [
    "@argumentor/agents",
    "@argumentor/db",
    "@argumentor/debate-core",
    "@argumentor/ui",
  ],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  // TS 7 removed baseUrl; keep @/* working under Turbopack (Next 16 default).
  turbopack: {
    resolveAlias: {
      "@": srcDir,
    },
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": srcDir,
    };
    return config;
  },
};

const sentryEnabled = Boolean(process.env.SENTRY_DSN || process.env.NEXT_PUBLIC_SENTRY_DSN);

export default sentryEnabled
  ? withSentryConfig(nextConfig, {
      silent: true,
      widenClientFileUpload: true,
    })
  : nextConfig;
