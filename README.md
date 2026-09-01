# 星域棋庭 · AETHER TABLE

深空霓虹风多人桌游门户。

## 在线地址

- **GitHub Pages（静态站 / 本地 AI 可玩）**: https://cqrsyt.github.io/clairegame/
- 联机大厅需要 Node + Socket.IO（Render）。Render 目前要求账号先绑定支付方式才能创建服务。

首次启用 Pages：仓库 [Settings → Pages](https://github.com/cqrsyt/clairegame/settings/pages) → Build and deployment → Source 选 **GitHub Actions**，然后打开 [Actions](https://github.com/cqrsyt/clairegame/actions) 等 Deploy GitHub Pages 跑完。

## 本地运行

```bash
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
- `npm start` 生产启动服务端（同时托管前端）

## Render 部署（联机）

仓库已含 `render.yaml`。在 https://dashboard.render.com/billing 添加支付方式后：
https://dashboard.render.com/blueprint/new?repo=https://github.com/cqrsyt/clairegame

## 可玩

### 本地 vs AI
国际象棋、中国象棋、五子棋、跳棋、飞行棋

### Bots
狼人杀、阿瓦隆、简化麻将

### 联机 Socket.IO
棋类 + 狼人杀 + 阿瓦隆（需服务端）

### 图鉴 Soon
围棋、军棋、斗地主、UNO、Texas Hold'em、大富翁

## 技术
Vite React TS · Express Socket.IO · Vitest · 设计令牌 CSS · Orbitron + Noto Serif SC
