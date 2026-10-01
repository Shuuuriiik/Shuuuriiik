/* ne-for.ru — v2: тулзы, аркада, статус, блог, пасхалки */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };

/* ============ ТУЛЗЫ ============ */

/* --- Мой IP --- */
async function myip(){
  const rows=[['Внешний IPv4','…'],['Внешний IPv6','…']];
  const n=navigator, c=n.connection||{};
  const tz=Intl.DateTimeFormat().resolvedOptions().timeZone;
  const info=[
    ['Браузер', n.userAgent],
    ['Язык', (n.languages||[n.language]).join(', ')],
    ['Часовой пояс', tz+' (UTC'+(-new Date().getTimezoneOffset()/60>=0?'+':'')+(-new Date().getTimezoneOffset()/60)+')'],
    ['Экран', `${screen.width}×${screen.height} @${devicePixelRatio}x, окно ${innerWidth}×${innerHeight}`],
    ['CPU / RAM', `${n.hardwareConcurrency||'?'} потоков / ${n.deviceMemory?('≥'+n.deviceMemory+' ГБ'):'не говорит'}`],
    ['Сеть', c.effectiveType?`${c.effectiveType}, ~${c.downlink} Мбит/с, RTT ${c.rtt} мс`:'браузер не говорит'],
    ['Cookies / DNT', `${n.cookieEnabled?'включены':'выключены'} / ${n.doNotTrack==='1'?'просишь не следить':'не просишь'}`],
  ];
  const draw=()=>$('#ipres').innerHTML=rows.concat(info).map(r=>`<dt>${r[0]}</dt><dd>${h(r[1])}</dd>`).join('');
  draw();
  const get=async(u)=>{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),5000);try{const r=await fetch(u,{signal:ctl.signal});return (await r.json()).ip}catch(e){return null}finally{clearTimeout(t)}};
  const [v4,v6]=await Promise.all([get('https://api.ipify.org?format=json'),get('https://api64.ipify.org?format=json')]);
  rows[0][1]=v4||'не удалось (блокировщик?)';
  rows[1][1]=v6&&v6.includes(':')?v6:'нет IPv6 (как у всех в РФ 🙃)'.replace(' 🙃','');
  draw();
  return v4;
}
$('#ipgo').onclick=myip;

