/**
 * config.js — 全站唯一配置源
 * 所有会变的"业务事实"集中在此，业务模块只读不写。
 */

export const CONFIG = {
  /** 站点文案 */
  site: {
    examName: '2028 高考',
    reachedText: '已抵达。愿你落笔生花，金榜题名。',
  },

  /**
   * 时间轴（均带 +08:00，锁定北京时间，避免异地设备算出不同结果）
   * start  : 高中启程日
   * target : 高考首场开考时刻
   */
  timeline: {
    start:  '2025-02-28T00:00:00+08:00',
    target: '2028-06-07T09:00:00+08:00',
  },

  /** 一言：多数据源按序回退，任一成功即止（已按内容质量排序） */
  quote: {
    timeoutMs: 5000,
    storageKey: 'gaokao2028:quote',

    /**
     * 轻度内容护栏：第三方接口内容不可控，命中这些明显跑题的词会跳过该条。
     * 不需要的话清空数组即可。
     */
    blockKeywords: ['想你', '爱你', '失恋', '分手', '暗恋', '喜欢你', '恋人', '亲吻'],

    endpoints: [
      {
        name: 'hitokoto-诗词',
        url: 'https://v1.hitokoto.cn/?c=i&encode=json',
        parse: (json) => ({
          text: json?.hitokoto,
          author: json?.from_who || json?.from,
        }),
      },
      {
        name: 'hitokoto-哲学',
        url: 'https://v1.hitokoto.cn/?c=k&encode=json',
        parse: (json) => ({
          text: json?.hitokoto,
          author: json?.from_who || json?.from,
        }),
      },
      {
        name: 'xygeng',
        url: 'https://api.xygeng.cn/one',
        parse: (json) => ({
          text: json?.data?.content,
          author: json?.data?.origin,
        }),
      },
    ],
  },

  /** 主题：system / light / dark，用户选择持久化到 localStorage */
  theme: {
    storageKey: 'gaokao2028:theme',
    order: ['system', 'light', 'dark'],
  },
};
