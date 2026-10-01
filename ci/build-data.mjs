// Собирает data/*.json для блока «Пульс сайта» и ассистента НЕФОР.
// Каждый источник независим: если один не ответил, остальные всё равно соберутся,
// а сайт для пропавшего файла сам сходит в открытый API.
import { execSync } from 'node:child_process';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';

const cfg = existsSync('site.config.json') ? JSON.parse(readFileSync('site.config.json', 'utf8')) : {};
mkdirSync('data', { recursive: true });
const save = (name, obj) => { writeFileSync(`data/${name}.json`, JSON.stringify(obj)); console.log(`✓ data/${name}.json`); };
const get = async (url, type = 'json') => {
  const r = await fetch(url, { headers: { 'user-agent': 'ne-for.ru site builder' }, signal: AbortSignal.timeout(20000) });
  if (!r.ok) throw new Error(`${url} → HTTP ${r.status}`);
  return type === 'json' ? r.json() : r.text();
};
const step = async (name, fn) => { try { await fn(); } catch (e) { console.log(`✗ ${name}: ${e.message}`); } };

// 1. История изменений сайта из git
await step('site', async () => {
  const raw = execSync('git log -n 30 --date=iso-strict --pretty=format:%x1e%H%x1f%ad%x1f%s --name-only', { encoding: 'utf8' });
  const commits = raw.split('\x1e').filter(Boolean).map(block => {
    const [head, ...files] = block.trim().split('\n');
    const [sha, date, msg] = head.split('\x1f');
    return { sha, date, msg, files: files.map(f => f.trim()).filter(Boolean).slice(0, 20) };
  });
  const total = +execSync('git rev-list --count HEAD', { encoding: 'utf8' }).trim();
  save('site', { repo: cfg.repo || process.env.GITHUB_REPOSITORY, built: new Date().toISOString(), total, commits });
});

// 2. Курсы ЦБ РФ
await step('rates', async () => {
  const r = await get('https://www.cbr-xml-daily.ru/daily_json.js');
  const v = {};
  for (const k of ['USD', 'EUR', 'CNY', 'KZT', 'BYN', 'TRY', 'GBP', 'JPY', 'AED']) {
    const x = r.Valute?.[k];
    if (x) v[k] = { n: x.Nominal, name: x.Name, v: x.Value, prev: x.Previous };
  }
  if (!Object.keys(v).length) throw new Error('пустой ответ');
  save('rates', { date: r.Date, v });
});

// 3. Производственный календарь РФ (0 — рабочий, 1 — выходной, 2 — сокращённый)
await step('calendar', async () => {
  const y = new Date().getFullYear(), out = {};
  for (const yy of [y, y + 1]) {
    try {
      const t = (await get(`https://isdayoff.ru/api/getdata?year=${yy}&pre=1`, 'text')).trim();
      if (/^[0-4]{365,366}$/.test(t)) out[yy] = t;
    } catch (e) { console.log(`  календарь ${yy}: ${e.message}`); }
  }
  if (!out[y]) throw new Error('нет данных на текущий год');
  save('calendar', out);
});

// 4. Dota 2 через OpenDota (если в site.config.json указан accountId)
await step('dota', async () => {
  const id = String(cfg.dota?.accountId || '').trim();
  if (!/^\d{3,12}$/.test(id)) { console.log('  Dota: accountId не указан, пропускаю'); return; }
  const A = 'https://api.opendota.com/api';
  const [p, wl, rec, hs, hr] = await Promise.all([
    get(`${A}/players/${id}`), get(`${A}/players/${id}/wl`), get(`${A}/players/${id}/recentMatches`),
    get(`${A}/players/${id}/heroes`), get(`${A}/heroes`),
  ]);
  const H = Object.fromEntries(hr.map(x => [x.id, x.localized_name]));
  save('dota', {
    id, name: p.profile?.personaname || 'Игрок', avatar: p.profile?.avatarmedium || '', rank: p.rank_tier || 0, wl,
    recent: (rec || []).slice(0, 10).map(m => ({ m: m.match_id, hero: H[m.hero_id] || '?', k: m.kills, d: m.deaths, a: m.assists,
      win: (m.player_slot < 128) === m.radiant_win, dur: m.duration, t: m.start_time })),
    top: (hs || []).filter(x => x.games > 0).slice(0, 5).map(x => ({ hero: H[+x.hero_id] || '?', games: x.games, win: x.win })),
  });
});