/* --- DNS over HTTPS --- */
const RT={1:'A',2:'NS',5:'CNAME',6:'SOA',15:'MX',16:'TXT',28:'AAAA',257:'CAA'};
async function doh(name,type){
  const urls=[`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`];
  for(const u of urls){
    try{const ctl=new AbortController();const t=setTimeout(()=>ctl.abort(),6000);
      const r=await fetch(u,{headers:{accept:'application/dns-json'},signal:ctl.signal});clearTimeout(t);
      if(r.ok){const j=await r.json();j._via=u.includes('cloudflare')?'1.1.1.1':'8.8.8.8';return j}}catch(e){}
  }
  throw new Error('DoH недоступен');
}
const RCODE={0:'NOERROR',2:'SERVFAIL',3:'NXDOMAIN — такого домена нет',5:'REFUSED'};
async function dnsLookup(){
  const name=$('#dnsname').value.trim().replace(/^https?:\/\//,'').replace(/\/.*$/,''),type=$('#dnstype').value,box=$('#dnsres');
  if(!name){box.innerHTML='';return}
  box.innerHTML='<p style="color:var(--mut)">Резолвлю…</p>';
  try{const j=await doh(name,type);const ans=(j.Answer||[]);
    box.innerHTML=(ans.length?ans.map(a=>`<div class="dnsrow"><span class="t">${RT[a.type]||a.type}</span><span>${h(a.data)}</span><span class="ttl">TTL ${a.TTL}</span></div>`).join('')
      :`<p style="color:var(--warn)">${RCODE[j.Status]||'Status '+j.Status}${j.Status===0?' — записей '+type+' нет':''}</p>`)
      +`<p style="color:var(--mut);font-size:12px">через ${j._via}${j.AD?' · DNSSEC ✓':''}</p>`;
  }catch(e){box.innerHTML=`<p style="color:var(--bad)">${h(e.message)}</p>`}
}
$('#dnsgo').onclick=dnsLookup;$('#dnsname').onkeydown=e=>{if(e.key==='Enter')dnsLookup()};

/* --- chmod --- */
const who=['Владелец','Группа','Остальные'],perm=[['r',4],['w',2],['x',1]];
$('#chmod').innerHTML='<span></span>'+perm.map(p=>`<b>${p[0]}</b>`).join('')+who.map((w,i)=>`<b>${w}</b>`+perm.map(p=>`<label><input type="checkbox" data-w="${i}" data-v="${p[1]}"></label>`).join('')).join('');
const cbs=[...document.querySelectorAll('#chmod input')];
function chmodFromBoxes(){const d=[0,0,0];cbs.forEach(c=>{if(c.checked)d[c.dataset.w]+=+c.dataset.v});$('#chmodn').value=d.join('');chmodSym(d)}
function chmodSym(d){$('#chmods').value=d.map(x=>(x&4?'r':'-')+(x&2?'w':'-')+(x&1?'x':'-')).join('')+`  (chmod ${d.join('')})`}
function chmodFromNum(){const v=$('#chmodn').value.replace(/\D/g,'').slice(-3).padStart(3,'0');const d=[...v].map(Number);if(d.some(x=>x>7))return;cbs.forEach(c=>c.checked=!!(d[c.dataset.w]&c.dataset.v));chmodSym(d)}
cbs.forEach(c=>c.onchange=chmodFromBoxes);$('#chmodn').oninput=chmodFromNum;chmodFromNum();

/* --- unix time --- */
function unix(){const v=$('#unix').value.trim();let d;
  if(!v){$('#unixres').innerHTML='';return}
  if(/^-?\d+(\.\d+)?$/.test(v)){const n=+v;d=new Date(Math.abs(n)>1e12?n:n*1000)}else d=new Date(v);
  if(isNaN(d)){$('#unixres').innerHTML='<dt>Ошибка</dt><dd style="color:var(--bad)">не понял дату</dd>';return}
  const diff=(d-Date.now())/1000,a=Math.abs(diff),rel=a<60?Math.round(a)+' с':a<3600?Math.round(a/60)+' мин':a<86400?Math.round(a/3600)+' ч':Math.round(a/86400)+' дн';
  $('#unixres').innerHTML=[['Локально',d.toLocaleString('ru')],['UTC',d.toUTCString()],['ISO 8601',d.toISOString()],['Unix (с)',Math.floor(d/1000)],['Unix (мс)',+d],['Относительно',diff<0?rel+' назад':'через '+rel]].map(r=>`<dt>${r[0]}</dt><dd>${r[1]}</dd>`).join('')}
$('#unix').oninput=unix;$('#unixnow').onclick=()=>{$('#unix').value=Math.floor(Date.now()/1000);unix()};

/* --- base64 / url / hex / jwt --- */
const enc=new TextEncoder(),dec=new TextDecoder();
const b64e=s=>{let b='';enc.encode(s).forEach(x=>b+=String.fromCharCode(x));return btoa(b)};
const b64d=s=>{s=s.trim().replace(/-/g,'+').replace(/_/g,'/');while(s.length%4)s+='=';return dec.decode(Uint8Array.from(atob(s),c=>c.charCodeAt(0)))};
const CONV={b64e,b64d,urle:encodeURIComponent,urld:decodeURIComponent,
  hexe:s=>[...enc.encode(s)].map(x=>x.toString(16).padStart(2,'0')).join(' '),
  jwt:s=>{const p=s.trim().split('.');if(p.length<2)throw new Error('это не JWT');const hd=JSON.parse(b64d(p[0])),pl=JSON.parse(b64d(p[1]));
    let out='// header\n'+JSON.stringify(hd,null,2)+'\n// payload\n'+JSON.stringify(pl,null,2);
    if(pl.exp)out+=`\n// exp: ${new Date(pl.exp*1000).toLocaleString('ru')} ${pl.exp*1000<Date.now()?'(ПРОТУХ)':'(ещё жив)'}`;return out}};
document.querySelectorAll('#p-conv .chip').forEach(b=>b.onclick=()=>{try{$('#b64out').textContent=CONV[b.dataset.c]($('#b64in').value);$('#b64out').style.color=''}catch(e){$('#b64out').textContent='Ошибка: '+e.message;$('#b64out').style.color='var(--bad)'}});
$('#b64out').onclick=()=>copy($('#b64out').textContent);

/* --- Wi-Fi QR --- */
let qrObj=null;
const wesc=s=>s.replace(/([\\;,:"])/g,'\\$1');
function wifiQR(){
  if(typeof qrcode==='undefined'){need('qrcode').then(wifiQR).catch(()=>{$('#qr').textContent='QR-библиотека не загрузилась'});return}
  const ssid=$('#wssid').value,pass=$('#wpass').value,sec=$('#wsec').value,hid=$('#whid').checked;
  const str=`WIFI:T:${sec};S:${wesc(ssid)};${sec!=='nopass'?'P:'+wesc(pass)+';':''}${hid?'H:true;':''};`;
  qrcode.stringToBytes=qrcode.stringToBytesFuncs['UTF-8'];
  qrObj=qrcode(0,'M');qrObj.addData(str);qrObj.make();
  const n=qrObj.getModuleCount(),cell=Math.floor(220/n)||1,cv=document.createElement('canvas');cv.width=cv.height=n*cell;
  const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qrObj.isDark(r,c))x.fillRect(c*cell,r*cell,cell,cell);
  $('#qr').innerHTML='';$('#qr').append(cv);
  $('#qrlbl').textContent=ssid?`Сеть: ${ssid}`:'введи SSID';
}
['wssid','wpass','wsec','whid'].forEach(id=>{const e=$('#'+id);e.oninput=e.onchange=wifiQR});
$('#wdl').onclick=()=>{if(!qrObj)return;const n=qrObj.getModuleCount(),cell=16,pad=48,W=n*cell+pad*2,cv=document.createElement('canvas');cv.width=W;cv.height=W+90;
  const x=cv.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,cv.width,cv.height);x.fillStyle='#000';
  for(let r=0;r<n;r++)for(let c=0;c<n;c++)if(qrObj.isDark(r,c))x.fillRect(pad+c*cell,pad+r*cell,cell,cell);
  x.font='bold 30px sans-serif';x.textAlign='center';x.fillText('Wi-Fi: '+$('#wssid').value,W/2,W+20);
  x.font='22px sans-serif';x.fillStyle='#555';x.fillText('Наведи камеру телефона',W/2,W+60);
  const a=document.createElement('a');a.download=`wifi-${$('#wssid').value||'qr'}.png`;a.href=cv.toDataURL('image/png');a.click()};
document.querySelector('#tabs .tab[data-p=wifi]')?.addEventListener('click',wifiQR);

/* ============ АРКАДА ============ */
document.querySelectorAll('#atabs .tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#atabs .tab').forEach(x=>x.classList.remove('on'));document.querySelectorAll('.apane').forEach(x=>x.classList.remove('on'));
  t.classList.add('on');$('#a-'+t.dataset.a).classList.add('on');if(t.dataset.a!=='snake')snakePause(true)});
