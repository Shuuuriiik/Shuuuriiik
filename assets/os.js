/* ne-for.ru — ne-forOS: отдельный режим «компьютер в браузере». Основной сайт не трогает:
   разделы сайта временно переезжают в окна и возвращаются на место при закрытии. */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r=>setTimeout(r, reduce?Math.min(ms,80):ms));

/* ---------- иконки (свои пиктограммы) ---------- */
const I={
 pc:'<rect x="6" y="8" width="36" height="24" rx="3"/><path d="M18 40h12M24 32v8"/>',
 term:'<rect x="5" y="8" width="38" height="32" rx="4"/><path d="m12 18 6 5-6 5M22 30h12"/>',
 note:'<path d="M12 5h17l8 8v30H12z"/><path d="M29 5v8h8M17 22h14M17 29h14M17 36h8"/>',
 folder:'<path d="M5 13a3 3 0 0 1 3-3h10l4 5h18a3 3 0 0 1 3 3v19a3 3 0 0 1-3 3H8a3 3 0 0 1-3-3z"/>',
 smile:'<circle cx="24" cy="24" r="18"/><path d="M17 20h.01M31 20h.01M16 29c2.5 4 13.5 4 16 0"/>',
 pad:'<rect x="6" y="14" width="36" height="22" rx="10"/><path d="M15 21v8M11 25h8M31 23h.01M35 27h.01"/>',
 rack:'<rect x="10" y="6" width="28" height="36" rx="3"/><path d="M10 18h28M10 30h28M15 12h8M15 24h8M15 36h8M32 12h.01M32 24h.01M32 36h.01"/>',
 wrench:'<path d="M29 8a9 9 0 0 0-8 13L8 34a3 3 0 0 0 4 4l13-13a9 9 0 0 0 13-8l-6 2-4-4 2-6z"/>',
 code:'<path d="M17 14 7 24l10 10M31 14l10 10-10 10M27 9l-6 30"/>',
 blog:'<path d="M12 6h18l8 8v28H12z"/><path d="M30 6v8h8M17 22h14M17 29h14"/>',
 box:'<path d="M6 15 24 6l18 9v18l-18 9-18-9z"/><path d="m6 15 18 9 18-9M24 24v18"/>',
 cup:'<path d="M16 8h16v10a8 8 0 0 1-16 0zM16 11H9a7 7 0 0 0 7 9M32 11h7a7 7 0 0 1-7 9M24 26v8M17 40h14l-2-6H19z"/>',
 trash:'<path d="M8 12h32M19 12V7h10v5M11 12l2 29h22l2-29M20 19v16M28 19v16"/>',
 pulse:'<path d="M4 26h9l4-10 6 20 5-14 3 4h13"/>',
 power:'<path d="M24 6v17M14 12a15 15 0 1 0 20 0"/>',
};
const svg=(k,c='currentColor')=>`<svg viewBox="0 0 48 48" fill="none" stroke="${c}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">${I[k]}</svg>`;

/* ---------- приложения ---------- */
const APPS={
 computer:{t:'Мой компьютер',ic:'pc',c:'#5ad7ff',fn:()=>explorer('C:')},
 term:{t:'Терминал',ic:'term',c:'#39ff88',fn:terminal},
 readme:{t:'readme.txt',ic:'note',c:'#e6ecf0',fn:notepad},
 fun:{t:'Для всех',ic:'smile',c:'#ffd54a',host:'fun'},
 games:{t:'Игры',ic:'folder',c:'#ffb020',fn:()=>explorer('Игры')},
 sims:{t:'Симуляторы',ic:'rack',c:'#b18cff',host:'sims'},
 tools:{t:'Тулзы',ic:'wrench',c:'#00d1ff',host:'tools'},
 gen:{t:'Генераторы',ic:'code',c:'#39ff88',host:'mtconf'},
 soft:{t:'Софт',ic:'box',c:'#ff8a4d',host:'soft'},
 blog:{t:'Блог',ic:'blog',c:'#e6ecf0',host:'blog'},
 ach:{t:'Достижения',ic:'cup',c:'#ffd54a',host:'ach'},
 status:{t:'Мониторинг',ic:'pulse',c:'#ff4d6d',host:'status'},
 trash:{t:'Корзина',ic:'trash',c:'#9aa7b3',fn:trashWin},
 kps:{t:'Кто положил сеть',ic:'pad',c:'#39ff88',host:'game'},
 arcade:{t:'Аркада',ic:'pad',c:'#ff4d6d',host:'arcade'},
 desk:{t:'Сервис-деск',ic:'term',c:'#00d1ff',host:'desk'},
 rack:{t:'Серверная',ic:'rack',c:'#9aa7b3',host:'rack'},
};
const DESKTOP=['computer','term','readme','fun','games','sims','tools','gen','soft','blog','ach','status','trash'];
const FS={'C:':['fun','games','sims','tools','gen','soft','blog','ach','status','readme'],'Игры':['kps','arcade','desk','rack']};

