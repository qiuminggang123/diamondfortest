// prisma/prisma.config.ts
import { defineConfig } from '@prisma/internals';
// 本地开发环境连接字符串（请根据实际本地Postgres配置修改）
export default defineConfig({
  datasource: {
    provider: 'postgresql',
    url: 'postgresql://postgres:postgres@localhost:5432/postgres',
  },
});