const openArcade=a=>{document.querySelector(`#atabs .tab[data-a="${a}"]`).click();location.hash='arcade'};

/* --- Змейка --- */
const cv=$('#snake'),sx=cv.getContext('2d'),C=20,GW=24,GH=16;
let sn,dir,ndir,food,sScore,sLoop=null,sBest=store.get('nefor-snake',0),sPaused=false,sAlive=false;
$('#sb').textContent=sBest;
function sDraw(){
  sx.fillStyle='#050706';sx.fillRect(0,0,cv.width,cv.height);
  sx.strokeStyle='rgba(57,255,136,.05)';for(let i=0;i<=GW;i++){sx.beginPath();sx.moveTo(i*C,0);sx.lineTo(i*C,GH*C);sx.stroke()}for(let j=0;j<=GH;j++){sx.beginPath();sx.moveTo(0,j*C);sx.lineTo(GW*C,j*C);sx.stroke()}
  if(food){sx.fillStyle='#00d1ff';sx.fillRect(food.x*C+4,food.y*C+4,C-8,C-8);sx.fillStyle='#050706';sx.font='bold 10px monospace';sx.textAlign='center';sx.fillText('p',food.x*C+C/2,food.y*C+C/2+3)}
  (sn||[]).forEach((s,i)=>{sx.fillStyle=i?`rgba(57,255,136,${Math.max(.35,1-i*.03)})`:'#39ff88';sx.fillRect(s.x*C+1,s.y*C+1,C-2,C-2)});
}
function sPlace(){do{food={x:Math.floor(Math.random()*GW),y:Math.floor(Math.random()*GH)}}while(sn.some(s=>s.x===food.x&&s.y===food.y))}
function sStep(){
  if(sPaused)return;dir=ndir;const hd={x:sn[0].x+dir.x,y:sn[0].y+dir.y};
  if(hd.x<0||hd.y<0||hd.x>=GW||hd.y>=GH||sn.some(s=>s.x===hd.x&&s.y===hd.y))return sOver();
  sn.unshift(hd);if(hd.x===food.x&&hd.y===food.y){sScore++;$('#ss').textContent=sScore;sPlace();clearInterval(sLoop);sLoop=setInterval(sStep,Math.max(55,130-sScore*3))}else sn.pop();sDraw()}
function sOver(){clearInterval(sLoop);sAlive=false;if(sScore>=10)window.ach?.('snake');if(sScore>sBest){sBest=sScore;store.set('nefor-snake',sBest);$('#sb').textContent=sBest}
  sDraw();sx.fillStyle='rgba(0,0,0,.6)';sx.fillRect(0,0,cv.width,cv.height);sx.fillStyle='#ff4d6d';sx.font='bold 26px monospace';sx.textAlign='center';sx.fillText('PACKET LOSS 100%',cv.width/2,cv.height/2-6);
  sx.fillStyle='#d8e6dd';sx.font='14px monospace';sx.fillText(`доставлено пакетов: ${sScore}`,cv.width/2,cv.height/2+22);$('#sstart').textContent='Ещё раз'}
function sStart(){sn=[{x:6,y:8},{x:5,y:8},{x:4,y:8}];dir=ndir={x:1,y:0};sScore=0;$('#ss').textContent=0;sPlace();sPaused=false;sAlive=true;clearInterval(sLoop);sLoop=setInterval(sStep,130);sDraw()}
function snakePause(force){if(!sAlive)return;sPaused=force===true?true:!sPaused}
const DIRS={up:{x:0,y:-1},down:{x:0,y:1},left:{x:-1,y:0},right:{x:1,y:0}};
const turn=d=>{const v=DIRS[d];if(v&&sAlive&&!(v.x===-dir.x&&v.y===-dir.y))ndir=v};
document.addEventListener('keydown',e=>{
  if(!$('#a-snake').classList.contains('on')||!sAlive)return;
  const r=cv.getBoundingClientRect();if(r.bottom<0||r.top>innerHeight)return;
  const m={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right',w:'up',s:'down',a:'left',d:'right','ц':'up','ы':'down','ф':'left','в':'right'}[e.key];
  if(document.activeElement&&/INPUT|TEXTAREA/.test(document.activeElement.tagName))return;
  if(m){turn(m);e.preventDefault()}else if(e.key===' '){snakePause();e.preventDefault()}});
let tx=0,ty=0;cv.addEventListener('touchstart',e=>{tx=e.touches[0].clientX;ty=e.touches[0].clientY},{passive:true});
cv.addEventListener('touchend',e=>{const dx=e.changedTouches[0].clientX-tx,dy=e.changedTouches[0].clientY-ty;if(Math.max(Math.abs(dx),Math.abs(dy))<20)return;turn(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))});
document.querySelectorAll('.dpad button').forEach(b=>b.onclick=()=>turn(b.dataset.d));
$('#sstart').onclick=sStart;sn=[];sDraw();sx.fillStyle='#7f978a';sx.font='14px monospace';sx.textAlign='center';sx.fillText('нажми «Старт»',cv.width/2,cv.height/2);

