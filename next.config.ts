import type { NextConfig } from "next"

/**
 * Alle Daten bleiben im Browser. Es gibt bewusst keine API-Routes,
 * keine Server Actions und keine Telemetrie in dieser App.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  headers: async () => [
    {
      source: "/:path*",
      headers: [
        { key: "X-Content-Type-Options", value: "nosniff" },
        { key: "Referrer-Policy", value: "no-referrer" },
        { key: "X-Frame-Options", value: "DENY" },
        {
          key: "Content-Security-Policy",
          value: [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline'",
            "style-src 'self' 'unsafe-inline'",
            "img-src 'self' data: blob:",
            "font-src 'self'",
            // Keine Netzwerkverbindungen nach aussen: Mitgliederdaten
            // koennen die App gar nicht verlassen.
            "connect-src 'self'",
            "form-action 'none'",
            "frame-ancestors 'none'",
            "base-uri 'self'",
          ].join("; "),
        },
      ],
    },
  ],
}

export default nextConfig
