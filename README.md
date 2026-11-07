# 2028 高考倒计时 · 重写版

原站 `https://2028.wjhtkjwz.eu.org` 的完整重写。功能等价，代码结构、可维护性与视觉表现全部重做。
前端采用 **iOS 液态玻璃（iOS Liquid Glass）**：折射透镜、镜面高光环、棱镜色散、同心超椭圆圆角与浮起胶囊控件。

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
    │   ├── base.css            重置、液态背景、可访问性基础
    │   ├── layout.css          页面骨架 + iOS 液态玻璃面板（光学层）
    │   └── components.css      组件样式（含次级玻璃胶囊与弹性反馈）
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

### 背景层 `.backdrop` — 纯 CSS 柔光 + 极光 + 光泽带
液态玻璃的前提是"背后有东西可以透"。背景由一层 `.aurora` 定向渐变色带 +
三个 `.blob` 径向渐变光斑构成，缓慢漂移，为玻璃提供色彩来源：
- 用径向渐变而非 `filter: blur()` 实现柔边 —— 视觉等价，但几乎不耗 GPU；
- `.backdrop::after` 是一道**静态**斜向光泽带。背景 `fixed` 而内容滚动，
  滚动时高光便相对玻璃"滑动"，这是 iOS 液态玻璃动态感的来源，且不需要动画；
- 没有 JS 参与，禁用脚本时背景依然完整；
- 系统开启"减少动态效果"时全部静止。

### iOS 液态玻璃面板 `.panel` — 四层光学
普通毛玻璃只做"模糊"，iOS Liquid Glass 做的是"折射"。每个面板叠四层，全部纯 CSS：

| 层 | 实现 | 作用 |
|---|---|---|
| ① 主体 | `radial-gradient` 顶部透镜提亮 + 半透明玻璃 + `backdrop-filter: blur/saturate/brightness` | 折射背景、吸收背后色彩 |
| ② 厚度 | `box-shadow` 多重 `inset`：上缘镜面高光、下缘与两侧反射、极淡外轮廓 | 不用实边框，靠反光界定玻璃边界 |
| ③ 表面 | `.panel::before` 窄亮带周期掠过（10s，reduced-motion 静止） | 流动镜面扫光 |
| ④ 边缘 | `.panel__optics` 的两个伪元素 + `mask` 镂空：白色高光环 + `conic-gradient` 棱镜色散 | Liquid Glass 最标志性的彩边 |

`.panel__optics` 是每个面板内的**纯装饰空 span**（`aria-hidden`），不参与任何 JS 选择器。
需要三层光学各自动画/透明度独立，两个伪元素不够用，故单独加这一层容器。

**次级玻璃**：面板内的时分秒字条 / 指标卡 / chips 已**去掉 `backdrop-filter`** ——
面板已经折射过背景，内部再模糊一次既失真又费 GPU；改由上缘高光 + 下缘厚度反光表达层次。
页脚按钮/徽标浮在背景之上，仍保留模糊。

**同心连续圆角**：`@supports (corner-shape: squircle)` 时启用 `superellipse(4)`，
旧浏览器自动回退普通 `border-radius`。字体栈也改为 iOS 优先（SF Pro / 苹方）。

配色仍全部来自 `tokens.css` 的变量，新增主题/节日只需补变量，JS 不碰颜色。

### UI 结构
- **英雄面板**：超大「天」数为主视觉，时/分/秒收为下方小字条（CSS Grid 重排，倒计时 JS 未动）；
- **征程面板**：进度条（含节点刻度）+ 三项指标 + 关键节点 chips；
- **一言面板**：每日一言 + 刷新；
- **主题切换**：右上角独立悬浮液态钮，不占版面。

### 响应式策略
断点按设备比例而非单纯像素：
- **≤560px 竖屏手机**：收紧内边距与间距，指标保持 3 列（比单列更省纵向空间）；
- **≤374px 超小屏（iPhone SE / 折叠外屏）**：进一步压缩天数字号与字条间距；
- **横屏 + 短高度（≤560px）**：核心信息优先，隐藏 eyebrow 与页脚装饰句、压缩面板，让英雄面板在横屏一屏可见；节日时 eyebrow 仍会显示；
- **≥1024px 桌面/平板横屏**：舞台最大宽度从 620px 放宽到 720px；
- **触控优化**：`pointer: coarse` 设备上按钮最小点击区 44×44px；
- **可读性下限**：所有可见文本 ≥12px。宁可收紧间距也不缩字号 —— 靠缩小文字来"塞进一屏"会直接牺牲移动端可读性。

#### 移动端关键的 overflow 约束（勿删）
`base.css` 里 `html` 与 `body` **必须同时**设 `overflow-x: hidden/clip`，
`.backdrop` 同时设 `overflow: clip` + `contain: layout paint size`。

原因：背景层的 `.aurora` / `.blob` 是刻意伸出视口的绝对定位大色块。
在移动浏览器里，若只在 `body` 上约束，这些溢出会把 **layout viewport 撑大**
（实测 390px 视口被撑到 795px），于是所有 `position: fixed` 元素都按这个
被撑大的包含块定位 —— **右上角的主题按钮会跑到屏幕外**，整页还能左右拖动。
`hidden` 是旧版 iOS Safari 的兜底，`clip` 是现代写法（不创建滚动容器）。
实测三者齐全时 `scrollWidth` 回到 390、主题按钮回到视口内。

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
| 响应式 | 一套桌面布局缩放 | 320px-1440px 全适配：竖屏收紧、横屏压缩、桌面加宽 |
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

**改配色** → `assets/css/tokens.css`。默认 `:root` 是浅色 iOS 玻璃，`[data-theme="dark"]`
是深色 iOS 玻璃，改这两组变量即可，全站自动生效，JS 无需改动。
光学层令牌（`--prism` / `--glass-sat` / `--glass-lum` / `--pearl`）定义在 `:root`，
主题无关，浅/深/节日共用，不必在每套色板里重复。

**加一句本地箴言** → `assets/js/data/quotes.js` 的 `LOCAL_QUOTES` 数组。

**关掉跑题词护栏** → `config.js` 里把 `quote.blockKeywords` 置为 `[]`。

**调玻璃质感** → `tokens.css`：`--glass` / `--glass-2` / `--glass-3` 是玻璃层不透明度，
`--blur` 是模糊强度，`--glass-sat` / `--glass-lum` 是折射后的饱和/提亮；
光斑颜色改 `--blob-1/2/3`，浓淡改 `--blob-opacity`；
镜面高光环改 `--edge-1/2`，扫光改 `--sheen` / `--sheen-opacity`；
**棱镜色散浓淡**改 `--prism-opacity`（调 0 即完全关闭彩边），色散色相改 `--prism`；
弹性手感改 `--ease-ios` / `--ease-jelly`。

**改关键节点** → `config.js` 的 `milestones` 数组（按比例 `ratio` 或开考前 `beforeTargetDays`）。

**开关节日自动主题** → `config.js` 里 `festival.enabled`。

**预览主题 / 节日** → URL 后加 `?theme=light|dark|system` 或 `?festival=<id>`，
例如 `?theme=dark`、`?festival=mid-autumn`（仅预览，不写入偏好）。

**加/改节日** → 改 `assets/js/data/festivals.js`：
- 公历固定节日：给 `solar('MM-DD')` 加一行；
- 农历节日：在 `dates` 数组里补上下一年的公历日期，并到 `tokens.css` 加一段
  `:root[data-festival="<id>"] { ... }` 色板。

**节日主题预览** → 在 URL 后加 `?festival=<id>`，例如 `?festival=mid-autumn`。