/* --- Сапёр --- */
const MW=12,MH=10,MM=15;let mf,mOpen,mFlag,mDone,mStarted,mTimer,mSec,flagMode=false;
const NC=['','#00d1ff','#39ff88','#ff4d6d','#b18cff','#ffb020','#00e5c0','#fff','#aaa'];
function mNew(){mf=Array(MW*MH).fill(0);mOpen=new Set();mFlag=new Set();mDone=false;mStarted=false;clearInterval(mTimer);mSec=0;$('#mt').textContent=0;$('#mleft').textContent=MM;$('#mmsg').textContent='Где-то в серверной 15 сгоревших БП. ПКМ / долгий тап / «режим флажка» — пометить.';mRender()}
const nb=i=>{const x=i%MW,y=Math.floor(i/MW),r=[];for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){if(!dx&&!dy)continue;const X=x+dx,Y=y+dy;if(X>=0&&Y>=0&&X<MW&&Y<MH)r.push(Y*MW+X)}return r};
function mPlant(safe){const ban=new Set([safe,...nb(safe)]);let k=0;while(k<MM){const i=Math.floor(Math.random()*MW*MH);if(mf[i]!==-1&&!ban.has(i)){mf[i]=-1;k++}}
  mf.forEach((v,i)=>{if(v!==-1)mf[i]=nb(i).filter(j=>mf[j]===-1).length})}
function mDig(i){if(mDone||mFlag.has(i)||mOpen.has(i))return;
  if(!mStarted){mPlant(i);mStarted=true;mTimer=setInterval(()=>$('#mt').textContent=++mSec,1000)}
  if(mf[i]===-1){mDone=true;clearInterval(mTimer);mf.forEach((v,j)=>{if(v===-1)mOpen.add(j)});mRender(i);$('#mmsg').innerHTML='<span style="color:var(--bad)">БП бахнул. Серверная в дыму.</span> Жми «Новая».';return}
  const st=[i];while(st.length){const c=st.pop();if(mOpen.has(c)||mFlag.has(c))continue;mOpen.add(c);if(mf[c]===0)nb(c).forEach(n=>!mOpen.has(n)&&st.push(n))}
  if(mOpen.size===MW*MH-MM){mDone=true;window.ach?.('mine');clearInterval(mTimer);const b=store.get('nefor-mine',0);if(!b||mSec<b)store.set('nefor-mine',mSec);$('#mmsg').innerHTML=`<span style="color:var(--acc)">Серверная спасена за ${mSec} с!</span> Лучшее: ${Math.min(b||mSec,mSec)} с.`}
  mRender()}
function mToggle(i){if(mDone||mOpen.has(i))return;mFlag.has(i)?mFlag.delete(i):mFlag.add(i);$('#mleft').textContent=MM-mFlag.size;mRender()}
function mRender(boom){$('#mine').innerHTML=mf.map((v,i)=>{if(mOpen.has(i)){if(v===-1)return `<div class="o${i===boom?' x':''}">✹</div>`;return `<div class="o" style="color:${NC[v]}">${v||''}</div>`}
  return `<div data-i="${i}">${mFlag.has(i)?'<span style="color:var(--warn)">⚑</span>':''}</div>`}).join('')}
const mEl=$('#mine');let lp=null;
mEl.addEventListener('click',e=>{const d=e.target.closest('[data-i]');if(!d||lp==='done'){lp=null;return}const i=+d.dataset.i;flagMode?mToggle(i):mDig(i)});
mEl.addEventListener('contextmenu',e=>{const d=e.target.closest('[data-i]');if(d){e.preventDefault();mToggle(+d.dataset.i)}});
mEl.addEventListener('touchstart',e=>{const d=e.target.closest('[data-i]');if(!d)return;lp=setTimeout(()=>{mToggle(+d.dataset.i);lp='done'},450)},{passive:true});
mEl.addEventListener('touchend',()=>{if(lp&&lp!=='done'){clearTimeout(lp);lp=null}});
$('#mflag').onclick=()=>{flagMode=!flagMode;$('#mflag').textContent='Режим: '+(flagMode?'флажок ⚑':'копать')};
$('#mnew').onclick=mNew;mNew();

