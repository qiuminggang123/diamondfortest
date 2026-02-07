/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  env: {
    // 将 BLOB_READ_WRITE_TOKEN 暴露给客户端
    BLOB_READ_WRITE_TOKEN: process.env.BLOB_READ_WRITE_TOKEN,
    // 将自动登录相关环境变量暴露给客户端
    NEXT_PUBLIC_ENABLE_AUTO_LOGIN: process.env.ENABLE_AUTO_LOGIN,
    NEXT_PUBLIC_DEFAULT_LOGIN_EMAIL: process.env.DEFAULT_LOGIN_EMAIL,
    NEXT_PUBLIC_DEFAULT_LOGIN_PASSWORD: process.env.DEFAULT_LOGIN_PASSWORD,
  },
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
      {
        protocol: 'https',
        hostname: 'images.unsplash.com', // 支持Unsplash图片
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos', // 支持Lorem Picsum
      },
      {
        protocol: 'https',
        hostname: '**.githubusercontent.com', // 支持GitHub图片
      },
      {
        protocol: 'https',
        hostname: 'cdn.jsdelivr.net', // 支持jsDelivr CDN
      },
      {
        protocol: 'https',
        hostname: '**.cloudinary.com', // 支持Cloudinary
      },
    ],
    dangerouslyAllowSVG: true,  // 允许加载 SVG 图片
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;", // 限制 SVG 的执行能力
  },
};

export default nextConfig;