# 2028 高考倒计时 · 重写版

原站 `https://2028.wjhtkjwz.eu.org` 的完整重写。功能等价，代码结构、可维护性与视觉表现全部重做。

---

## 一、运行方式

纯静态站点，**零依赖、零构建**。但由于使用了浏览器原生 ES Modules，
需要通过 HTTP 打开（直接双击 `index.html` 会因 `file://` 的跨域限制加载失败）。

```bash
# 方式一：Python（自带）
python -m http.server 8000

# 方式二：Node
npx serve .

# 然后浏览器访问 http://127.0.0.1:8000
```

部署：把整个目录原样上传到 Cloudflare Pages / GitHub Pages / Nginx 即可，无需任何构建步骤。

> 若确实需要 `file://` 双击打开，需把 `assets/js` 合并为单个非 module 脚本，
> 或改为 `<script>` 顺序加载。当前结构优先保证可维护性。

---

## 二、目录结构

```
2028/
├── index.html                  页面骨架（语义化标签 + 无 JS 时也有基本结构）
├── favicon.svg                 站点图标
├── manifest.webmanifest        PWA 清单（可添加到主屏幕）
├── README.md
└── assets/
    ├── css/
    │   ├── tokens.css          设计令牌：颜色/间距/圆角/字体/动效（唯一配色来源）
    │   ├── base.css            重置、全局排版、可访问性基础
    │   ├── layout.css          页面骨架与区块布局
    │   └── components.css      各功能模块的组件样式
    └── js/
        ├── config.js           全站唯一配置源（时间轴、接口、主题）
        ├── core/               与业务无关的基础层
        │   ├── time.js         纯时间计算（可单测，不碰 DOM）
        │   ├── ticker.js       统一心跳源
        │   ├── storage.js      localStorage 安全封装
        │   └── dom.js          DOM 工具（脏检查、事件、一次性动画）
    ├── data/
    │   ├── festivals.js    节日公历日期表（自动主题数据源）
    │   └── quotes.js       本地句库（离线兜底）
    ├── modules/            业务模块（各自独立、可单独替换）
    │   ├── countdown.js    倒计时显示
    │   ├── progress.js     高中进度条
    │   ├── milestones.js   关键节点（进度刻度 + 倒计时 chips）
    │   ├── quotes.js       每日一言
    │   ├── theme.js        三态主题
    │   ├── holidayTheme.js 节日自动主题
    │   └── share.js        复制状态到剪贴板
        └── main.js             入口编排层
```

分层原则：**`core` 不知道业务，`modules` 不知道彼此，`main` 负责把它们拼起来。**

---

## 三、模块实现要点

### `core/time.js` — 纯计算
所有日期运算集中在此，输入时间戳、输出结构，不碰 DOM。因此 countdown / progress
共享同一套算法，不会出现两处算出不同结果的问题。关键函数：
`splitDuration()` 拆天时分秒、`progressPercent()` 算进度并夹在 `[0, 100]`。

### `core/ticker.js` — 单一心跳源
全站只有一个 `requestAnimationFrame` 循环：
- 按 `interval` 节流回调，并对齐到 interval 边界，避免长时间运行后累积漂移；
- 监听 `visibilitychange`，页面隐藏时挂起（省电），恢复可见时立即补一帧，避免显示滞后。

### `modules/countdown.js` — 只渲染，不计时
不持有定时器，由 `main` 注入 `now`。每个数值位独立脏检查，只有真正变化才写 DOM；
变化瞬间给格子挂 `is-ticking`，动画交给 CSS。抵达后整组切到 `is-reached`（强调色）。

### `modules/progress.js` — 进度条
进度值来自 `time.js`，这里只负责呈现：填充条与端点光点共用同一百分比，
同步维护 `role="progressbar"` 的 aria 值供读屏器读取。

### `modules/milestones.js` — 关键节点
里程碑不写死日期，全部由 `start/target` 推导（半程点按比例、百日誓师/考前一周按开考前 N 天）。
做两件事：往进度条上画静态刻度点，往面板渲染「距节点还有 N 天」的 chips，
逐 chip 脏检查，只在跨天时写 DOM。节点清单在 `config.js` 的 `milestones` 配置。

### `modules/quotes.js` — 三级降级
`本地日缓存 → 远程多数据源 → 本地句库`，任一环节失败都不会白屏：
- "每日"用 `dayKey()` 判定，同一天刷新不再重复请求；
- 远程内容一律 `textContent` 写入，天然免疫 XSS（不做手写转义）；
- 请求带 `AbortController` 超时，弱网 5 秒内必定收敛到兜底；
- 数据源按内容质量排序，并有一道可关闭的跑题词护栏。

### `modules/theme.js` — 三态主题
`跟随系统 / 浅色 / 深色` 循环切换，状态落在 `<html data-theme>` 上。
**JS 只翻转开关，不碰任何颜色值** —— 配色全部由 `tokens.css` 的 CSS 变量承担，
新增主题只需加一段变量覆盖，无需改动任何 JS。