/* --- Звонок на линию --- */
const CALLS=[
 {w:'Бухгалтерия, Светлана',q:'У меня 1С не открывается! Отчёт сдать до обеда!!!',a:[['«Что именно пишет? Скиньте скрин, подключусь удалённо»',15,'Грамотно. Скрин показал: закончилось место на диске.'],['«Перезагрузите компьютер»',5,'Помогло. Как ни странно.'],['«Это не ко мне, это к 1С-нику»',-15,'Светлана пошла к директору.']]},
 {w:'Директор',q:'Почему у меня интернет медленный? У соседей всё летает.',a:[['«Сейчас гляну по графикам в Zabbix, кто грузит канал»',15,'Нашёл: кто-то качает сериалы на весь офис.'],['«Так провайдер у нас такой»',-5,'Директор попросил поменять провайдера. Завтра.'],['«У вас 47 вкладок открыто»',0,'Правда, но премии не будет.']]},
 {w:'Новый менеджер',q:'А какой пароль от Wi-Fi?',a:[['Молча отправить ссылку на Wi-Fi QR с этого сайта',15,'Элегантно. Подключился за 2 секунды.'],['Продиктовать 24-символьный пароль по телефону',-5,'Третья попытка. «А это ноль или буква О?»'],['«Гостевая сеть в переговорке, пароль на стене»',10,'Сработало, но он пошёл не в ту переговорку.']]},
 {w:'Склад',q:'Сканер Честного ЗНАКа не пищит!',a:[['«Проверьте, он вообще заряжен?»',15,'Не был.'],['«Переустановим драйвер»',0,'Час работы. Он был разряжен.'],['«Работаем по бумажке, я после обеда подойду»',-10,'Отгрузка встала. Звонит директор.']]},
 {w:'Неизвестный номер',q:'Здравствуйте, служба безопасности банка. Продиктуйте код из СМС.',a:[['Положить трубку и написать всем в чат «не диктуйте коды»',20,'Через 10 минут звонили бухгалтеру. Она не продиктовала.'],['«Сначала вы мне свой код»',5,'Они бросили трубку. Весело, но бесполезно.'],['Продиктовать',-40,'…']]},
 {w:'Юрист',q:'У меня ЭЦП перестала работать, договор подписать не могу.',a:[['«Сейчас гляну срок — скорее всего, сертификат истёк»',15,'Истёк вчера. Хорошо, что есть реестр ЭП.'],['«Вставьте токен в другой USB»',5,'Не помогло, но звучало уверенно.'],['«Подпишите ручкой»',-10,'Юрист не оценил.']]},
 {w:'Отдел продаж',q:'Принтер печатает какие-то иероглифы.',a:[['«Кто-то отправил PDF как RAW. Очищаю очередь»',15,'Печать пошла. Пачку иероглифов в макулатуру.'],['«Выключите и включите»',5,'Напечатал ещё 40 листов иероглифов.'],['«Это японский. Учите»',-5,'Смешно. Но им нет.']]},
 {w:'Главный инженер',q:'Можно я свой роутер поставлю? Мне Wi-Fi не хватает.',a:[['«Нет, но поставлю точку доступа в нашу сеть»',15,'И сеть цела, и Wi-Fi есть.'],['«Ставьте»',-20,'Через час в сети два DHCP-сервера. Всё легло.'],['«Сидите ближе к окну»',-5,'Он пересел. Не помогло.']]},
];
let cOrder,cIdx,cKarma;
function cNew(){cOrder=[...CALLS].sort(()=>Math.random()-.5);cIdx=0;cKarma=50;cShow()}
function cShow(){$('#ck').textContent=cKarma;
  if(cIdx>=cOrder.length){if(cKarma>=100)window.ach?.('call');const v=cKarma>=150?'Легенда поддержки. Пользователи носят тебе печеньки.':cKarma>=100?'Крепкий админ. Премию дадут (может быть).':cKarma>=50?'Нормально. Живём.':'Тебя ищут с вилами. Может, в разработчики?';
    $('#cwho').innerHTML='<b>Смена окончена</b>';$('#cq').textContent=`Итоговая карма: ${cKarma}. ${v}`;$('#cans').innerHTML='';$('#cmsg').textContent='';$('#cn').textContent=cOrder.length;return}
  const c=cOrder[cIdx];$('#cn').textContent=cIdx+1;$('#cwho').innerHTML=`📞 Звонит: <b>${c.w}</b>`;$('#cq').textContent=c.q;$('#cmsg').textContent='';
  const ans=[...c.a].sort(()=>Math.random()-.5);
  $('#cans').innerHTML=ans.map((a,i)=>`<button data-i="${i}">${h(a[0])}</button>`).join('');
  document.querySelectorAll('#cans button').forEach(b=>b.onclick=()=>{const a=ans[+b.dataset.i];cKarma+=a[1];$('#ck').textContent=cKarma;
    document.querySelectorAll('#cans button').forEach(x=>x.disabled=true);const cl=a[1]>=10?'good':a[1]<0?'bad':'';if(cl)b.classList.add(cl);
    $('#cmsg').innerHTML=`${a[1]>=0?'+':''}${a[1]} — ${h(a[2])} <a href="#" id="cnext">Следующий звонок →</a>`;
    $('#cnext').onclick=e=>{e.preventDefault();cIdx++;cShow()}})}
$('#cnew').onclick=cNew;cNew();

