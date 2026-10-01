/* ne-for.ru — быстрый поиск по сайту: Ctrl+K, / или кнопка в шапке */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const norm = s => String(s).toLowerCase().replace(/ё/g,'е');

/* синонимы, чтобы находилось по-человечески */
const ALIAS={
 'tabs:subnet':'ip маска cidr подсеть калькулятор сеть','tabs:pass':'пароль генератор пароли','tabs:exc':'отмазка отмазки','tabs:mt':'mikrotik микротик шпаргалка команды routeros',
 'tabs:ip':'мой ip адрес внешний','tabs:dns':'dns dig nslookup записи','tabs:conv':'chmod unix time base64 url hex jwt конвертер','tabs:wifi':'wifi вайфай qr код гостевая',
 'tabs:cron':'cron расписание крон','tabs:rx':'regex регулярка регулярные выражения','tabs:diff':'diff сравнить конфиги разница','tabs:json':'json yaml форматировать',
 'tabs:hash':'md5 sha хэш хеш uuid guid','tabs:power':'ибп ups poe питание батарея','tabs:site':'ssl сертификат spf dmarc mx домен проверка',
 'atabs:snake':'змейка игра','atabs:mine':'сапер сапёр игра','atabs:call':'звонок линия поддержка',
 'stabs:inc':'инцидент авария ночь мониторинг','stabs:fw':'firewall фаервол файрвол правила mikrotik','stabs:net':'сеть офис vlan свитч проектирование','stabs:crimp':'rj45 обжимка обжать кабель витая пара t568 кримпер','stabs:tama':'тамагочи питомец сервер',
 'gtabs:mt':'mikrotik конфиг конфигуратор роутер','gtabs:ps':'powershell скрипт ad пользователи инвентаризация','gtabs:guide':'инструкция vpn anydesk пароль принтер пользователям',
 'ftabs:quiz':'тест какой ты пользователь','ftabs:phish':'фишинг письма почта мошенники','ftabs:pass':'пароль взлом стойкость проверить',
};
const TABGROUPS=[['#tabs','tools','Тулзы'],['#atabs','arcade','Аркада'],['#stabs','sims','Симуляторы'],['#gtabs','mtconf','Генераторы'],['#ftabs','fun','Для всех']];
const VIEWS=[['home','Главная','начало'],['fun','Для всех','тест фишинг пароль'],['games','Игры','игры поиграть'],['sims','Симуляторы','тренажёры'],['tools','Тулзы','инструменты утилиты'],['gen','Генераторы','конфиг скрипт'],['soft','Софт','программы приложения'],['blog','Блог','заметки статьи'],['me','Профиль','ачивки достижения гостевая']];
let posts=[],texts=false;fetch('posts/index.json').then(r=>r.json()).then(l=>posts=l).catch(()=>{});
/* текст заметок для поиска по содержимому: грузим один раз при первом открытии */
function loadTexts(){if(texts||!posts.length)return;texts=true;Promise.all(posts.map(p=>fetch('posts/'+p.slug+'.md').then(r=>r.text()).then(t=>{p.text=t.replace(/```[\s\S]*?```/g,' ').replace(/[#>*`_\[\]()|-]/g,' ').slice(0,6000)}).catch(()=>{}))).then(()=>{if(!box.hidden){all=items();draw()}})}

async function openSection(id,after){history.pushState(null,'','#'+id);const v=document.getElementById(id)?.closest('.view')?.id.slice(2);
  if(window.nfShow&&v)await window.nfShow(v,id);else location.hash=id;if(after)setTimeout(after,60)}
function items(){const L=[];
  VIEWS.forEach(([k,t,kw])=>L.push({t,g:'Раздел',kw,run:()=>{location.hash=k}}));
  TABGROUPS.forEach(([sel,sec,g])=>document.querySelectorAll(sel+' .tab').forEach(b=>{const key=sel.slice(1)+':'+(b.dataset.p||b.dataset.a||b.dataset.s||b.dataset.g||b.dataset.f);
    L.push({t:b.textContent.trim(),g,kw:ALIAS[key]||'',run:()=>openSection(sec,()=>{b.click();b.scrollIntoView({block:'center',behavior:'smooth'})})})}));
  [['game','Кто положил сеть','Игры','порты коммутатор игра'],['desk','Сервис-деск','Игры','заявки тикеты хелпдеск sla'],['rack','Серверная','Симуляторы','стойка кабели'],['status','Всё ли упало?','Тулзы','статус пинг сервисы доступность'],['term','Терминал','Главная','консоль команды shell'],['ach','Достижения','Профиль','ачивки'],['guest','Гостевая книга','Профиль','отзывы']]
    .forEach(([id,t,g,kw])=>L.push({t,g,kw,run:()=>openSection(id)}));
  posts.forEach(p=>L.push({t:p.title,g:p.case?'Кейс':'Блог',kw:(p.tags||[]).join(' ')+' '+p.desc+' '+(p.text||''),run:()=>{location.hash='post/'+p.slug}}));
  (window.SOFT_LIST||[]).forEach(s=>L.push({t:s[0],g:'Софт',kw:s[3]+' '+s[4],run:()=>{location.hash='soft';setTimeout(()=>{const q=$('#soft-q');if(q){q.value=s[0];q.dispatchEvent(new Event('input'))}},400)}}));
  [['Включить музыку','музыка песни плеер трек аванс этаж саундтрек',()=>window.nfMusic?.play()],['Следующий трек','музыка дальше песня',()=>window.nfMusic?.next()],['Запустить НЕФОРа','ассистент нефор голос hud голограмма джарвис jarvis аргус подсеть таймер погода викторина коды ошибок',()=>hudGo('on')],['Диагностика компьютера','скан проверить пк железо видеокарта нефор',()=>hudGo('scan')],['Включить ne-forOS','ос компьютер рабочий стол windows',()=>osGo('power')],['Подключиться по RDP','rdp удаленный рабочий стол mstsc',()=>osGo('rdp')],
   ['Паника!','начальник excel таблица',()=>window.panicOn?.()],['Сменить тему','тема цвет светлая темная',()=>$('#themeBtn')?.click()],['Звук вкл/выкл','звук',()=>$('#soundBtn')?.click()],
   ['Хакер-режим','hack хакер',()=>{location.hash='home';setTimeout(()=>typeof run==='function'&&run('hack'),400)}],['Случайная байка','история саппорт юмор',()=>{location.hash='home';setTimeout(()=>{$('#story-gen')?.click();$('#story-t')?.scrollIntoView({block:'center'})},400)}]]
    .forEach(([t,kw,f])=>L.push({t,g:'Действие',kw,run:f}));
  return L}
function hudGo(m){(window.hudOn?Promise.resolve():window.need('hud')).then(()=>window.hudOn?.(m))}
function osGo(m){if(window.osPower)window.osPower(m);else window.need?.('os').then(()=>window.osPower?.(m))}
function score(it,q){const t=norm(it.t),k=norm(it.kw+' '+it.g);if(!q)return 1;let s=0;
  for(const w of q.split(/\s+/).filter(Boolean)){let ws=0;if(t.startsWith(w))ws=100;else if(t.includes(w))ws=60;else if(k.includes(w))ws=35;else{let i=0;for(const ch of t){if(ch===w[i])i++;if(i===w.length)break}ws=i===w.length&&w.length>2?12:0}if(!ws)return 0;s+=ws}return s}
const SUGGEST=['Для всех','Запустить НЕФОРа','Включить ne-forOS','Сервис-деск','Обжимка RJ45','Калькулятор подсетей','Генератор паролей','Фишинг или нет','Инцидент в 3 ночи'];

/* интерфейс */
const box=document.createElement('div');box.id='cmdk';box.hidden=true;box.setAttribute('role','dialog');box.setAttribute('aria-label','Поиск по сайту');
box.innerHTML=`<div class="ck-in"><div class="ck-q"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg><input id="ck-input" placeholder="Игра, тулза, заметка или программа…" autocomplete="off" spellcheck="false" aria-label="Поиск"><kbd>Esc</kbd></div>
 <div class="ck-list" id="ck-list" role="listbox"></div><div class="ck-foot"><span><kbd>↑</kbd><kbd>↓</kbd> выбрать</span><span><kbd>Enter</kbd> открыть</span><span><kbd>Ctrl</kbd><kbd>K</kbd> или <kbd>/</kbd> в любом месте</span></div></div>`;
document.body.append(box);
const inp=box.querySelector('input'),list=box.querySelector('#ck-list');let res=[],sel=0,all=[];
function draw(){const q=norm(inp.value.trim());
  res=q?all.map(it=>[score(it,q),it]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,12).map(x=>x[1])
       :SUGGEST.map(t=>all.find(i=>i.t===t)).filter(Boolean);
  sel=Math.min(sel,Math.max(0,res.length-1));
  list.innerHTML=(q?'':'<div class="ck-h">Популярное</div>')+(res.length?res.map((it,i)=>`<button class="ck-it${i===sel?' on':''}" data-i="${i}" role="option" aria-selected="${i===sel}"><span>${h(it.t)}</span><em>${h(it.g)}</em></button>`).join(''):'<p class="ck-none">Ничего не нашлось. Попробуй по-другому: «пароль», «vlan», «змейка».</p>');
  list.querySelectorAll('.ck-it').forEach(b=>{b.onclick=()=>pick(+b.dataset.i);b.onmousemove=()=>{if(sel!==+b.dataset.i){sel=+b.dataset.i;mark()}}})}
function mark(){list.querySelectorAll('.ck-it').forEach((b,i)=>{b.classList.toggle('on',i===sel);b.setAttribute('aria-selected',i===sel)});list.querySelector('.ck-it.on')?.scrollIntoView({block:'nearest'})}
function pick(i){const it=res[i];if(!it)return;close();it.run()}
function open(){loadTexts();all=items();box.hidden=false;inp.value='';sel=0;draw();requestAnimationFrame(()=>inp.focus())}
function close(){box.hidden=true;inp.blur()}
window.openSearch=open;
inp.oninput=()=>{sel=0;draw()};
inp.onkeydown=e=>{if(e.key==='ArrowDown'){sel=Math.min(res.length-1,sel+1);mark();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);mark();e.preventDefault()}else if(e.key==='Enter'){pick(sel);e.preventDefault()}else if(e.key==='Escape'){close();e.stopPropagation()}};
box.addEventListener('click',e=>{if(e.target===box)close()});
addEventListener('keydown',e=>{const typing=/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)||document.activeElement?.isContentEditable;
  if((e.ctrlKey||e.metaKey)&&(e.key==='k'||e.key==='K'||e.key==='л'||e.key==='Л'||e.code==='KeyK')){e.preventDefault();box.hidden?open():close()}
  else if(e.key==='/'&&!typing&&box.hidden&&document.getElementById('os')?.hidden!==false&&document.getElementById('hud')?.hidden!==false){e.preventDefault();open()}});
$('#searchBtn')?.addEventListener('click',open);
if(typeof CMDS!=='undefined')CMDS.search=CMDS.find=()=>{setTimeout(open,100);return 'Открываю поиск…'};
})();