/* ---------- каркас ---------- */
const OS=document.createElement('div');OS.id='os';OS.hidden=true;
OS.innerHTML=`<div class="os-stage"></div>
 <div class="os-desk" hidden><div class="os-rdp" hidden><span>ne-for.ru · Удалённый рабочий стол · 1920×1080</span><button class="os-rdp-x" aria-label="Отключиться">✕</button></div>
  <div class="os-icons"></div><div class="os-wins"></div>
  <div class="os-start" hidden></div>
  <div class="os-task"><button class="os-startbtn" aria-label="Пуск">${svg('term','currentColor')}<span>Пуск</span></button><div class="os-tb"></div>
   <div class="os-tray"><span title="Сеть подключена">▲▼</span><span>РУС</span><span class="os-clock"></span></div></div></div>`;
document.body.append(OS);
const stage=OS.querySelector('.os-stage'),desk=OS.querySelector('.os-desk'),wins=OS.querySelector('.os-wins'),tb=OS.querySelector('.os-tb'),startM=OS.querySelector('.os-start');
let Z=10,W={},mode='power',running=false;

/* ---------- запуск ---------- */
async function powerOn(how){if(running)return;running=true;['desk','sims','crimp','gen','soft'].forEach(n=>need(n).catch(()=>{}));mode=how;OS.hidden=false;document.body.style.overflow='hidden';desk.hidden=true;stage.hidden=false;
  if(how==='rdp')await rdpSeq();else await bootSeq();
  if(!running)return;await loginSeq();if(!running)return;showDesk()}
function skipper(){return new Promise(r=>{const f=()=>{OS.removeEventListener('click',f);removeEventListener('keydown',f);r()};OS.addEventListener('click',f);addEventListener('keydown',f)})}
async function bootSeq(){stage.className='os-stage boot';stage.innerHTML='<pre class="os-post"></pre>';const pre=stage.querySelector('pre');
  const L=['ne-for BIOS v2.6','CPU: Coffee-Powered Core i7 @ 3.4 GHz','Память: 16384 МБ ............ OK','SSD 0: ne-for-system 512 ГБ ... OK','USB: клавиатура, мышь, флешка бухгалтерии (заблокирована GPO)','','Загрузка ne-forOS…'];
  let skip=false;skipper().then(()=>skip=true);
  for(const l of L){if(skip||!running)break;pre.textContent+=l+'\n';await sleep(170)}
  stage.innerHTML='<div class="os-logo"><div class="os-logo-t">&gt;_ <b>ne</b>-forOS</div><div class="os-spin"><i></i><i></i><i></i><i></i><i></i></div></div>';await sleep(skip?200:1400)}
