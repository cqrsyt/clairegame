# 星域棋庭 · AETHER TABLE

深空霓虹风多人桌游门户。

## 快速开始

```bash
cd /workspace/clairegame
npm install
npm run dev
```

- 客户端: http://localhost:5173
- 服务端: http://localhost:3001

## 脚本

- `npm install` 安装依赖
- `npm run dev` 启动客户端+服务端
- `npm run build` 生产构建
- `npm test` 运行测试
- `npm start` 生产启动服务端

## 可玩

### 本地 vs AI
国际象棋、中国象棋、五子棋、跳棋、飞行棋

### Bots
狼人杀、阿瓦隆、简化麻将

### 联机 Socket.IO
棋类 + 狼人杀 + 阿瓦隆（双标签页）

### 图鉴 Soon
围棋、军棋、斗地主、UNO、Texas Hold'em、大富翁

## 技术
Vite React TS · Express Socket.IO · Vitest · 设计令牌 CSS · Orbitron + Noto Serif SC

## 部署（Render）

见根目录 render.yaml。Build 用 install 与 build；Start 用 start；健康检查 /api/health。

本仓库可用 Render Blueprint（render.yaml）部署为单个 Web Service。

步骤：
1. 推送代码到 GitHub 仓库 cqrsyt/clairegame。
2. 在 Render 控制台选择 Blueprint 连接仓库，或手动创建 Web Service。
3. 构建命令与启动命令见 render.yaml；健康检查路径为 /api/health。
4. 平台会注入 PORT 环境变量；服务默认回退端口 3001。
5. 生产环境 Express 托管 client/dist，并对非 API 路由做 SPA fallback；Socket 客户端使用 io("/") 同域连接。

本地：先完成生产构建，再设置 PORT=4173 启动，然后请求 /api/health 与首页。