### `modules/holidayTheme.js` — 节日自动主题
按北京时间（`+08:00`）判定当前日期，命中节日时给 `<html>` 加上 `data-festival`。
CSS 中 `:root[data-festival="<id>"]` 会强制覆盖当天的浅色/深色主题，节日结束后自动移除。
节日数据在 `assets/js/data/festivals.js` 维护：公历固定节日用 `solar()` 展开，
农历节日按逐年核实的公历日期表录入。预览任意主题：
`http://127.0.0.1:8000/?festival=spring-festival`。

### 背景层 `.backdrop` — 纯 CSS 柔光 + 极光
液态玻璃的前提是"背后有东西可以透"。背景由一层 `.aurora` 定向渐变色带 +
三个 `.blob` 径向渐变光斑构成，缓慢漂移，为玻璃提供色彩来源：
- 用径向渐变而非 `filter: blur()` 实现柔边 —— 视觉等价，但几乎不耗 GPU；
- 没有 JS 参与，禁用脚本时背景依然完整；
- 系统开启"减少动态效果"时全部静止。

### 液态玻璃面板 `.panel` — 两条低成本签名
页面由多个悬浮 `.panel`（英雄倒计时 / 征程 / 一言）组成，液态感来自两个纯 CSS 技法：
- **发光描边**：`::before` 用渐变背景 + `mask` 镂空出 1.5px 亮边（受光侧亮、背光侧弱）；
- **镜面扫光**：`::after` 一条柔亮带周期性掠过面板表面（9s 一次，reduced-motion 下静止）。
配色仍全部来自 `tokens.css` 的变量，新增主题/节日只需补变量，JS 不碰颜色。

### UI 结构
- **英雄面板**：超大「天」数为主视觉，时/分/秒收为下方小字条（CSS Grid 重排，倒计时 JS 未动）；
- **征程面板**：进度条（含节点刻度）+ 三项指标 + 关键节点 chips；
- **一言面板**：每日一言 + 刷新；
- **主题切换**：右上角独立悬浮液态钮，不占版面。

---

## 四、相对原站的主要改进

| 项目 | 原站 | 重写版 |
|---|---|---|
| 代码组织 | 单文件 26KB，CSS/JS 全内联 | 分层模块化，4 个 CSS + 12 个 JS |
| 配色管理 | 两套变量各写一遍，散落在 JS 之外 | 单一 `tokens.css` 令牌源 |
| 外部依赖 | Font Awesome CDN（约 100KB，仅用 3 个图标） | 内联 SVG 精灵，零外部请求 |
| 时间基准 | 硬编码常量，未锁时区 | 统一配置 + 锁定 `+08:00` |
| 一言 | 单一接口，失败即固定文案 | 三级降级 + 日缓存 + 多源择优 |
| 主题 | 仅跟随系统，无法手动切换 | 三态切换并持久化 + 节日自动强制主题 |
| 心跳 | rAF 常驻，页面隐藏仍在跑 | 隐藏挂起、可见补偿、边界对齐 |
| 无障碍 | 无 aria / 无键盘焦点 | 语义标签 + aria + 焦点可见 + 减少动效 |
| 倒计时结束 | 全部归零，无后续状态 | 切换为"已抵达"横幅与强调色态 |
| PWA | 无 | manifest + favicon，可添加到主屏幕 |

---

## 五、常用改法

**改考试时间** → `assets/js/config.js` 的 `timeline`：

```js
timeline: {
  start:  '2025-02-28T00:00:00+08:00',   // 高中启程
  target: '2028-06-07T09:00:00+08:00',   // 首场开考
}
```

**改配色** → `assets/css/tokens.css`。默认 `:root` 是浅色液态玻璃，`[data-theme="dark"]`
是深色液态玻璃，改这两组变量即可，全站自动生效，JS 无需改动。

**加一句本地箴言** → `assets/js/data/quotes.js` 的 `LOCAL_QUOTES` 数组。

**关掉跑题词护栏** → `config.js` 里把 `quote.blockKeywords` 置为 `[]`。

**调玻璃质感** → `tokens.css`：`--glass` / `--glass-2` / `--glass-3` 是玻璃层不透明度，
`--blur` 是模糊强度；光斑颜色改 `--blob-1/2/3`，浓淡改 `--blob-opacity`；
液态描边改 `--edge-1/2`，扫光改 `--sheen` / `--sheen-opacity`。

**改关键节点** → `config.js` 的 `milestones` 数组（按比例 `ratio` 或开考前 `beforeTargetDays`）。

**开关节日自动主题** → `config.js` 里 `festival.enabled`。

**预览主题 / 节日** → URL 后加 `?theme=light|dark|system` 或 `?festival=<id>`，
例如 `?theme=dark`、`?festival=mid-autumn`（仅预览，不写入偏好）。

**加/改节日** → 改 `assets/js/data/festivals.js`：
- 公历固定节日：给 `solar('MM-DD')` 加一行；
- 农历节日：在 `dates` 数组里补上下一年的公历日期，并到 `tokens.css` 加一段
  `:root[data-festival="<id>"] { ... }` 色板。

**节日主题预览** → 在 URL 后加 `?festival=<id>`，例如 `?festival=mid-autumn`。
