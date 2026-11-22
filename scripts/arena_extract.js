// arena_extract.js — 在 arena.ai 页面上下文里跑（browse eval 注入）。
// 功能: fetch 榜单页 RSC flight payload（RSC:1 头）, 提取排名行 + 全量 per-model Cost/Task, 返回紧凑 JSON。
// 关注点: 依赖已过 Cloudflare 挑战的真浏览器会话（browse daemon 管理的 Chrome）;
//         __BOARD_URL__ 由 refresh-data.sh 注入; battleCost.entries 按 modelKey 与 rows 对齐,
//         缺 cost 的模型记 null（raw md 里落 N/A, 与旧管线一致）。

(async () => {
  const BOARD = '__BOARD_URL__';
  const r = await fetch(BOARD, { credentials: 'include', headers: { RSC: '1' } });
  const t = await r.text();
  if (!t.includes('ratingLower')) {
    return JSON.stringify({ error: 'no leaderboard payload (CF challenge or route change)', status: r.status, len: t.length });
  }
  const raw = t.replace(/\\"/g, '"').replace(/\\\\/g, '\\');

  // --- 排名行: {"rank":N,...,"releaseType":...} 固定 key 集 ---
  const rowRe = /\{"rank":(?:\d+|null),"rankUpper":-?\d+,"rankLower":-?\d+,"modelKey":"[^"]+","modelDisplayName":"[^"]+",?"?rating"?:[\d.]+,"ratingUpper":[\d.]+,"ratingLower":[\d.]+,"votes":\d+,"modelOrganization":"[^"]*","modelUrl":"[^"]*","license":"[^"]*","inputPricePerMillion":(?:[\d.]+|null),"outputPricePerMillion":(?:[\d.]+|null),"contextLength":(?:\d+|null),"pricePerImage":(?:[\d.]+|null),"pricePerSecond":(?:[\d.]+|null),"releaseType":(?:null|"[^"]*")\}/g;
  let rows = [...raw.matchAll(rowRe)].map(m => m[0]);
  if (rows.length === 0) {
    const loose = /\{"rank":(?:\d+|null),"rankUpper".{0,900}?"releaseType":(?:null|"[^"]*")\}/g;
    rows = [...raw.matchAll(loose)].map(m => m[0]);
  }
  const parsed = rows.map(s => { try { return JSON.parse(s); } catch { return null; } }).filter(Boolean);

  // --- 全量 Cost/Task: initialBattleCost.entries[{modelKey, medianUsd, p25Usd, p95Usd, meanUsd, counts}] ---
  const costEntries = [...raw.matchAll(/\{"modelKey":"[^"]+","medianUsd":[^{}]+\}/g)].map(m => { try { return JSON.parse(m[0]); } catch { return null; } }).filter(Boolean);
  const costByKey = {};
  for (const e of costEntries) costEntries && (costByKey[e.modelKey] = e.medianUsd);

  // --- 榜单 meta: 日期 + 总投票（flight 里搜) ---
  const dateM = raw.match(/(\d{4}-\d{2}-\d{2})/g) || [];
  const voteM = raw.match(/"totalVotes?":(\d+)/) || raw.match(/(\d{7,})\s*votes/);

  return JSON.stringify({
    board: BOARD,
    httpStatus: r.status,
    dateCandidates: [...new Set(dateM)].slice(0, 6),
    totalVotes: voteM ? voteM[1] : null,
    rowCount: parsed.length,
    costEntryCount: costEntries.length,
    costMissing: parsed.filter(x => costByKey[x.modelKey] == null).length,
    sampleCostEntry: costEntries[0] || null,
    rows: parsed.map(x => ({ ...x, costUsd: costByKey[x.modelKey] == null ? null : costByKey[x.modelKey] })),
  });
})()
