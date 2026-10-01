/**
 * festivals.js — 节日日历（节日自动主题的数据源）
 *
 * 设计：
 *  - 农历节日的公历日期每年都变，这里以"逐年核实"的日期表维护，零依赖、零换算；
 *  - 公历固定节日用 solar() 展开，避免把同一条目写四年；
 *  - 每个节日一个 id，与 tokens.css 里的 [data-festival="<id>"] 一一对应；
 *  - days 为可选生效天数（含当日），默认 1（当日生效，次晨恢复）。
 *
 * 站点窗口：2025-02-28 ~ 2028-06-07（之后显示"已抵达"），故覆盖 2025–2028。
 * 农历日期来源已逐一核对（春节/元宵/清明/端午/七夕/中秋/重阳/除夕），
 * 如需延到 2029 及以后，按同样格式补一行日期即可。
 */

const YEARS = [2025, 2026, 2027, 2028];

/** 把 MM-DD 展开成覆盖年份的 YYYY-MM-DD 数组（公历固定节日） */
const solar = (mmdd) => YEARS.map((y) => `${y}-${mmdd}`);

export const FESTIVALS = [
  /* —— 公历固定节日 —— */
  { id: 'new-year',     name: '元旦',   dates: solar('01-01') },
  { id: 'valentine',    name: '情人节', dates: solar('02-14') },
  { id: 'women-day',    name: '妇女节', dates: solar('03-08') },
  { id: 'labor-day',    name: '劳动节', dates: solar('05-01') },
  { id: 'youth-day',    name: '青年节', dates: solar('05-04') },
  { id: 'children-day', name: '儿童节', dates: solar('06-01') },
  { id: 'army-day',     name: '建军节', dates: solar('08-01') },
  { id: 'teachers-day', name: '教师节', dates: solar('09-10') },
  { id: 'national-day', name: '国庆节', dates: solar('10-01') },
  { id: 'christmas',    name: '圣诞节', dates: solar('12-25') },

  /* —— 农历节日（逐年核实的公历日期） —— */
  { id: 'spring-festival', name: '春节', dates: ['2025-01-29', '2026-02-17', '2027-02-06', '2028-01-26'] },
  { id: 'lantern',         name: '元宵', dates: ['2025-02-12', '2026-03-03', '2027-02-20', '2028-02-09'] },
  { id: 'qingming',        name: '清明', dates: ['2025-04-04', '2026-04-05', '2027-04-05', '2028-04-04'] },
  { id: 'dragon-boat',     name: '端午', dates: ['2025-05-31', '2026-06-19', '2027-06-09', '2028-05-28'] },
  { id: 'qixi',            name: '七夕', dates: ['2025-08-29', '2026-08-19', '2027-08-08', '2028-08-26'] },
  { id: 'mid-autumn',      name: '中秋', dates: ['2025-10-06', '2026-09-25', '2027-09-15', '2028-10-03'] },
  { id: 'double-ninth',    name: '重阳', dates: ['2025-10-29', '2026-10-18', '2027-10-08', '2028-10-26'] },
  { id: 'new-year-eve',    name: '除夕', dates: ['2025-01-28', '2026-02-16', '2027-02-05', '2028-01-25'] },
];
