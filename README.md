# AURA LOOP - 手串定制平台

AURA LOOP（又名"Yang Ge Shi Tou"）是一个定制珠串手链设计平台，允许用户从珠子库中选择并可视化设计个性化手链。

## 功能特性

- 🎨 直观的可视化设计界面
- 📏 自动手链周长计算和布局
- 🎯 丰富的珠子库管理
- 📱 响应式移动端支持
- 👤 用户认证和权限管理
- 🔧 管理员后台功能

## 技术栈

- **前端框架**: Next.js 14+ (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI组件**: lucide-react
- **状态管理**: Zustand
- **动画**: Framer Motion, Pixi.js
- **认证**: NextAuth.js
- **数据库**: Prisma ORM
- **文件存储**: Vercel Blob

## 环境变量配置

创建 `.env.local` 文件并配置以下变量：

```bash
# 管理员邮箱配置
ADMIN_EMAIL="your-admin@email.com"
NEXT_PUBLIC_ADMIN_EMAIL="your-admin@email.com"

# NextAuth 配置
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET="your-secret-key"

# 数据库连接
DATABASE_URL="your-database-url"

# 邮件服务配置（可选）
RESEND_API_KEY="your-resend-api-key"
MAIL_FROM="noreply@yourdomain.com"

# Google OAuth 配置（可选）
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Vercel Blob 存储配置（可选）
BLOB_READ_WRITE_TOKEN="your-blob-token"

# 自动登录默认账号配置（可选）
ENABLE_AUTO_LOGIN=false
DEFAULT_LOGIN_EMAIL="demo@example.com"
DEFAULT_LOGIN_PASSWORD="demo123"
```

### 自动登录功能说明

系统支持配置自动登录默认账号功能，适用于开发环境或演示场景：

1. 设置 `ENABLE_AUTO_LOGIN=true` 启用自动登录
2. 配置 `DEFAULT_LOGIN_EMAIL` 和 `DEFAULT_LOGIN_PASSWORD` 指定默认账号凭据
3. 系统会在应用初始化时自动使用配置的账号登录

⚠️ **注意**: 生产环境中建议关闭此功能以确保安全性。

## 开发环境搭建

### 前置条件

- Node.js >= 18
- npm 或 yarn
- 数据库（PostgreSQL/MySQL等）

### 安装步骤

```bash
# 1. 克隆项目
git clone <repository-url>
cd diamond2

# 2. 安装依赖
npm install

# 3. 配置环境变量
cp .env.example .env.local
# 编辑 .env.local 文件，填入实际配置

# 4. 初始化数据库
npx prisma migrate dev --name init
npx prisma generate

# 5. 启动开发服务器
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000) 查看应用。

## 项目结构

```
├── app/                 # Next.js App Router 页面和API路由
├── components/          # React 组件
├── lib/                # 工具函数和配置
├── prisma/             # 数据库模型和迁移
├── public/             # 静态资源
└── scripts/            # 初始化脚本
```

## 部署

### Vercel 部署

1. 连接 GitHub 仓库到 Vercel
2. 在 Vercel 项目设置中配置环境变量
3. 部署会自动触发

### 手动部署

```bash
# 构建项目
npm run build

# 启动生产服务器
npm start
```

## 开发指南

### 代码规范

- 使用 TypeScript 严格模式
- 遵循 ESLint 配置
- 组件使用函数式写法
- 状态管理使用 Zustand

### 数据库操作

```bash
# 生成 Prisma 客户端
npx prisma generate

# 创建迁移
npx prisma migrate dev --name migration-name

# 查看数据库
npx prisma studio
```

## 贡献指南

1. Fork 项目
2. 创建功能分支
3. 提交更改
4. 发起 Pull Request

## 许可证

MIT License

## 联系方式

如有问题，请联系项目维护者。
