# WTK SDR Intelligence Tool

> Where to know Insights GmbH 内部销售开发代表（SDR）工作平台

## 概述

WTK SDR Intelligence Tool 是一个基于 React + Supabase 构建的单页应用（SPA），为 SDR 团队提供从酒店发现、资质验证、外联管理到成交跟踪的全流程工作台。当前版本为 **v15**，经过多轮迭代和 SDR 实际使用反馈优化。

## 技术栈

- **前端框架**：React（JSX）+ Vite + React Router
- **后端 / 数据库**：Supabase（PostgreSQL + REST API）
- **AI 研究引擎**：Claude API（Anthropic），经 Vercel Serverless `api/research.js` 代理
- **部署方式**：Vercel（见 `wtk-sdr-tool/vercel.json`）或独立静态托管（需自行提供 `/api/research` 等价接口）

## 项目目录结构（`wtk-sdr-tool/`）

应用代码集中在子目录 **`wtk-sdr-tool`**，大致如下：

```
wtk-sdr-tool/
├── api/
│   └── research.js          # Vercel Serverless：处理 POST /api/research（AI List/Verify 等）
├── router/
│   └── routes.jsx           # 客户端路由（createBrowserRouter），如 /、/login
├── src/
│   ├── main.jsx             # 入口：挂载 RouterProvider
│   ├── assets/
│   │   └── styles/
│   │       └── app.css      # 全局样式（CSS 变量与布局）
│   ├── api/
│   │   ├── researchApi.js   # 前端封装 → fetch("/api/research")
│   │   └── supabase.js      # Supabase REST 封装
│   ├── components/          # 跨页面复用组件（如 OutreachTab、ErrorBoundary、EditableField）
│   ├── data/                # 静态配置（geo、pipeline 常量、酒店映射等）
│   ├── utils/               # 工具函数（日期、去重、评分、邮件模板等）
│   └── pages/
│       ├── home/
│       │   ├── HomePage.jsx # 主工作台（原 App 主体）
│       │   └── components/  # 仅首页使用的 Tab、弹窗、抽屉等
│       └── login/
│           └── LoginPage.jsx # 登录占位页（路由 /login）
├── scripts/                 # 可选本地维护脚本（拆分/组装等）
├── index.html
├── package.json
├── vite.config.js
└── vercel.json              # 构建输出与 api/research 函数超时等
```

说明：**不要删除 `api/research.js`**。前端通过 `researchApi.js` 与 `HomePage` 内请求访问 **`/api/research`**；在 Vercel 上由该文件实现；删除后 AI 研究相关请求将失败。

## 核心功能

### 1. AI 酒店研究（两步流程）

工具内置 AI 驱动的酒店发现功能，分为两个阶段：

- **List 阶段**：按地理区域批量搜索酒店，AI 返回酒店名称、房间数、ADR（平均每日房价）、集团归属、GM 信息等结构化数据
- **Verify 阶段**：对 List 结果逐条验证，补充邮箱、电话、现有技术供应商（如 TrustYou、ReviewPro、Medallia 等）信息

流程设计包含批次控制、15 秒冷却计时器、API rate limit 自动重试机制。

### 2. Verify Gate（验证门控）

酒店从 Hotel List 进入 Pipeline 必须经过手动验证：

- SDR 在 Hotel List 中点击验证按钮，确认酒店信息准确
- 验证通过后自动创建 tracking 记录，酒店进入 Pipeline 的 "Verified" 列
- 未验证的酒店不会出现在 Pipeline 中，防止脏数据污染外联流程

首次加载时会执行一次性迁移：已有外联记录（pipeline_stage 为 "1st" 及以上）的酒店自动标记为已验证。

### 3. Pipeline 管理

Pipeline 采用看板（Kanban）视图，支持拖拽操作：

- **阶段划分**：Verified → 1st Email → 2nd Follow-up → 3rd Follow-up → 4th Follow-up → Replied → Won → Lost → Bounced
- **多视图切换**：Kanban / List / Cards，适应不同工作习惯
- **拖拽改 stage**：拖拽时自动补充对应的联系日期（d1–d4），确保 Contact Tracker 同步
- **乐观更新**：操作立即反映在 UI，后台异步写入 Supabase