async function rdpSeq(){stage.className='os-stage rdp';
  stage.innerHTML=`<div class="os-dlg"><div class="os-dlg-h">${svg('pc','#5ad7ff')}<b>Подключение к удалённому рабочему столу</b></div>
   <label>Компьютер<input value="ne-for.ru:3389" readonly aria-label="Компьютер"></label><label>Пользователь<input value="guest" readonly aria-label="Пользователь"></label>
   <p class="os-dlg-st">Готово к подключению</p><div class="os-dlg-b"><button class="os-btn" id="os-rdp-go">Подключить</button><button class="os-btn ghost" id="os-rdp-no">Отмена</button></div></div>`;
  await new Promise(r=>{$('#os-rdp-go').onclick=r;$('#os-rdp-no').onclick=()=>{shutdown(true);r()}});if(!running)return;
  const st=stage.querySelector('.os-dlg-st');for(const t of ['Инициализация удалённого подключения…','Проверка подлинности…']){st.textContent=t;await sleep(650)}
  stage.querySelector('.os-dlg').innerHTML=`<div class="os-dlg-h">${svg('power','#ffb020')}<b>Не удаётся проверить подлинность удалённого компьютера</b></div>
   <p>Сертификат выдан «ne-for.ru», но ему никто не доверяет, включая его самого. Всё равно подключиться?</p><div class="os-dlg-b"><button class="os-btn" id="os-rdp-yes">Да</button><button class="os-btn ghost" id="os-rdp-no2">Нет</button></div>`;
  await new Promise(r=>{$('#os-rdp-yes').onclick=r;$('#os-rdp-no2').onclick=()=>{shutdown(true);r()}});if(!running)return;
  stage.querySelector('.os-dlg').innerHTML='<p class="os-dlg-st">Настройка удалённого сеанса…</p><div class="os-spin"><i></i><i></i><i></i><i></i><i></i></div>';await sleep(900)}
async function loginSeq(){stage.className='os-stage login';
  stage.innerHTML=`<div class="os-login"><div class="os-ava">&gt;_</div><b>guest</b><div class="os-pass"><span></span></div><button class="os-btn" id="os-in">Войти</button><p class="muted">Пароль вводится сам. Это же гостевая учётка.</p></div>`;
  const p=stage.querySelector('.os-pass span');for(let i=0;i<8&&running;i++){p.textContent+='•';await sleep(70)}
  await new Promise(r=>{const b=$('#os-in');b.focus();b.onclick=r;setTimeout(r,reduce?100:1600)});
  stage.innerHTML='<div class="os-login"><div class="os-ava">&gt;_</div><b>Добро пожаловать</b><div class="os-spin"><i></i><i></i><i></i><i></i><i></i></div></div>';await sleep(700)}
function showDesk(){stage.hidden=true;desk.hidden=false;desk.classList.remove('crash');OS.querySelector('.os-rdp').hidden=mode!=='rdp';renderIcons();clock();window.ach?.('os');
  if(!store.get('nefor-os-seen',0)){store.set('nefor-os-seen',1);setTimeout(()=>APPS.readme.fn(),400)}}
function renderIcons(){OS.querySelector('.os-icons').innerHTML=DESKTOP.map(k=>`<button class="os-ic" data-app="${k}"><span style="color:${APPS[k].c}">${svg(APPS[k].ic)}</span><em>${h(APPS[k].t)}</em></button>`).join('');
  OS.querySelectorAll('.os-icons [data-app]').forEach(b=>b.onclick=()=>openApp(b.dataset.app))}
function clock(){const c=OS.querySelector('.os-clock');if(c)c.textContent=new Date().toLocaleTimeString('ru',{hour:'2-digit',minute:'2-digit'})}
setInterval(()=>{if(running)clock()},10000);

/* ---------- выключение, выход, падение ---------- */
async function shutdown(quiet){if(!running)return;startM.hidden=true;
  if(!quiet){desk.hidden=true;stage.hidden=false;stage.className='os-stage login';stage.innerHTML='<div class="os-login"><b>Завершение работы…</b><div class="os-spin"><i></i><i></i><i></i><i></i><i></i></div></div>';await sleep(1100)}
  Object.keys(W).forEach(closeWin);running=false;OS.classList.add('off');await sleep(350);OS.classList.remove('off');OS.hidden=true;document.body.style.overflow='';stage.innerHTML=''}
async function reboot(){Object.keys(W).forEach(closeWin);desk.hidden=true;stage.hidden=false;await bootSeq();await loginSeq();if(running)showDesk()}
async function crash(){window.ach?.('rmrf');desk.classList.add('crash');await sleep(1800);Object.keys(W).forEach(closeWin);desk.hidden=true;stage.hidden=false;stage.className='os-stage bsod';
  stage.innerHTML='<div class="os-bsod"><div class="os-sad">:(</div><p>Вы удалили систему. Целиком. Она этого не заслужила.</p><p>Код остановки: <b>SUDO_RM_RF_ROOT</b></p><p>Не волнуйтесь, у нас есть бэкап. Кажется.</p><p class="os-pct"><span>0</span>% восстановлено</p></div>';
  const s=stage.querySelector('.os-pct span');for(let p=0;p<=100&&running;p+=Math.ceil(Math.random()*9)){s.textContent=Math.min(100,p);await sleep(90)}await sleep(500);if(running)reboot()}