/* ============ СТАТУС ============ */
const SVC=[
 ['Яндекс','https://ya.ru/favicon.ico'],['Госуслуги','https://www.gosuslugi.ru/favicon.ico'],['VK','https://vk.com/favicon.ico'],['Сбер','https://www.sberbank.ru/favicon.ico'],
 ['reg.ru','https://www.reg.ru/favicon.ico'],['GitHub','https://github.com/favicon.ico'],['Google','https://www.google.com/favicon.ico'],['Cloudflare','https://www.cloudflare.com/favicon.ico'],
 ['Telegram','https://telegram.org/favicon.ico'],['YouTube','https://www.youtube.com/favicon.ico'],['Wikipedia','https://ru.wikipedia.org/favicon.ico'],['Microsoft','https://www.microsoft.com/favicon.ico'],
];
const HIST=40,SLOW=800,TIMEOUT=6000;
const st=SVC.map(([n,u])=>({n,u,h:[],ok:0,tot:0}));
$('#stgrid').innerHTML=st.map((s,i)=>`<div class="svc" id="svc${i}"><div class="svc-h"><b>${s.n}</b><span class="badge wait">⏳ жду</span></div><div class="svc-ms">—</div><div class="svc-sub">аптайм сессии: —</div><svg class="spark" preserveAspectRatio="none" data-i="${i}"></svg></div>`).join('');
const tip=document.createElement('div');tip.className='tip';document.body.append(tip);
async function probe(s){const ctl=new AbortController(),t=setTimeout(()=>ctl.abort(),TIMEOUT),t0=performance.now();
  try{await fetch(s.u+'?_='+Date.now(),{mode:'no-cors',cache:'no-store',signal:ctl.signal});return Math.round(performance.now()-t0)}catch(e){return null}finally{clearTimeout(t)}}
function sparkSVG(svg,hist){const W=svg.clientWidth||240,H=44;svg.setAttribute('viewBox',`0 0 ${W} ${H}`);
  const vals=hist.filter(v=>v!==null),max=Math.max(SLOW*1.2,...vals),step=W/(HIST-1),off=HIST-hist.length;
  const y=v=>H-2-(Math.min(v,max)/max)*(H-6);let d='',pen=false,dots='';
  hist.forEach((v,i)=>{const x=(off+i)*step;if(v===null){pen=false;dots+=`<circle cx="${x}" cy="${H-4}" r="3" fill="var(--bad)"/>`;return}d+=(pen?'L':'M')+x.toFixed(1)+' '+y(v).toFixed(1);pen=true});
  const last=hist[hist.length-1];
  svg.innerHTML=`<line x1="0" x2="${W}" y1="${y(SLOW)}" y2="${y(SLOW)}" stroke="var(--warn)" stroke-opacity=".3" stroke-dasharray="3 4"/>
    <path d="${d}" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>${dots}
    ${last!=null?`<circle cx="${(HIST-1)*step}" cy="${y(last)}" r="4" fill="var(--acc)" stroke="var(--card)" stroke-width="2"/>`:''}`;
  svg._geo={step,off}}
function paint(i){const s=st[i],el=$('#svc'+i),v=s.h[s.h.length-1];
  const [cls,lbl]=v==null?['down','✕ лежит']:v>SLOW?['slow','◐ медленно']:['ok','● ок'];
  el.querySelector('.badge').className='badge '+cls;el.querySelector('.badge').textContent=lbl;
  el.querySelector('.svc-ms').innerHTML=v==null?'<span style="color:var(--bad)">timeout</span>':`${v}<small> мс</small>`;
  const ok=s.h.filter(x=>x!==null);const med=ok.length?ok.slice().sort((a,b)=>a-b)[Math.floor(ok.length/2)]:null;
  el.querySelector('.svc-sub').textContent=`аптайм сессии: ${Math.round(s.ok/s.tot*100)}%${med?` · медиана ${med} мс`:''}`;
  sparkSVG(el.querySelector('.spark'),s.h)}
let stCount=0,stBusy=false;
async function checkAll(){if(stBusy)return;stBusy=true;
  await Promise.all(st.map(async(s,i)=>{const v=await probe(s);s.h.push(v);if(s.h.length>HIST)s.h.shift();s.tot++;if(v!==null)s.ok++;paint(i)}));
  stCount++;$('#stc').textContent=stCount;$('#stup').textContent=`${st.filter(s=>s.h[s.h.length-1]!==null).length}/${st.length}`;stBusy=false}
document.querySelectorAll('.spark').forEach(svg=>{
  svg.addEventListener('mousemove',e=>{const g=svg._geo;if(!g)return;const s=st[svg.dataset.i],r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal.width;
    const k=Math.round(((e.clientX-r.left)/r.width*vb)/g.step)-g.off;if(k<0||k>=s.h.length){tip.style.display='none';return}
    const v=s.h[k],ago=(s.h.length-1-k)*15;tip.innerHTML=`<b>${s.n}</b> · ${v==null?'<span style="color:var(--bad)">timeout</span>':v+' мс'} · ${ago?ago+' с назад':'сейчас'}`;
    tip.style.display='block';tip.style.left=Math.min(e.clientX+12,innerWidth-200)+'px';tip.style.top=(e.clientY-34)+'px'});
  svg.addEventListener('mouseleave',()=>tip.style.display='none')});
