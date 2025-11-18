/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Optimize for Netlify Edge Functions
  experimental: {
    reactCompiler: false,
  },
}

export default nextConfig