/* ---------- окна ---------- */
function openApp(k){startM.hidden=true;const a=APPS[k];if(!a)return;if(a.host)return hostWin(k);a.fn()}
function makeWin(id,title,ic,color,body,{w=760,h:wh=520,onClose}={}){
  if(W[id]){focus(id);W[id].el.hidden=false;return W[id]}
  const n=Object.keys(W).length,el=document.createElement('div');el.className='os-win';el.style.zIndex=++Z;
  const mob=innerWidth<700;if(mob)el.classList.add('max');
  el.style.width=Math.min(w,innerWidth-40)+'px';el.style.height=Math.min(wh,innerHeight-110)+'px';el.style.left=(120+n*28)%Math.max(60,innerWidth-w)+'px';el.style.top=(30+n*26)+'px';
  el.innerHTML=`<div class="os-wh"><span class="os-wi" style="color:${color}">${svg(ic)}</span><b>${h(title)}</b><button data-w="min" aria-label="Свернуть">—</button><button data-w="max" aria-label="Развернуть">▢</button><button data-w="x" aria-label="Закрыть">✕</button></div><div class="os-wb"></div>`;
  el.querySelector('.os-wb').append(body);wins.append(el);
  const t=document.createElement('button');t.className='os-tbb on';t.innerHTML=`<span style="color:${color}">${svg(ic)}</span>${h(title)}`;tb.append(t);
  W[id]={el,t,onClose};
  t.onclick=()=>{if(el.hidden||+el.style.zIndex!==Z){el.hidden=false;focus(id)}else{el.hidden=true;t.classList.remove('on')}};
  el.addEventListener('pointerdown',()=>focus(id));
  el.querySelector('[data-w=x]').onclick=e=>{e.stopPropagation();closeWin(id)};
  el.querySelector('[data-w=min]').onclick=e=>{e.stopPropagation();el.hidden=true;t.classList.remove('on')};
  el.querySelector('[data-w=max]').onclick=e=>{e.stopPropagation();el.classList.toggle('max');dispatchEvent(new Event('resize'))};
  const hd=el.querySelector('.os-wh');hd.addEventListener('dblclick',()=>{el.classList.toggle('max');dispatchEvent(new Event('resize'))});
  hd.addEventListener('pointerdown',e=>{if(e.target.closest('button')||el.classList.contains('max'))return;const sx=e.clientX-el.offsetLeft,sy=e.clientY-el.offsetTop;hd.setPointerCapture(e.pointerId);
    const mv=ev=>{el.style.left=Math.max(-el.offsetWidth+80,Math.min(innerWidth-80,ev.clientX-sx))+'px';el.style.top=Math.max(0,Math.min(innerHeight-90,ev.clientY-sy))+'px'};
    const up=()=>{hd.removeEventListener('pointermove',mv);hd.removeEventListener('pointerup',up)};hd.addEventListener('pointermove',mv);hd.addEventListener('pointerup',up)});
  focus(id);return W[id]}
function focus(id){const w=W[id];if(!w)return;w.el.style.zIndex=++Z;Object.values(W).forEach(x=>x.t.classList.toggle('on',x===w&&!w.el.hidden))}
function closeWin(id){const w=W[id];if(!w)return;w.onClose?.();w.el.remove();w.t.remove();delete W[id]}
/* раздел сайта в окне: переносим узел, а на старом месте оставляем метку */
function hostWin(k){const a=APPS[k],sec=document.getElementById(a.host);if(!sec)return;if(W[k])return makeWin(k);
  const mark=document.createComment('os:'+a.host);sec.before(mark);const box=document.createElement('div');box.className='os-host';box.append(sec);
  makeWin(k,a.t,a.ic,a.c,box,{w:1000,h:640,onClose:()=>{mark.replaceWith(sec)}});setTimeout(()=>dispatchEvent(new Event('resize')),50)}
