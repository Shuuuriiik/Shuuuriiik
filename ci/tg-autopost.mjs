// Отправляет в Telegram-канал анонс заметок и кейсов, которые появились в posts/index.json в этом пуше.
// Нужно: секрет репозитория TG_BOT_TOKEN и "telegram.channel" в site.config.json (бот — админ канала).
import { execSync } from 'node:child_process';
import { readFileSync, existsSync } from 'node:fs';

const token = process.env.TG_BOT_TOKEN;
const cfg = existsSync('site.config.json') ? JSON.parse(readFileSync('site.config.json', 'utf8')) : {};
const channel = String(cfg.telegram?.channel || '').trim();
if (!token || !channel) { console.log('Telegram не настроен (нет TG_BOT_TOKEN или telegram.channel), пропускаю.'); process.exit(0); }

const before = process.env.BEFORE || '';
if (!before || /^0+$/.test(before)) { console.log('Первый пуш в ветку — анонсы пропускаю, чтобы не завалить канал.'); process.exit(0); }

let prev = [];
try { prev = JSON.parse(execSync(`git show ${before}:posts/index.json`, { encoding: 'utf8' })); }
catch { console.log('Раньше списка заметок не было — пропускаю.'); process.exit(0); }
const cur = JSON.parse(readFileSync('posts/index.json', 'utf8'));
const known = new Set(prev.map(p => p.slug));
const fresh = cur.filter(p => !known.has(p.slug));
if (!fresh.length) { console.log('Новых заметок нет.'); process.exit(0); }

const domain = existsSync('CNAME') ? readFileSync('CNAME', 'utf8').trim() : 'ne-for.ru';
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const chat = /^-?\d+$/.test(channel) ? channel : '@' + channel.replace(/^@/, '');

for (const p of fresh.slice(0, 5)) {
  const text = `<b>${p.case ? 'Новый кейс' : 'Новая заметка'} на ${esc(domain)}</b>\n\n<b>${esc(p.title)}</b>\n${esc(p.desc)}` +
    `${p.tags?.length ? '\n\n' + p.tags.map(t => '#' + String(t).replace(/[^\p{L}\p{N}_]/gu, '_')).join(' ') : ''}\n\nhttps://${domain}/#post/${p.slug}`;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chat, text, parse_mode: 'HTML' }),
  });
  const j = await r.json();
  console.log(j.ok ? `✓ отправлено: ${p.title}` : `✗ ${p.title}: ${j.description}`);
}
