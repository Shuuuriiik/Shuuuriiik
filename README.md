# ne-for.ru — деплой на GitHub Pages (бесплатно, HTTPS)

## 1. Репозиторий
1. github.com → New repository → имя, например `ne-for` → Public.
2. Залить `index.html` и `CNAME` в корень (Add file → Upload files).
3. Settings → Pages → Source: **Deploy from a branch**, Branch: `main` / `/ (root)` → Save.

## 2. DNS в reg.ru (ne-for.ru → DNS-серверы и управление зоной → Изменить)
Удалить текущие `A @ → 95.163.244.138` и `A www → 95.163.244.138`, добавить:

| Тип   | Имя | Значение              |
|-------|-----|-----------------------|
| A     | @   | 185.199.108.153       |
| A     | @   | 185.199.109.153       |
| A     | @   | 185.199.110.153       |
| A     | @   | 185.199.111.153       |
| CNAME | www | `<твой-логин>.github.io.` |

## 3. Домен и HTTPS
Settings → Pages → Custom domain: `ne-for.ru` → Save.
Когда DNS проверится (от 10 мин до пары часов) — включить **Enforce HTTPS**.

Проверка: `nslookup ne-for.ru` должен вернуть 185.199.10x.153.

## Структура
```
index.html          — страница, стили, терминал, калькулятор, пароли, отмазки, шпаргалка, игра
assets/extra.js     — Мой IP, DNS lookup, конвертеры, Wi-Fi QR, аркада, статус, блог, пасхалки
assets/qrcode.js    — библиотека QR (локально, без CDN)
assets/marked.js    — markdown → HTML для блога
assets/v3.js        — конфигуратор MikroTik, серверная, кабель-менеджмент, cron/regex/diff/JSON/хэши, темы, звук, хакер-режим
assets/js-yaml.js   — YAML для конвертера
assets/md5.js       — MD5 для хэшей
404.html            — BSOD вместо «страница не найдена» (GitHub Pages подхватит сам)
posts/index.json    — список заметок
posts/*.md          — сами заметки
CNAME               — домен для GitHub Pages
```

## Новая заметка
1. Создать `posts/slug.md` (первая строка — `# Заголовок`).
2. Добавить в `posts/index.json`:
   `{"slug":"slug","title":"…","date":"2026-10-01","desc":"…","tags":["mikrotik"],"min":3}`
3. Commit → через минуту на сайте. Прямая ссылка: `ne-for.ru/#post/slug`.

## Где что править
- Отмазки — `EX`, шпаргалка MikroTik — `MT`, команды терминала — `CMDS` (index.html)
- Звонки — `CALLS`, сервисы на статус-странице — `SVC` (assets/extra.js)
- Железо в стойке — `DEV`, текст хакер-режима — `HACK`, темы — `THEMES` (assets/v3.js)

Блог грузится через fetch: если открыть index.html двойным кликом, заметки не покажутся. На хостинге всё работает; локально — `python -m http.server` в папке сайта.
