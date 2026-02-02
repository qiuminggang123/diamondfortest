/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '**.public.blob.vercel-storage.com', // 支持动态子域名
      },
    ],
    dangerouslyAllowSVG: true,  // 允许加载 SVG 图片
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // 限制 SVG 的执行能力
  },
};

export default nextConfig;