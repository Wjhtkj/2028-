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
        │   └── quotes.js       本地句库（离线兜底）
        ├── modules/            业务模块（各自独立、可单独替换）
        │   ├── countdown.js    倒计时显示
        │   ├── progress.js     高中进度条
        │   ├── quotes.js       每日一言
        │   ├── theme.js        三态主题
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

### 背景层 `.backdrop` — 纯 CSS 柔光
玻璃拟态的前提是"背后有东西可以透"。背景由 `base.css` 里的三个 `.blob` 径向渐变光斑构成，
缓慢漂移（`34–42s`），为毛玻璃提供色彩来源：
- 用径向渐变而非 `filter: blur()` 实现柔边 —— 视觉等价，但几乎不耗 GPU；
- 没有 JS 参与，禁用脚本时背景依然完整；
- 系统开启"减少动态效果"时光斑静止。

---

## 四、相对原站的主要改进

| 项目 | 原站 | 重写版 |
|---|---|---|
| 代码组织 | 单文件 26KB，CSS/JS 全内联 | 分层模块化，4 个 CSS + 12 个 JS |
| 配色管理 | 两套变量各写一遍，散落在 JS 之外 | 单一 `tokens.css` 令牌源 |
| 外部依赖 | Font Awesome CDN（约 100KB，仅用 3 个图标） | 内联 SVG 精灵，零外部请求 |
| 时间基准 | 硬编码常量，未锁时区 | 统一配置 + 锁定 `+08:00` |
| 一言 | 单一接口，失败即固定文案 | 三级降级 + 日缓存 + 多源择优 |
| 主题 | 仅跟随系统，无法手动切换 | 三态切换并持久化 |
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

**改配色** → `assets/css/tokens.css`。默认 `:root` 是浅色玻璃，`[data-theme="dark"]`
是深色玻璃，改这两组变量即可，全站自动生效，JS 无需改动。

**加一句本地箴言** → `assets/js/data/quotes.js` 的 `LOCAL_QUOTES` 数组。

**关掉跑题词护栏** → `config.js` 里把 `quote.blockKeywords` 置为 `[]`。

**调玻璃质感** → `tokens.css` 里三个变量：`--glass` / `--glass-2` 是玻璃层不透明度，
`--blur` 是模糊强度；光斑颜色改 `--blob-1/2/3`，浓淡改 `--blob-opacity`。