### 4. Lead Score 评分算法

系统为每家酒店自动计算 Lead Score，评分维度包括：

- 房间数（规模权重）
- ADR（支付能力权重）
- 现有技术供应商（竞争情报权重）
- 是否有 GM 邮箱（可触达性权重）
- 邮箱类型（个人邮箱 vs 通用邮箱权重）

评分用于排序和优先级判断，帮助 SDR 聚焦高价值线索。

### 5. 竞争情报映射

内置完整的酒店行业竞争情报系统：

- `CLIENT_PROVIDER_MAP`：已知酒店与其技术供应商的映射关系
- `normalizeGroup`：酒店集团名称标准化（处理各种拼写变体）
- `inferBrandFromName`：根据酒店名称推断品牌归属（覆盖主要连锁品牌关键词）

### 6. Contact Tracker（联系追踪）

独立的联系记录视图，显示所有已进入外联流程的酒店：

- 显示条件：有联系日期（d1–d4）、有完成记录（done）、或 pipeline_stage 处于任何外联阶段
- 追踪每封邮件的发送日期、回复状态
- 支持按 SDR 成员筛选

### 7. Outreach Tab（外联工具）

集成邮件外联辅助功能：

- 邮件模板管理
- 外联序列进度追踪
- 与 Pipeline stage 自动联动

### 8. 查重系统

内置 Duplicate Finder：

- 基于酒店名称和地理位置识别潜在重复记录
- 支持 "Not Duplicate" 标记，标记后不再重复提示
- 标记记录持久化存储

### 9. 数据导入 / 导出

- **CSV 导入**：支持从 Excel 导出的 CSV 批量导入酒店数据，导入后 `verified = false`，需手动验证后才进入 Pipeline
- **数据导出**：支持导出当前数据用于外部分析

## 数据模型

系统使用三张核心 Supabase 表：

| 表名 | 用途 | 关键字段 |
|------|------|---------|
| `prospects` | 酒店主数据 | hotel_name, rooms, adr, group, gm_name, email, verified, batch |
| `tracking` | 外联跟踪记录 | prospect_id, pipeline_stage, d1–d4, done[], sdr, intention |
| `contacts` | 联系人信息 | prospect_id, name, title, email, phone |

## UI 设计系统

采用 CSS 变量 token 体系，确保视觉一致性：

- 主色调变量：`--accent`、`--green`、`--red`、`--yellow`
- 文字层级：`--text1`（主文字）、`--text2`（次要）、`--text3`（辅助）
- 边框层级：`--border1`、`--border2`
- 与 WTK 主产品色彩体系对齐：蓝色（OTA 数据）、紫色（社交/AI 来源）、金色（次要数据）

## 版本历史要点

| 版本 | 主要变更 |
|------|---------|
| v7 | 基础版本，完整功能框架 |
| v8 | Duplicate Finder "Not Duplicate" 持久化 |
| v13 | Verify Gate 机制上线，"New" 列改名 "Verified"，自动迁移逻辑 |
| v14 | AI 研究和 CSV 导入不再自动创建 tracking row，统一走 Verify 流程 |
| v15 | SDR 反馈修复：Pipeline ↔ Contact Tracker 同步、Verified 概念区分 |

## 已知限制与后续方向

- **模块化**：主界面已拆为 `pages/home` 与 `components`，仍可继续下沉状态与副作用逻辑
- **Supabase Key**：anon key 硬编码在前端，建议迁移至环境变量
- **TypeScript**：当前无类型定义，随着团队扩大建议引入
- **localStorage**：部分场景使用 localStorage（如 SDR 姓名记忆），在 Claude Artifact 环境中会静默失败

## 相关文档

- WTK SDR Playbook（Cold Email System + Follow-Up Sequence + Reply Handling）
- WTK SDR Battle Cards（vs Medallia / TrustYou / ReviewPro / Mara Solutions / GuestRevu）
- WTK 行业演讲 PPT（四层智能架构 + 竞争对比 + ROI 信息）