function explorer(path){const items=FS[path]||[];const b=document.createElement('div');b.className='os-exp';
  b.innerHTML=`<div class="os-path">${path==='C:'?'Этот компьютер › Локальный диск (C:)':'Этот компьютер › C: › '+h(path)}</div><div class="os-grid">${items.map(k=>`<button class="os-ic" data-app="${k}"><span style="color:${APPS[k].c}">${svg(APPS[k].ic)}</span><em>${h(APPS[k].t)}</em></button>`).join('')}</div>
   ${path==='C:'?'<div class="os-drive"><span>Локальный диск (C:)</span><div class="meter"><i style="width:83%"></i></div><em>свободно 87 ГБ из 512 ГБ. Бухгалтерия опять хранит фото с корпоратива</em></div>':''}`;
  b.querySelectorAll('[data-app]').forEach(x=>x.onclick=()=>openApp(x.dataset.app));
  makeWin('exp-'+path,path==='C:'?'Мой компьютер':path,'folder','#ffb020',b,{w:680,h:420})}
function notepad(){const t=document.createElement('textarea');t.className='os-note';t.spellcheck=false;
  t.value=store.get('nefor-os-note',`Добро пожаловать в ne-forOS!\n\nЭто тот же ne-for.ru, только в виде компьютера.\n\n— Иконки на рабочем столе открывают разделы сайта в окнах.\n— Окна можно таскать, сворачивать и разворачивать двойным кликом по заголовку.\n— «Пуск» внизу слева: там выключение и выход на обычный сайт.\n— В терминале есть help. И sudo rm -rf /, но не надо.\n\nЭтот файл можно редактировать, он сохранится в браузере.`);
  t.oninput=()=>store.set('nefor-os-note',t.value);makeWin('readme','readme.txt — Блокнот','note','#e6ecf0',t,{w:560,h:420})}
function trashWin(){const b=document.createElement('div');b.className='os-exp';const F=[['пароли_новые_НЕ_УДАЛЯТЬ.txt','2 КБ'],['бэкап_финал_точно_последний.zip','0 байт'],['Новая папка (14)','—'],['договор_скан_вверх_ногами.pdf','3 МБ'],['корпоратив_2019.mp4','4,2 ГБ']];
  b.innerHTML=`<table class="os-tbl"><thead><tr><th>Имя</th><th>Размер</th></tr></thead><tbody>${F.map(f=>`<tr><td>${h(f[0])}</td><td>${f[1]}</td></tr>`).join('')}</tbody></table><button class="os-btn" id="os-empty">Очистить корзину</button><p class="muted" id="os-empty-t"></p>`;
  makeWin('trash','Корзина','trash','#9aa7b3',b,{w:560,h:380});
  b.querySelector('#os-empty').onclick=()=>{b.querySelector('#os-empty-t').textContent='Не получилось: бухгалтерия уже восстановила «пароли_новые_НЕ_УДАЛЯТЬ.txt».'}}

