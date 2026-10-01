// Кнопка «Написать админу» на ne-for.ru → сообщение тебе в Telegram.
// Это код для Yandex Cloud Functions (среда Node.js 18 или новее). Токен бота хранится в переменных функции, на сайт не попадает.
// Переменные окружения функции:
//   TG_BOT_TOKEN  — токен бота от @BotFather
//   TG_CHAT_ID    — твой chat id (узнать: написать боту /start, потом открыть https://api.telegram.org/bot<токен>/getUpdates)
//   ALLOW_ORIGIN  — https://ne-for.ru (можно несколько через запятую)

const hits = new Map(); // простой лимит: не больше 3 сообщений за 10 минут с одного IP (в пределах живого экземпляра)

module.exports.handler = async (event) => {
  const allowed = String(process.env.ALLOW_ORIGIN || 'https://ne-for.ru').split(',').map(s => s.trim());
  const origin = event.headers?.Origin || event.headers?.origin || '';
  const cors = {
    'Access-Control-Allow-Origin': allowed.includes(origin) ? origin : allowed[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    'Content-Type': 'application/json',
  };
  const out = (code, obj) => ({ statusCode: code, headers: cors, body: JSON.stringify(obj) });
  if (event.httpMethod === 'OPTIONS') return out(204, {});
  if (event.httpMethod !== 'POST') return out(405, { error: 'method' });
  if (!allowed.includes(origin)) return out(403, { error: 'origin' });

  let d;
  try { d = JSON.parse(event.isBase64Encoded ? Buffer.from(event.body, 'base64').toString() : event.body); }
  catch { return out(400, { error: 'json' }); }

  const msg = String(d.msg || '').trim(), name = String(d.name || '').trim().slice(0, 60), contact = String(d.contact || '').trim().slice(0, 100);
  if (d.website) return out(200, { ok: true });                 // ловушка для ботов: поле скрыто от людей
  if (msg.length < 3 || msg.length > 1500) return out(400, { error: 'length' });
  if (d.opened && Date.now() - Number(d.opened) < 3000) return out(429, { error: 'too-fast' }); // форму заполнили быстрее 3 секунд

  const ip = event.requestContext?.identity?.sourceIp || 'unknown', now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < 600000);
  if (list.length >= 3) return out(429, { error: 'rate' });
  hits.set(ip, [...list, now]);

  const esc = s => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const text = `<b>Сообщение с ne-for.ru</b>\n` +
    `${name ? `От: ${esc(name)}\n` : ''}${contact ? `Ответить: ${esc(contact)}\n` : ''}` +
    `${d.page ? `Страница: ${esc(String(d.page).slice(0, 200))}\n` : ''}\n${esc(msg)}`;
  const r = await fetch(`https://api.telegram.org/bot${process.env.TG_BOT_TOKEN}/sendMessage`, {
    method: 'POST', headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: process.env.TG_CHAT_ID, text, parse_mode: 'HTML', disable_web_page_preview: true }),
  });
  return r.ok ? out(200, { ok: true }) : out(502, { error: 'telegram' });
};