let stTimer=null;const stIO=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!stTimer){checkAll();stTimer=setInterval(()=>!document.hidden&&checkAll(),15000)}}),{threshold:.05});
stIO.observe($('#status'));$('#stgo').onclick=checkAll;addEventListener('resize',()=>st.forEach((s,i)=>s.h.length&&sparkSVG($('#svc'+i+' .spark'),s.h)));

/* ============ БЛОГ ============ */
let POSTS=[],tag='все';
async function blogInit(){
  try{const r=await fetch('posts/index.json',{cache:'no-cache'});POSTS=(await r.json()).sort((a,b)=>b.date.localeCompare(a.date))}
  catch(e){$('#posts').innerHTML='<p style="color:var(--mut)">Заметки не загрузились (если открыл файл локально — это нормально, на хостинге заработает).</p>';return}
  const tags=['все',...new Set(POSTS.flatMap(p=>p.tags))];
  $('#btags').innerHTML=tags.map(t=>`<button class="tab${t===tag?' on':''}" data-t="${h(t)}">${h(t)}</button>`).join('');
  document.querySelectorAll('#btags .tab').forEach(b=>b.onclick=()=>{tag=b.dataset.t;document.querySelectorAll('#btags .tab').forEach(x=>x.classList.toggle('on',x===b));blogList()});
  blogList();route()}
const fmtD=d=>new Date(d).toLocaleDateString('ru',{day:'numeric',month:'long',year:'numeric'});
function caseCard(p){return `<button class="case" data-s="${h(p.slug)}"><span class="case-stat">${h(p.stat||'кейс')}</span><h3>${h(p.title.replace(/^Кейс:\s*/,''))}</h3><p>${h(p.desc)}</p><span class="case-stack">${(p.stack||[]).map(x=>`<em>${h(x)}</em>`).join('')}</span></button>`}
function postCard(p){return `<button class="post" data-s="${h(p.slug)}"><div class="d">${fmtD(p.date)} · ${p.min||3} мин${p.case?' · <b class="case-b">кейс</b>':''}</div><h3>${h(p.title)}</h3><p>${h(p.desc)}</p><div class="tg">${p.tags.map(t=>`<span>#${h(t)}</span>`).join('')}</div></button>`}
function blogList(){const list=POSTS.filter(p=>tag==='все'||p.tags.includes(tag)),cases=list.filter(p=>p.case),notes=list.filter(p=>!p.case);
  $('#posts').innerHTML=(tag==='все'||tag==='кейс')&&cases.length?`<div class="cases-h"><b>Реальные проекты</b><span class="muted">что делал руками, с граблями и выводами</span></div><div class="cases">${cases.map(caseCard).join('')}</div>${tag==='все'&&notes.length?'<div class="cases-h"><b>Заметки</b><span class="muted">шпаргалки и разборы</span></div>':''}<div class="posts-in">${(tag==='все'?notes:[]).map(postCard).join('')}</div>`
    :`<div class="posts-in">${list.map(postCard).join('')}</div>`;
  document.querySelectorAll('#posts [data-s]').forEach(b=>b.onclick=()=>location.hash='post/'+b.dataset.s)}
async function openPost(slug){const p=POSTS.find(x=>x.slug===slug);if(!p)return;window.achSet?.('blog',slug,3,'reader');
  const R=$('#reader');R.hidden=false;R.scrollTop=0;document.body.style.overflow='hidden';$('#rbody').innerHTML='<p style="color:var(--mut)">Загружаю…</p>';
  try{const md=await (await fetch(`posts/${slug}.md`,{cache:'no-cache'})).text();
    await need('marked').catch(()=>{});const html=typeof marked!=='undefined'?marked.parse(md):'<pre>'+h(md)+'</pre>';
    const url=location.origin+location.pathname+'#post/'+slug;
    const share=`<div class="share"><button class="chip" data-share="copy">Скопировать ссылку</button><a class="chip" href="https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(p.title)}" target="_blank" rel="noopener">Поделиться в Telegram</a></div>`;
    $('#rbody').innerHTML=html.replace(/<\/h1>/,`</h1><div class="meta">${fmtD(p.date)} · ${p.min||3} мин · ${p.tags.map(t=>'#'+h(t)).join(' ')}</div>`);
    const body=$('#rbody'),hs=[...body.querySelectorAll('h2')];
    hs.forEach((x,i)=>x.id='sec-'+i);
    if(hs.length>=3){const toc=document.createElement('nav');toc.className='toc';toc.innerHTML='<b>Содержание</b><ol>'+hs.map((x,i)=>`<li><button data-to="sec-${i}">${h(x.textContent)}</button></li>`).join('')+'</ol>';
      (body.querySelector('.meta')||body.firstChild).after(toc)}
    body.querySelectorAll('[data-to]').forEach(b=>b.onclick=()=>document.getElementById(b.dataset.to)?.scrollIntoView({behavior:'smooth',block:'start'}));
    body.querySelectorAll('pre').forEach(pre=>{const b=document.createElement('button');b.className='cpy';b.textContent='copy';b.onclick=()=>copy(pre.querySelector('code')?.innerText||pre.innerText);pre.append(b)});
    const rel=POSTS.filter(x=>x.slug!==slug).map(x=>[x.tags.filter(t=>p.tags.includes(t)).length+(x.case&&p.case?1:0),x]).filter(x=>x[0]>0).sort((a,b)=>b[0]-a[0]).slice(0,3).map(x=>x[1]);
    body.insertAdjacentHTML('beforeend',share+(rel.length?`<div class="related"><b>Похожие заметки</b><div class="related-in">${rel.map(x=>`<a href="#post/${h(x.slug)}"><span>${x.case?'кейс':fmtD(x.date)}</span>${h(x.title)}</a>`).join('')}</div></div>`:''));
    body.querySelector('[data-share=copy]').onclick=()=>copy(url);
    document.title=p.title+' — ne-for.ru';rprog()}catch(e){$('#rbody').innerHTML='<p style="color:var(--bad)">Не загрузилось.</p>'}}
function rprog(){const R=$('#reader'),bar=$('#rprog');if(!bar)return;const max=R.scrollHeight-R.clientHeight;bar.style.width=(max>0?R.scrollTop/max*100:0)+'%'}
$('#reader').addEventListener('scroll',rprog,{passive:true});
function closePost(){$('#reader').hidden=true;document.body.style.overflow='';document.title='ne-for.ru — не для всех';if(location.hash.startsWith('#post/'))history.replaceState(null,'','#blog')}
function route(){const m=location.hash.match(/^#post\/(.+)$/);if(m)openPost(decodeURIComponent(m[1]));else if(!$('#reader').hidden&&!location.hash.startsWith('#guide='))closePost()}
addEventListener('hashchange',route);$('#rclose').onclick=closePost;$('#reader').onclick=e=>{if(e.target.id==='reader')closePost()};
addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('#reader').hidden)closePost()});
blogInit();

