/* ne-for.ru — интеграции: обновления сайта (GitHub), производственный календарь и курсы ЦБ, Dota 2 (OpenDota), Telegram.
   Данные берутся из data/*.json (их собирает GitHub Actions), а если файлов нет — напрямую из открытых API.
   Настройки — site.config.json в корне сайта. */
(() => {
const h=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m>1&&m<5?b:m===1?a:c};
function ago(t){const s=(Date.now()-new Date(t))/1000;if(s<90)return 'только что';const m=Math.round(s/60);if(m<60)return `${m} ${plural(m,'минуту','минуты','минут')} назад`;
  const hh=Math.round(m/60);if(hh<24)return `${hh} ${plural(hh,'час','часа','часов')} назад`;const d=Math.round(hh/24);if(d<30)return `${d} ${plural(d,'день','дня','дней')} назад`;return new Date(t).toLocaleDateString('ru-RU')}
const j=async(u,o)=>{const r=await fetch(u,o);if(!r.ok)throw new Error(r.status);return r.json()};
const once=f=>{let p;return()=>p||(p=f().catch(e=>{p=null;throw e}))};
const fromData=async(name,live)=>{try{return await j(`data/${name}.json`,{cache:'no-cache'})}catch(e){if(!live)throw e;return live()}};

const cfg=once(()=>j('site.config.json',{cache:'no-cache'}).catch(()=>({})));

/* ---------- GitHub: что нового ---------- */
const site=once(async()=>{const c=await cfg();return fromData('site',async()=>{const repo=c.repo||'Shuuuriiik/Shuuuriiik';
  const L=await j(`https://api.github.com/repos/${repo}/commits?per_page=12`);return {repo,commits:L.map(x=>({sha:x.sha,date:x.commit.author.date,msg:x.commit.message.split('\n')[0],files:null}))}})});
function prettyCommit(c){let m=c.msg;const f=c.files||[];
  if(/^(Add files via upload|Update |Create |Delete |Rename |Merge )/i.test(m)||!m.trim()){const names=f.map(x=>x.split('/').pop()).filter(Boolean);
    m=names.length?`Обновлено: ${names.slice(0,3).join(', ')}${names.length>3?` и ещё ${names.length-3}`:''}`:/^Delete/i.test(m)?'Удалены файлы':'Обновление сайта'}
  return m}

/* ---------- производственный календарь и курсы ---------- */
const cal=once(()=>fromData('calendar',async()=>{const y=new Date().getFullYear(),o={};
  for(const yy of [y,y+1]){try{const r=await fetch(`https://isdayoff.ru/api/getdata?year=${yy}&pre=1`);const t=(await r.text()).trim();if(/^[0-4]{365,366}$/.test(t))o[yy]=t}catch(e){}}if(!Object.keys(o).length)throw new Error('calendar');return o}));
let CAL=null;cal().then(c=>CAL=c).catch(()=>{});
const doy=d=>Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate())-Date.UTC(d.getFullYear(),0,1))/864e5);
function dayCode(d){const s=CAL&&CAL[d.getFullYear()];if(s)return s[doy(d)];const w=d.getDay();return w===0||w===6?'1':'0'}
const isOff=d=>dayCode(d)==='1',isShort=d=>dayCode(d)==='2';
const HOL={'01-01':'Новогодние каникулы','01-02':'Новогодние каникулы','01-03':'Новогодние каникулы','01-04':'Новогодние каникулы','01-05':'Новогодние каникулы','01-06':'Новогодние каникулы','01-07':'Рождество','01-08':'Новогодние каникулы',
  '02-23':'День защитника Отечества','03-08':'Международный женский день','05-01':'Праздник Весны и Труда','05-09':'День Победы','06-12':'День России','11-04':'День народного единства','12-31':'31 декабря'};
