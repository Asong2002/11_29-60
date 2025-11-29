# Arin AI 情感交互机器人

一个基于 Next.js 的 AI 情感交互机器人，可以部署到 Vercel。该机器人具有情感反应功能（如脸红动画），当 AI 回复包含 "～" 或 "~" 时会触发。

## 功能特点

- 🤖 与火山引擎 AI Agent 集成
- 💬 实时聊天界面
- 😊 情感反应功能（脸红动画）
- 🔄 智能对话终止机制：当触发10次脸红后，自动终止对话并显示固定代码"MUAKC"
- 🔄 对话状态持久化：使用localStorage保存脸红计数和对话状态
- 🔄 对话重置功能：允许用户在对话终止后重新开始
- 🚀 可部署到 Vercel
- 📱 响应式设计

## 技术栈

- **Next.js 14** - React 框架
- **TypeScript** - 类型安全
- **火山引擎 API** - AI 模型服务

## 本地开发

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 文件为 `.env.local`：

```bash
cp .env.example .env.local
```

编辑 `.env.local` 文件，填入你的火山引擎 API 密钥：

```
VOLCANO_API_KEY=your_api_key_here
VOLCANO_API_URL=https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions
VOLCANO_MODEL_ID=bot-20251031115408-jz6th
```

### 3. 运行开发服务器

```bash
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看应用。

## 部署到 Vercel

### 方法一：通过 Vercel CLI

1. 安装 Vercel CLI：

```bash
npm i -g vercel
```

2. 在项目根目录运行：

```bash
vercel
```

3. 按照提示完成部署。

### 方法二：通过 Vercel 网站

1. 将代码推送到 GitHub/GitLab/Bitbucket
2. 访问 [Vercel](https://vercel.com)
3. 导入你的仓库
4. 在环境变量设置中添加：
   - `VOLCANO_API_KEY` - 你的火山引擎 API 密钥
   - `VOLCANO_API_URL` (可选) - API URL
   - `VOLCANO_MODEL_ID` (可选) - 模型 ID
5. 点击部署

## 环境变量说明

| 变量名 | 必需 | 说明 | 默认值 |
|--------|------|------|--------|
| `VOLCANO_API_KEY` | 是 | 火山引擎 API 密钥 | - |
| `VOLCANO_API_URL` | 否 | 火山引擎 API 地址 | `https://ark.cn-beijing.volces.com/api/v3/bots/chat/completions` |
| `VOLCANO_MODEL_ID` | 否 | 模型 ID | `bot-20251031115408-jz6th` |

## 项目结构

```
arin-bot-vercel/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts      # API 路由（调用火山引擎）
│   ├── globals.css           # 全局样式
│   ├── layout.tsx            # 根布局
│   └── page.tsx              # 主页面组件
├── .env.example              # 环境变量示例
├── .gitignore
├── next.config.js           # Next.js 配置
├── package.json
├── tsconfig.json            # TypeScript 配置
└── README.md
```

## 情感反应功能

当 AI 的回复中包含 "～" 或 "~" 字符时，Arin 的头像会触发脸红动画效果。这个功能在 `app/page.tsx` 中的 `checkBlush` 函数实现。

## 故障排除

### API 连接失败

1. 检查环境变量是否正确设置
2. 确认 API 密钥有效
3. 检查网络连接
4. 查看浏览器控制台和 Vercel 日志

### 部署后无法工作

1. 确保在 Vercel 项目设置中添加了所有必需的环境变量
2. 检查 Vercel 函数日志
3. 确认 API URL 和模型 ID 正确

## 许可证

MIT

