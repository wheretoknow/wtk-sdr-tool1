# WTK SDR Intelligence Tool

> Where to know Insights GmbH 内部销售开发代表（SDR）工作平台

## 概述

WTK SDR Intelligence Tool 是一个基于 React + Supabase 构建的单页应用（SPA），为 SDR 团队提供从酒店发现、资质验证、外联管理到成交跟踪的全流程工作台。当前版本为 **v15** 功能基线，主界面已进一步 **模块化拆分**（见下文目录与版本说明）。

## 技术栈

- **前端框架**：React（JSX）+ Vite + React Router
- **后端 / 数据库**：Supabase（PostgreSQL + REST API）
- **AI 研究引擎**：Claude API（Anthropic），经 Vercel Serverless `api/research.js` 代理
- **部署方式**：Vercel（见根目录 `vercel.json`）或独立静态托管（需自行提供 `/api/research` 等价接口）

## 项目目录结构（仓库根目录）

应用代码位于仓库根目录，**不再使用**嵌套的 `wtk-sdr-tool/` 子目录名；结构如下：

```
.
├── api/
│   └── research.js          # Vercel Serverless：POST /api/research（AI List / Verify 等）
├── router/
│   └── routes.jsx           # 客户端路由（createBrowserRouter），如 /、/login
├── src/
│   ├── main.jsx             # 入口：挂载 RouterProvider
│   ├── assets/styles/
│   │   └── app.css          # 全局样式（CSS 变量与布局）
│   ├── api/
│   │   ├── researchApi.js   # 可选封装：postResearch → fetch("/api/research")
│   │   └── supabase.js      # Supabase REST 封装（sbFetch）
│   ├── components/          # 少量全站复用：如 TierBadge.jsx、ResearchNotes.jsx
│   ├── data/                # 静态配置（geo、pipeline 常量、酒店映射等）
│   ├── utils/               # 工具函数（日期、去重、评分、邮件模板等）
│   └── pages/
│       ├── home/
│       │   ├── HomePage.jsx           # 主工作台：全局筛选、派生数据、Tab 编排
│       │   ├── components/            # 首页专用 UI（Tab、弹窗、抽屉、研究条等）
│       │   │   ├── ResearchCommandPanel.jsx   # 地理/连锁/Run 与两步研究 + 冷却与进度
│       │   │   ├── AddHotelToolbarControl.jsx   # 「+ Add Hotel」与手动录入（sbFetch 写入）
│       │   │   ├── HotelsTab.jsx、PipelineTab.jsx、OutreachTab.jsx …
│       │   │   └── …（Dashboard、ContactTracker、DuplicateFinder、Drawer 等）
│       │   ├── hooks/
│       │   │   └── useRejectLost.js     # Pipeline 丢单/重开弹窗状态与 confirm 逻辑
│       │   └── utils/
│       │       └── prospectCsv.js       # CSV/Excel 导出与导入（批量 prospects）
│       └── login/
│           └── LoginPage.jsx            # 登录占位页（路由 /login）
├── scripts/                 # 本地维护脚本（split / assemble 等，可选）
├── index.html
├── package.json
├── vite.config.js
└── vercel.json
```

### 首页模块化说明（便于维护）

| 模块 | 路径 | 职责 |
|------|------|------|
| 研究命令区 | `pages/home/components/ResearchCommandPanel.jsx` | 地区/连锁/独立/数量、Run、List+Verify 批次、`/api/research` 请求、冷却与进度条 |
| 手动加酒店 | `pages/home/components/AddHotelToolbarControl.jsx` | 工具栏按钮 + `AddHotelModal`，写入 `prospects` 并创建对应 `tracking` 行 |
| CSV 导入导出 | `pages/home/utils/prospectCsv.js` | `exportProspectsCsv`、`importProspectsFromFile` |
| 丢单弹窗逻辑 | `pages/home/hooks/useRejectLost.js` | 与 `RejectLostModal` 配合，依赖父组件传入的 `updatePipeline` |

`HomePage.jsx` 仍负责：**Supabase 全量加载**、**跨 Tab 的筛选状态**（SDR、线索状态、酒店侧筛选、Pipeline 侧筛选、Contact Tracker 筛选）、**派生列表**（`filteredP`、`filteredT`、`validTracking` 等）以及 **详情抽屉 / 全局 Toast**。

说明：**不要删除 `api/research.js`**。研究流程由 `ResearchCommandPanel` 内联调用 **`fetch("/api/research")`**；`src/api/researchApi.js` 为可选封装，可供其他调用方复用。在 Vercel 上由 `api/research.js` 实现；删除后 AI 研究将失败。

## 核心功能

### 1. AI 酒店研究（两步流程）

工具内置 AI 驱动的酒店发现功能，分为两个阶段：

- **List 阶段**：按地理区域批量搜索酒店，AI 返回酒店名称、房间数、ADR（平均每日房价）、集团归属、GM 信息等结构化数据
- **Verify 阶段**：对 List 结果逐条验证，补充邮箱、电话、现有技术供应商（如 TrustYou、ReviewPro、Medallia 等）信息

流程设计包含批次控制、15 秒冷却计时器、API rate limit 自动重试机制（实现位于 **`ResearchCommandPanel`**）。

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

### 7. Outreach / Pipeline 外联视图

`OutreachTab` 等组件提供外联辅助：邮件相关展示、序列进度与 Pipeline stage 联动（具体 UI 见 `pages/home/components`）。

### 8. 查重系统

内置 Duplicate Finder：

- 基于酒店名称和地理位置识别潜在重复记录
- 支持 "Not Duplicate" 标记，标记后不再重复提示
- 标记记录持久化存储（localStorage 键 `wtk_dismissed_dup_pairs`）

### 9. 数据导入 / 导出

- **CSV / Excel 导入**：`prospectCsv.js` 解析文件后批量 POST `prospects`；导入后 `verified = false`，需手动验证后才进入 Pipeline
- **CSV 导出**：按当前 **`filteredP`**（与列表相同的筛选结果）导出列，便于外部分析

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
| 结构重构 | `HomePage` 瘦身：`ResearchCommandPanel`、`AddHotelToolbarControl`、`prospectCsv`、`useRejectLost`；首页业务组件集中于 `pages/home/components` |

## 已知限制与后续方向

- **状态下沉**：跨 Tab 共享的筛选与派生列表仍在 `HomePage`；若继续缩短主页文件，可考虑「Tab 常驻挂载 + 本地 state」或抽取纯函数 `filterProspects` / Context
- **Supabase Key**：anon key 硬编码在前端，建议迁移至环境变量
- **TypeScript**：当前无类型定义，随着团队扩大建议引入
- **localStorage**：部分场景使用 localStorage（如 SDR 姓名、查重忽略对），在受限环境中可能静默失败
- **assemble-app**：`scripts/assemble-app.mjs` 可从片段组装 `HomePage.jsx`；若手改目录结构后运行脚本，需核对生成文件中的 import 路径是否与当前一致

## 相关文档

- WTK SDR Playbook（Cold Email System + Follow-Up Sequence + Reply Handling）
- WTK SDR Battle Cards（vs Medallia / TrustYou / ReviewPro / Mara Solutions / GuestRevu）
- WTK 行业演讲 PPT（四层智能架构 + 竞争对比 + ROI 信息）
