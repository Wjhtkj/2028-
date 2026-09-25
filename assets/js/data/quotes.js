/**
 * quotes.js — 本地句库
 * 网络不可用时作为兜底，同时保证离线也能看到内容。
 * 每条：{ text, author }
 */

export const LOCAL_QUOTES = [
  { text: '向着月亮出发，即使不能到达，也能站在群星之中。', author: '佚名' },
  { text: '从来不是让你把一次考试当作人生成败的赌注，只是想让你在年轻的时候体会一次全力以赴。', author: '《请回答 1988》' },
  { text: '若不给自己设限，人生中就没有限制你发挥的藩篱。', author: '佚名' },
  { text: '所谓光辉岁月，并不是以后闪耀的日子，而是无人问津时，你对梦想的偏执。', author: '《光辉岁月》' },
  { text: '你不必生来勇敢，天赋过人，只要能投入勤奋，诚诚恳恳。', author: '佚名' },
  { text: '将来的你，一定会感谢现在拼命的自己。', author: '佚名' },
  { text: '星光不问赶路人，时光不负有心人。', author: '佚名' },
  { text: '乾坤未定，你我皆是黑马。', author: '佚名' },
  { text: '种一棵树最好的时间是十年前，其次是现在。', author: '佚名' },
  { text: '山高水长，怕什么来不及，慌什么到不了。', author: '佚名' },
  { text: '所有的努力都不会白费，它们只是在等待一个合适的时机。', author: '佚名' },
  { text: '看似不起眼的日复一日，会在将来的某一天，突然让你看到坚持的意义。', author: '佚名' },
  { text: '愿你合上笔盖的那一刻，有战士收刀入鞘的骄傲。', author: '佚名' },
  { text: '真正的勇敢，是怀着恐惧依然前行。', author: '佚名' },
  { text: '路漫漫其修远兮，吾将上下而求索。', author: '屈原' },
  { text: '博观而约取，厚积而薄发。', author: '苏轼' },
  { text: '业精于勤，荒于嬉；行成于思，毁于随。', author: '韩愈' },
  { text: '古之立大事者，不惟有超世之才，亦必有坚忍不拔之志。', author: '苏轼' },
  { text: '锲而舍之，朽木不折；锲而不舍，金石可镂。', author: '《荀子》' },
  { text: '长风破浪会有时，直挂云帆济沧海。', author: '李白' },
  { text: '千淘万漉虽辛苦，吹尽狂沙始到金。', author: '刘禹锡' },
  { text: '宝剑锋从磨砺出，梅花香自苦寒来。', author: '《警世贤文》' },
  { text: '你只管努力，剩下的交给时间。', author: '佚名' },
  { text: '心之所向，素履以往；生如逆旅，一苇以航。', author: '七堇年' },
];

/** 随机取一条（尽量避开上一条） */
export function pickLocalQuote(excludeText = '') {
  if (LOCAL_QUOTES.length === 0) return { text: '愿你全力以赴。', author: '佚名' };
  const pool = LOCAL_QUOTES.filter((q) => q.text !== excludeText);
  const list = pool.length ? pool : LOCAL_QUOTES;
  return list[Math.floor(Math.random() * list.length)];
}