/* ---------- терминал ---------- */
function terminal(){const b=document.createElement('div');b.className='os-term';b.innerHTML='<div class="os-to"></div><form class="os-ti"><span>guest@ne-forOS:~$</span><input spellcheck="false" autocomplete="off" aria-label="команда"></form>';
  const out=b.querySelector('.os-to'),inp=b.querySelector('input');let cwd='~';
  const pr=(s,c='')=>{out.insertAdjacentHTML('beforeend',`<div class="${c}">${s}</div>`);out.scrollTop=out.scrollHeight};
  pr('ne-forOS 2.6 (tty1). Набери <b>help</b>.','m');
  const LOC={help:()=>'<b>ls</b> · <b>cd</b> папка · <b>open</b> программа · <b>cat readme.txt</b> · <b>neofetch</b> · <b>uptime</b> · <b>clear</b> · <b>reboot</b> · <b>shutdown</b> · <b>exit</b>\nплюс все команды с главного терминала: fortune, excuse, story, hack, panic…',
   ls:()=>cwd==='~/Игры'?FS['Игры'].map(k=>APPS[k].t).join('   '):DESKTOP.map(k=>APPS[k].t).join('   '),
   cd:a=>{if(!a||a==='~'||a==='..'){cwd='~';return ''}if(/^игры$/i.test(a)){cwd='~/Игры';return ''}return `cd: ${h(a)}: нет такой папки`},
   pwd:()=>cwd,
   open:a=>{const k=Object.keys(APPS).find(k=>k===a||APPS[k].t.toLowerCase()===String(a).toLowerCase());if(!k)return `open: не знаю «${h(a)}». Смотри ls`;openApp(k);return `Открываю ${h(APPS[k].t)}…`},
   cat:a=>/readme/i.test(a)?h(store.get('nefor-os-note','Добро пожаловать в ne-forOS!')):`cat: ${h(a||'')}: нет такого файла`,
   uptime:()=>`up ${Math.floor(performance.now()/60000)} мин, 1 пользователь, нагрузка: кофе`,
   whoami:()=>'guest (без прав администратора, как и все в бухгалтерии)',
   clear:()=>{out.innerHTML='';return null},
   reboot:()=>{setTimeout(reboot,300);return 'Перезагрузка…'},
   shutdown:()=>{setTimeout(()=>shutdown(),300);return 'Выключаюсь…'},exit:()=>{setTimeout(()=>shutdown(),300);return 'logout'},logout:()=>LOC.exit(),
  };
  b.querySelector('form').onsubmit=e=>{e.preventDefault();const line=inp.value;inp.value='';pr(`<span class="p">guest@ne-forOS:${h(cwd)}$</span> ${h(line)}`);
    const [c,...r]=line.trim().split(/\s+/),a=r.join(' ');if(!c)return;
    if(/^sudo$/i.test(c)&&/rm\s+-rf\s+\/(\s|$|\*)/.test(a)){pr('Удаляю /bin, /etc, /home, /usr, /var… и твою репутацию.','e');setTimeout(crash,500);return}
    const f=LOC[c.toLowerCase()]||(typeof CMDS!=='undefined'&&CMDS[c.toLowerCase()]);
    if(!f){pr(`${h(c)}: команда не найдена`,'e');return}const res=f(a);if(res!==null&&res!==undefined)pr(String(res).replace(/\n/g,'<br>'))};
  b.addEventListener('click',()=>inp.focus());makeWin('term','Терминал','term','#39ff88',b,{w:680,h:420});setTimeout(()=>inp.focus(),50)}

/* ---------- «Пуск» ---------- */
function renderStart(){startM.innerHTML=`<div class="os-su"><div class="os-ava sm">&gt;_</div><b>guest</b><span class="muted">ne-forOS 2.6</span></div>
  <div class="os-sl">${['computer','term','fun','kps','arcade','desk','sims','rack','tools','gen','soft','blog','ach','readme'].map(k=>`<button data-app="${k}"><span style="color:${APPS[k].c}">${svg(APPS[k].ic)}</span>${h(APPS[k].t)}</button>`).join('')}</div>
  <div class="os-sb"><button data-a="site">На обычный сайт</button><button data-a="reboot">Перезагрузить</button><button data-a="off" class="off">${svg('power')}Выключить</button></div>`;
  startM.querySelectorAll('[data-app]').forEach(b=>b.onclick=()=>openApp(b.dataset.app));
  startM.querySelector('[data-a=site]').onclick=()=>shutdown(true);startM.querySelector('[data-a=reboot]').onclick=()=>{startM.hidden=true;reboot()};startM.querySelector('[data-a=off]').onclick=()=>shutdown()}
OS.querySelector('.os-startbtn').onclick=e=>{e.stopPropagation();if(startM.hidden)renderStart();startM.hidden=!startM.hidden};
desk.addEventListener('pointerdown',e=>{if(!startM.hidden&&!e.target.closest('.os-start,.os-startbtn'))startM.hidden=true});
OS.querySelector('.os-rdp-x').onclick=()=>shutdown(true);

/* ---------- входы с сайта ---------- */
window.osPower=powerOn;
if(typeof CMDS!=='undefined'){CMDS.startx=()=>{setTimeout(()=>powerOn('power'),200);return 'Включаю ne-forOS…'};CMDS.rdp=CMDS.mstsc=()=>{setTimeout(()=>powerOn('rdp'),200);return 'mstsc /v:ne-for.ru'}}
})();
