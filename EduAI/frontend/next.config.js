/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NEXT_PUBLIC_API_URL
          ? `${process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "")}/api/:path*`
          : "http://127.0.0.1:8000/api/:path*",
      },
    ];
  },
  async headers() {
    return [
      {
        source: "/project-info",
        headers: [
          { key: "Cache-Control", value: "private, no-store, max-age=0, must-revalidate" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/api/project-info-access",
        headers: [{ key: "Cache-Control", value: "no-store" }],
      },
    ];
  },
};

module.exports = nextConfig;