/* ============ ТЕРМИНАЛ: новые команды ============ */
Object.assign(CMDS,{
  snake:()=>{openArcade('snake');return 'Змейка ждёт →'},
  mine:()=>{openArcade('mine');return 'Сапёр →'},
  call:()=>{openArcade('call');return 'Звонок на линию →'},
  status:()=>{location.hash='status';return 'Проверяю, всё ли упало →'},
  blog:()=>{location.hash='blog';return 'Заметки →'},
  myip:()=>{myip().then(ip=>print(ip?`Твой внешний IP: <span class="p">${h(ip)}</span>`:'<span class="e">ipify не ответил</span>'));return 'Спрашиваю у ipify…'},
  dig:a=>{const [n,t='A']=a.split(/\s+/);if(!n)return 'dig: укажи домен, например dig ne-for.ru MX';
    doh(n,t.toUpperCase()).then(j=>{const ans=j.Answer||[];print(ans.length?ans.map(x=>`${h(x.name)}\t${x.TTL}\tIN\t<span class="c">${RT[x.type]||x.type}</span>\t${h(x.data)}`).join('\n'):`<span class="w">${RCODE[j.Status]||'пусто'}</span>`);print(`;; SERVER: ${j._via} (DoH)`,'m')}).catch(e=>print(h(e.message),'e'));
    return `; &lt;&lt;&gt;&gt; nefsh dig &lt;&lt;&gt;&gt; ${h(n)} ${h(t.toUpperCase())}`},
  nslookup:a=>CMDS.dig(a),
  su:()=>document.body.classList.contains('root')?'<span class="e">Ты уже root. Не наглей.</span>':'<span class="e">su: Authentication failure</span>\n<span class="m">подсказка: ↑↑↓↓←→←→BA</span>',
  history:()=>hist.map((c,i)=>`${String(i+1).padStart(4)}  ${h(c)}`).join('\n')||'пусто',
  uname:()=>'ne-forOS 1.0 nefsh x86_64 GNU/Browser',
  top:()=>'  PID USER   %CPU COMMAND\n    1 root   99.9 chrome (все вкладки)\n   42 buh     0.1 1cv8.exe (висит)\n  666 admin   0.0 coffee',
});

/* ============ ПАСХАЛКИ ============ */
const KON=['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];let kp=0;
addEventListener('keydown',e=>{const k=e.key.length===1?e.key.toLowerCase():e.key;const want=KON[kp];
  if(k===want||(want==='b'&&k==='и')||(want==='a'&&k==='ф')){kp++;if(kp===KON.length){kp=0;const on=document.body.classList.toggle('root');if(on)window.ach?.('root');toast(on?'🔓 root-режим активирован':'root-режим выключен');print(on?'<span class="e"># Добро пожаловать, root. Ничего не трогай.</span>':'<span class="m">$ снова guest</span>')}}
  else kp=k===KON[0]?1:0});
let lc=0;$('.logo').addEventListener('click',()=>{if(++lc===7){lc=0;document.querySelector('h1').animate([{transform:'rotate(0)'},{transform:'rotate(360deg)'}],{duration:900,easing:'ease-in-out'});toast('Не для всех. Но ты — ok.')}});
console.log('%c>_ ne-for.ru','font:800 28px monospace;color:#39ff88;background:#07090a;padding:6px 12px;border-radius:6px');
console.log('%cИщешь баги? Их тут нет. Это фичи.\nПопробуй Konami-код: ↑↑↓↓←→←→BA','color:#7f978a;font:13px monospace');
})();