const md=d=>`${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
function nextHoliday(from=new Date()){const d=new Date(from);d.setHours(12,0,0,0);for(let i=1;i<370;i++){d.setDate(d.getDate()+1);const w=d.getDay();
  if(isOff(d)&&w!==0&&w!==6)return {date:new Date(d),name:HOL[md(d)]||'перенесённый выходной'}}return null}
function workDaysInMonth(y=new Date().getFullYear(),m=new Date().getMonth()){let n=0;const d=new Date(y,m,1,12);while(d.getMonth()===m){if(!isOff(d))n++;d.setDate(d.getDate()+1)}return n}
const rates=once(()=>fromData('rates',async()=>{const r=await j('https://www.cbr-xml-daily.ru/daily_json.js');const v={};
  for(const k of ['USD','EUR','CNY','KZT','BYN','TRY','GBP','JPY','AED'])if(r.Valute[k]){const x=r.Valute[k];v[k]={n:x.Nominal,name:x.Name,v:x.Value,prev:x.Previous}}return {date:r.Date,v}}));
const SYM={USD:'$',EUR:'€',CNY:'¥',KZT:'₸',BYN:'Br',TRY:'₺',GBP:'£',JPY:'¥',AED:'AED'};
const rub=x=>x.toLocaleString('ru-RU',{minimumFractionDigits:2,maximumFractionDigits:2});

/* ---------- Dota 2 ---------- */
const MEDAL=['','Рекрут','Страж','Рыцарь','Герой','Легенда','Властелин','Божество','Титан'];
const medal=t=>t?`${MEDAL[Math.floor(t/10)]||'?'}${t%10&&Math.floor(t/10)<8?' '+t%10:''}`:'без ранга';
const dota=once(async()=>{const c=await cfg();const id=String(c.dota?.accountId||'').trim();if(!/^\d{3,12}$/.test(id))throw new Error('no-dota');
  return fromData('dota',async()=>{const A='https://api.opendota.com/api';const[p,wl,rec,hs,hr]=await Promise.all([j(`${A}/players/${id}`),j(`${A}/players/${id}/wl`),j(`${A}/players/${id}/recentMatches`),j(`${A}/players/${id}/heroes`),j(`${A}/heroes`)]);
    const H={};hr.forEach(x=>H[x.id]=x.localized_name);
    return {id,name:p.profile?.personaname||'Игрок',avatar:p.profile?.avatarmedium||'',rank:p.rank_tier||0,wl,
      recent:(rec||[]).slice(0,10).map(m=>({m:m.match_id,hero:H[m.hero_id]||'?',k:m.kills,d:m.deaths,a:m.assists,win:(m.player_slot<128)===m.radiant_win,dur:m.duration,t:m.start_time})),
      top:(hs||[]).filter(x=>x.games>0).slice(0,5).map(x=>({hero:H[+x.hero_id]||'?',games:x.games,win:x.win}))}})});

/* ---------- Telegram ---------- */
async function contact(){const c=await cfg(),t=c.telegram||{};
  if(t.relayUrl)return openForm(t);if(t.username){open('https://t.me/'+t.username.replace(/^@/,''),'_blank','noopener');return}
  typeof toast==='function'&&toast('Связь с админом ещё не настроена')}
let form=null;
function openForm(t){if(!form){form=document.createElement('div');form.className='lv-modal';form.hidden=true;form.innerHTML=`<form class="lv-form card" autocomplete="off">
  <div class="lv-fh"><b>Написать админу</b><button type="button" class="lv-x" aria-label="Закрыть">×</button></div>
  <p class="muted">Сообщение придёт автору сайта в Telegram. Если нужен ответ, оставь контакт.</p>
  <label>Имя <input name="name" maxlength="60" placeholder="Необязательно"></label>
  <label>Как ответить <input name="contact" maxlength="100" placeholder="@telegram или почта, необязательно"></label>
  <label>Сообщение <textarea name="msg" rows="5" maxlength="1500" required placeholder="Нашёл баг, есть идея или просто привет"></textarea></label>
  <input name="website" class="lv-hp" tabindex="-1" aria-hidden="true">
  <div class="lv-fa"><span class="muted lv-st"></span><button class="btn">Отправить</button></div></form>`;document.body.append(form);
  const f=form.querySelector('form'),close=()=>{form.hidden=true};form.querySelector('.lv-x').onclick=close;form.addEventListener('click',e=>{if(e.target===form)close()});
  addEventListener('keydown',e=>{if(e.key==='Escape'&&!form.hidden)close()});
  f.onsubmit=async e=>{e.preventDefault();const st=f.querySelector('.lv-st'),b=f.querySelector('.btn');const last=store.get('nefor-contact-t',0);
    if(Date.now()-last<60000){st.textContent='Подожди минуту перед следующим сообщением.';return}
    const d=Object.fromEntries(new FormData(f));if(String(d.msg).trim().length<3){st.textContent='Напиши хоть пару слов.';return}
    b.disabled=true;st.textContent='Отправляю…';
    try{const r=await fetch(t.relayUrl,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({...d,opened:Number(form.dataset.t)||0,page:location.href})});
      if(!r.ok)throw new Error(r.status);store.set('nefor-contact-t',Date.now());window.ach?.('contact');f.reset();st.textContent='';close();typeof toast==='function'&&toast('Отправлено. Спасибо!')}
    catch(err){st.textContent=t.username?'Не отправилось. Напиши напрямую в Telegram.':'Не отправилось, попробуй позже.'}finally{b.disabled=false}}}
  form.dataset.t=Date.now();form.hidden=false;setTimeout(()=>form.querySelector('textarea').focus(),50)}

/* ---------- карточки на главной ---------- */
const box=document.getElementById('live');
async function render(){if(!box)return;const c=await cfg();
  const g=box.querySelector('#lv-git');site().then(s=>{const L=(s.commits||[]).slice(0,5);if(!L.length)throw 0;const repo=s.repo||c.repo;
    g.innerHTML=`<div class="lv-h"><span class="lv-ic">⎇</span><b>Обновления сайта</b><em>${h(ago(L[0].date))}</em></div>
     <ul class="lv-list">${L.map(x=>`<li><span>${h(prettyCommit(x))}</span><time>${h(ago(x.date))}</time></li>`).join('')}</ul>
     <a class="lv-more" href="https://github.com/${h(repo)}/commits/main" target="_blank" rel="noopener">Вся история на GitHub →</a>`}).catch(()=>{g.innerHTML='<div class="lv-h"><span class="lv-ic">⎇</span><b>Обновления сайта</b></div><p class="muted">GitHub сейчас не ответил. Загляни позже.</p>'});
  const dy=box.querySelector('#lv-day');Promise.allSettled([cal(),rates()]).then(([,r])=>{const now=new Date(),tm=new Date(now);tm.setDate(tm.getDate()+1);
    const st=d=>isOff(d)?'выходной':isShort(d)?'сокращённый рабочий':'рабочий';const nh=nextHoliday();
    const rv=r.status==='fulfilled'?r.value:null;
    dy.innerHTML=`<div class="lv-h"><span class="lv-ic">◷</span><b>${h(now.toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'}))}</b></div>
     <ul class="lv-list"><li><span>Сегодня</span><b class="${isOff(now)?'off':'on'}">${st(now)}</b></li><li><span>Завтра</span><b class="${isOff(tm)?'off':'on'}">${st(tm)}</b></li>
     <li><span>Рабочих дней в месяце</span><b>${workDaysInMonth()}</b></li>${nh?`<li><span>Ближайший праздник</span><b>${h(nh.date.toLocaleDateString('ru-RU',{day:'numeric',month:'long'}))}</b></li>`:''}</ul>
     ${rv?`<div class="lv-rates">${['USD','EUR','CNY'].filter(k=>rv.v[k]).map(k=>{const x=rv.v[k],d=x.v-x.prev;return `<span><i>${SYM[k]}</i>${rub(x.v/x.n)}<small class="${d>=0?'up':'dn'}">${d>=0?'▲':'▼'}${rub(Math.abs(d/x.n))}</small></span>`}).join('')}</div><p class="lv-src">Курсы ЦБ РФ на ${h(new Date(rv.date).toLocaleDateString('ru-RU'))}</p>`:''}`});
  const dt=box.querySelector('#lv-dota');dota().then(d=>{const n=d.wl.win+d.wl.lose,wr=n?Math.round(d.wl.win/n*100):0,r=d.recent.slice(0,8),rw=r.filter(x=>x.win).length;dt.hidden=false;
    dt.innerHTML=`<div class="lv-h">${d.avatar?`<img src="${h(d.avatar)}" alt="" class="lv-av" loading="lazy">`:'<span class="lv-ic">⚔</span>'}<b>${h(d.name)} в Dota 2</b><em>${h(medal(d.rank))}</em></div>
     <div class="lv-stats"><span><b>${n.toLocaleString('ru-RU')}</b>матчей</span><span><b>${wr}%</b>побед всего</span><span><b>${rw}/${r.length}</b>последние</span></div>
     <div class="lv-matches">${r.map(x=>`<a class="${x.win?'w':'l'}" href="https://www.opendota.com/matches/${x.m}" target="_blank" rel="noopener" title="${h(x.hero)} · ${x.k}/${x.d}/${x.a} · ${Math.round(x.dur/60)} мин · ${h(ago(x.t*1000))}">${x.win?'W':'L'}</a>`).join('')}</div>
     <ul class="lv-list">${d.top.slice(0,4).map(x=>`<li><span>${h(x.hero)}</span><b>${x.games} игр · ${Math.round(x.win/x.games*100)}%</b></li>`).join('')}</ul>
     <a class="lv-more" href="https://www.opendota.com/players/${h(d.id)}" target="_blank" rel="noopener">Профиль на OpenDota →</a>`}).catch(()=>{});
  const tg=box.querySelector('#lv-tg'),t=c.telegram||{};if(t.channel||t.username||t.relayUrl){tg.hidden=false;const ch=String(t.channel||'').replace(/^@/,'');
    tg.innerHTML=`<div class="lv-h"><span class="lv-ic">✈</span><b>Telegram</b></div>
     <p class="muted">${ch?'Канал автора: заметки, кейсы и новости сайта. А если есть вопрос, идея или нашёл баг — пиши напрямую.':'Есть вопрос, идея или нашёл баг на сайте? Напиши.'}</p>
     <div class="cta" style="margin-top:12px">${ch?`<a class="btn" href="https://t.me/${h(ch)}" target="_blank" rel="noopener">Канал @${h(ch)}</a>`:''}${t.relayUrl||t.username?'<button class="btn ghost" data-contact>Написать админу</button>':''}</div>`}}
if(box){const io=new IntersectionObserver(es=>{if(es.some(e=>e.isIntersecting)){io.disconnect();render()}},{rootMargin:'300px'});io.observe(box)}
document.addEventListener('click',e=>{if(e.target.closest('[data-contact]')){e.preventDefault();contact()}});

/* ---------- API для НЕФОРа и терминала ---------- */
window.nfLive={cfg,site,cal,rates,dota,contact,isOff,isShort,nextHoliday,workDaysInMonth,medal,prettyCommit,ago,rub,SYM};
if(typeof CMDS!=='undefined'){
  CMDS.git=a=>{if(String(a).trim()!=='log')return 'usage: git log';site().then(s=>print((s.commits||[]).slice(0,10).map(x=>`<span class="p">${h((x.sha||'').slice(0,7))}</span> ${h(prettyCommit(x))} <span class="muted">(${h(ago(x.date))})</span>`).join('<br>'))).catch(()=>print('GitHub не ответил','e'));return 'Читаю историю…'};
  CMDS.rates=CMDS.kurs=()=>{rates().then(r=>print(Object.entries(r.v).map(([k,x])=>`${k.padEnd(4)} ${rub(x.v/x.n).padStart(9)} ₽  ${h(x.name)}`).join('<br>')+`<br><span class="muted">ЦБ РФ на ${h(new Date(r.date).toLocaleDateString('ru-RU'))}</span>`)).catch(()=>print('ЦБ не ответил','e'));return 'Спрашиваю ЦБ…'};
  CMDS.isdayoff=CMDS.calendar=()=>{cal().catch(()=>{}).then(()=>{const t=new Date();t.setDate(t.getDate()+1);const nh=nextHoliday();print(`Сегодня: ${isOff(new Date())?'выходной':'рабочий'}<br>Завтра: ${isOff(t)?'выходной':isShort(t)?'сокращённый':'рабочий'}<br>Рабочих дней в месяце: ${workDaysInMonth()}${nh?`<br>Ближайший праздник: ${nh.date.toLocaleDateString('ru-RU')} — ${h(nh.name)}`:''}`)});return null};
  CMDS.dota=()=>{dota().then(d=>{const n=d.wl.win+d.wl.lose;print(`${h(d.name)} · ${h(medal(d.rank))} · ${n} матчей · ${n?Math.round(d.wl.win/n*100):0}% побед<br>`+d.recent.slice(0,5).map(x=>`<span class="${x.win?'p':'e'}">${x.win?'WIN ':'LOSS'}</span> ${h(x.hero)} ${x.k}/${x.d}/${x.a}`).join('<br>'))}).catch(()=>print('Dota-профиль не настроен или OpenDota не ответил','e'));return 'Смотрю матчи…'};
  CMDS.contact=()=>{setTimeout(contact,100);return 'Открываю связь с админом…'}}
})();
