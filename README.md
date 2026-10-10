<div align="center">

# 🍳 我的菜谱

**老婆的专属菜谱本** — 在线记录每道菜的标准做法、我的做法、食材和成果图。

移动端优先 · 暗色模式 · PWA · Vercel 一键部署

</div>

---

## ✨ 功能一览

| 页面 | 路径 | 说明 |
|:---:|:---:|---|
| 🍳 **菜谱** | `/` | 浏览所有菜品，搜索菜名/食材/做法，按分类筛选，图片点开看大图 |
| 🧺 **食材** | `/ingredients` | 按分类展示所有食材，标签式排列 |
| ✏️ **管理** | `/admin` | 密码登录后在线新增 / 编辑 / 删除菜品和食材 |

**菜谱管理支持：**

- 📝 Markdown 格式的「标准做法」和「我的做法」
- 🖼️ 多图上传（存 Vercel Blob，单张 ≤ 8 MB）
- 🥗 食材选择 + 用量填写
- 🏷️ 分类标签 + 最近练习时间
- 🔐 密码登录，HMAC 签名 Cookie，30 天免重新登录

## 🛠 技术栈

| 分类 | 技术 |
|:---:|---|
| 框架 | [Next.js 15](https://nextjs.org/) · App Router · TypeScript |
| UI | [React 19](https://react.dev/) · [Tailwind CSS v4](https://tailwindcss.com/) |
| 数据库 | [PostgreSQL](https://www.postgresql.org/) · [`pg`](https://node-postgres.com/) 直连 |
| 图片存储 | [Vercel Blob](https://vercel.com/docs/storage/vercel-blob) |
| 部署 | [Vercel](https://vercel.com) · Serverless |
| PWA | Web App Manifest · Apple Touch Icon · 主题色适配 |

## 📐 数据库结构

```
┌─────────────┐       ┌──────────────────────┐
│ ingredients │       │        recipes        │
├─────────────┤       ├──────────────────────┤
│ id (PK)     │       │ id (PK)              │
│ category    │       │ title                │
│ name        │       │ category             │
│ sort_order  │       │ last_practice        │
└─────────────┘       │ steps (markdown)     │
                      │ notes (markdown)     │
                      └──────────┬───────────┘
                                 │ 1:N
              ┌──────────────────┼──────────────────┐
              │                                     │
   ┌─────────────────────┐           ┌─────────────────────┐
   │ recipe_ingredients  │           │   recipe_images     │
   ├─────────────────────┤           ├─────────────────────┤
   │ id (PK)             │           │ id (PK)             │
   │ recipe_id (FK)      │           │ recipe_id (FK)      │
   │ ingredient_id (FK)  │           │ url                 │
   │ name                │           │ alt                 │
   │ quantity            │           │ sort_order          │
   │ sort_order          │           └─────────────────────┘
   └─────────────────────┘
```

## 🚀 部署到 Vercel

### 第 1 步：导入仓库

在 [Vercel](https://vercel.com) 导入本 GitHub 仓库，框架自动识别为 Next.js。

### 第 2 步：创建存储

在 Vercel 控制台：

1. **Storage → Create → Postgres** — 创建数据库，自动注入 `POSTGRES_URL` 等环境变量
2. **Storage → Create → Blob** — 创建 Blob 存储，自动注入 `BLOB_READ_WRITE_TOKEN`

### 第 3 步：设置管理密码

在 Vercel 项目 **Settings → Environment Variables** 添加：

```
ADMIN_PASSWORD=你的密码
```

### 第 4 步：部署 + 迁移

1. 点 **Deploy**，等部署完成
2. 本地配置 `.env.local`（从 Vercel 控制台复制 Postgres 和 Blob 的环境变量）
3. 运行迁移脚本 — 建表 + 导入 3 道示例菜谱：

```bash
npm install
npm run migrate
```

4. 访问 `/admin` 输入密码，开始管理菜谱 🎉

## 💻 本地开发

```bash
# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local   # 填入 Postgres 和 Blob 的连接信息 + 管理密码

# 启动开发服务器
npm run dev
```

打开 [localhost:3000](http://localhost:3000) 即可预览。

## 📂 目录结构

```
app/                          Next.js App Router
├── page.tsx                  菜谱列表页（公开）
├── ingredients/page.tsx      食材页（公开）
├── admin/                    管理界面（需密码）
│   ├── layout.tsx            鉴权布局
│   ├── page.tsx              菜谱管理列表
│   ├── new/page.tsx          新增菜品
│   ├── edit/[id]/page.tsx    编辑菜品
│   └── ingredients/          食材管理
└── api/                      API 路由
    ├── recipes/              菜谱 CRUD
    ├── ingredients/          食材 CRUD
    ├── upload/               图片上传 → Vercel Blob
    └── auth/                 登录鉴权

components/                   React 组件
├── RecipeList.tsx            菜谱列表（搜索 / 筛选 / 展开）
├── AdminRecipeForm.tsx       菜谱编辑表单
├── ImageUploader.tsx         图片上传组件
├── IngredientPicker.tsx      食材选择器
├── Lightbox.tsx              图片大图查看
├── Markdown.tsx              Markdown 渲染
├── BottomNav.tsx             底部导航栏
└── LoginForm.tsx             登录表单

lib/                          工具库
├── db.ts                     数据库操作（pg Pool）
├── auth.ts                   认证（HMAC Cookie）
├── markdown.ts               Markdown 解析
└── types.ts                  TypeScript 类型定义

scripts/migrate.ts            建表 + 导入示例数据
public/                       静态资源（PWA 图标、示例图片）
Food/                         旧 Markdown 源文件（迁移用，可删）
data/                         旧图片（迁移用，可删）
```

## 🎨 设计特点

- **暖色菜谱本主题** — 米白底 + 番茄红点缀，温馨治愈
- **暗色模式** — 跟随系统自动切换，夜间浏览不刺眼
- **移动端优先** — 底部标签栏、安全区适配、触摸优化
- **桌面端自适应** — ≥ 900 px 双列网格，≥ 1500 px 三列网格
- **PWA 可安装** — 添加到主屏幕，全屏独立体验

## 📝 Markdown 支持

标准做法和我的做法均支持 Markdown 格式：

```markdown
**粗体**、*斜体*、`行内代码`

1. 有序列表
2. 第二步

- 无序列表
- 另一项

> 引用块（浅色底）

## 小标题（带左侧强调线）
```

---

<div align="center">

Made with ❤️ for 老婆

</div>
