/* ne-for.ru — НЕФОР: голографический ассистент сайта (Нейронный Ежедневный Фронт Обслуживания Рабочих). Отдельный полноэкранный режим, основной сайт не трогает.
   Голос: speechSynthesis (ответы) и SpeechRecognition (команды, Chrome/Edge, нужен https). */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const sleep = ms => new Promise(r=>setTimeout(r, reduce?Math.min(ms,60):ms));
const pick = a => a[Math.floor(Math.random()*a.length)];
const norm = s => String(s).toLowerCase().replace(/ё/g,'е').replace(/[.,!?«»"]/g,' ').replace(/\s+/g,' ').trim();

/* ---------- стили ---------- */
const css=`
#hud{--h:#5fe6ff;--h2:#2a8cff;--hd:rgba(95,230,255,.14);--hl:rgba(95,230,255,.32);--hw:#ffb020;--hb:#ff5a72;--hg:#4dffb0;
 position:fixed;inset:0;z-index:9500;background:radial-gradient(ellipse at 50% 42%,#062033 0%,#020b14 55%,#01050a 100%);color:#cfefff;
 font:13px/1.5 var(--mono,ui-monospace,monospace);overflow:auto;overscroll-behavior:contain;opacity:0;transition:opacity .45s}
#hud.on{opacity:1}#hud.off{opacity:0}
#hud *{box-sizing:border-box}
#hud .hd-bg{position:fixed;inset:0;width:100%;height:100%;pointer-events:none}
#hud .hd-sweep{position:fixed;left:0;right:0;height:140px;top:-140px;pointer-events:none;background:linear-gradient(180deg,transparent,rgba(95,230,255,.06) 80%,rgba(95,230,255,.18));animation:hdSweep 7s linear infinite}
@keyframes hdSweep{to{top:100%}}
#hud.shaman{--h:#9dff57;--h2:#b04dff;--hd:rgba(157,255,87,.12);--hl:rgba(157,255,87,.3);background:radial-gradient(ellipse at 50% 42%,#21103a 0%,#0c0716 55%,#040208 100%)}
#hud.shaman #hdG stop:first-child{stop-color:#9dff57}#hud.shaman #hdG stop:nth-child(2){stop-color:#b04dff}#hud.shaman #hdR stop{stop-color:#9dff57}
#hud.shaman .hd-sweep{background:linear-gradient(180deg,transparent,rgba(176,77,255,.07) 80%,rgba(157,255,87,.16))}
#hud.shaman .hd-core .nm b{text-shadow:0 0 18px #9dff57,0 0 40px #b04dff}
#hud.shaman.ready .hd-core .r2{animation-duration:6s}#hud.shaman.ready .hd-core .r4{animation-duration:3.5s}
#hud.shaman .hd-core.talk{animation:hdShake .18s linear infinite}@keyframes hdShake{50%{transform:translate(1px,-1px) rotate(.3deg)}}
@media(prefers-reduced-motion:reduce){#hud.shaman .hd-core.talk{animation:none}}
#hud .hd-top{position:sticky;top:0;z-index:2;display:flex;align-items:center;gap:14px;flex-wrap:wrap;padding:12px max(16px,3vw);border-bottom:1px solid var(--hl);background:rgba(1,8,14,.72);backdrop-filter:blur(8px)}
#hud .hd-brand{font-weight:700;letter-spacing:.32em;color:var(--h);text-shadow:0 0 12px var(--h)}
#hud .hd-sub{color:#6fa7bf;font-size:12px}
#hud .hd-clock{margin-left:auto;color:var(--h);font-variant-numeric:tabular-nums;letter-spacing:.08em}
#hud .hd-b{font:inherit;font-size:12px;color:var(--h);background:transparent;border:1px solid var(--hl);border-radius:4px;padding:6px 11px;cursor:pointer;letter-spacing:.06em;transition:background .2s,box-shadow .2s}
#hud .hd-b:hover,#hud .hd-b:focus-visible{background:var(--hd);box-shadow:0 0 14px -2px var(--h);outline:0}
#hud .hd-b.main{background:var(--hd);padding:10px 16px;font-size:13px}
#hud .hd-b:disabled{opacity:.45;cursor:default;box-shadow:none}
#hud .hd-col{display:grid;gap:22px;min-width:0}
#hud .hd-grid{position:relative;z-index:1;display:grid;align-items:start;grid-template-columns:minmax(0,1fr) minmax(0,1.25fr) minmax(0,1fr);gap:22px;padding:22px max(16px,3vw) 30px;max-width:1500px;margin:0 auto}
@media(max-width:1060px){#hud .hd-grid{grid-template-columns:minmax(0,1fr)}#hud .hd-mid{order:-1}}
#hud .hd-pan{position:relative;border:1px solid var(--hl);background:linear-gradient(180deg,rgba(8,40,60,.5),rgba(2,14,24,.55));padding:16px 16px 18px;clip-path:polygon(0 0,calc(100% - 18px) 0,100% 18px,100% 100%,18px 100%,0 calc(100% - 18px));opacity:0;transform:translateY(14px);transition:opacity .5s,transform .5s}
#hud.ready .hd-pan{opacity:1;transform:none}#hud.ready .hd-dutyp{transition-delay:.1s}#hud.ready .hd-diag{transition-delay:.15s}
#hud .hd-pan h3{margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.3em;text-transform:uppercase;color:var(--h);display:flex;align-items:center;gap:8px}
#hud .hd-pan h3::before{content:"";width:8px;height:8px;background:var(--h);box-shadow:0 0 10px var(--h)}
#hud .hd-pan h3 em{margin-left:auto;font-style:normal;letter-spacing:.05em;color:#6fa7bf;font-weight:400}
#hud .hd-row{display:grid;grid-template-columns:110px minmax(0,1fr);gap:10px;padding:6px 0;border-bottom:1px dashed rgba(95,230,255,.12);align-items:baseline}
#hud .hd-row span{color:#6fa7bf;font-size:12px;text-transform:uppercase;letter-spacing:.08em}
#hud .hd-row b{font-weight:500;color:#e6f8ff;overflow-wrap:anywhere}
#hud .hd-bar{height:3px;background:rgba(95,230,255,.12);margin-top:5px;position:relative;overflow:hidden}
#hud .hd-bar i{position:absolute;inset:0 auto 0 0;background:var(--h);box-shadow:0 0 8px var(--h);transition:width .6s}
#hud .hd-spark{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:14px}
#hud .hd-spark div{border:1px solid rgba(95,230,255,.18);padding:8px 10px}
#hud .hd-spark small{display:flex;justify-content:space-between;color:#6fa7bf;font-size:11px;letter-spacing:.1em;text-transform:uppercase}
#hud .hd-spark small b{color:var(--h);font-weight:600}
#hud .hd-spark canvas{display:block;width:100%;height:46px;margin-top:6px}
#hud .hd-mid{display:flex;flex-direction:column;align-items:center;gap:14px;min-width:0}
#hud .hd-core{color:var(--h);position:relative;width:min(400px,86vw);aspect-ratio:1;cursor:pointer;border:0;background:none;padding:0;color:var(--h)}
#hud .hd-core svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
#hud .hd-core .r{transform-origin:200px 200px;transform-box:view-box}
#hud.ready .hd-core .r1{animation:hdSpin 26s linear infinite}#hud.ready .hd-core .r2{animation:hdSpin 14s linear infinite reverse}
#hud.ready .hd-core .r3{animation:hdSpin 40s linear infinite}#hud.ready .hd-core .r4{animation:hdSpin 8s linear infinite reverse}
#hud.ready .hd-core .rad{animation:hdSpin 4s linear infinite}
@keyframes hdSpin{to{transform:rotate(360deg)}}
#hud .hd-core .boot{transform-origin:200px 200px;transform-box:view-box;transform:scale(.4);opacity:0;transition:transform 1.1s cubic-bezier(.2,.9,.2,1.1),opacity .8s}
#hud.ready .hd-core .boot{transform:none;opacity:1}
#hud .hd-core .glow{transition:r .3s,opacity .3s}
#hud .hd-core.talk .glow{animation:hdPulse .5s ease-in-out infinite alternate}
#hud .hd-core.listen{--h:var(--hw)}
#hud .hd-core.listen .glow{animation:hdPulse 1.1s ease-in-out infinite alternate}
@keyframes hdPulse{from{opacity:.35}to{opacity:.95}}
#hud .hd-core .nm{position:absolute;inset:0;display:grid;place-content:center;text-align:center;pointer-events:none}
#hud .hd-core .nm b{font-size:clamp(20px,4.4vw,30px);letter-spacing:.42em;padding-left:.42em;color:#eafaff;text-shadow:0 0 18px var(--h)}
#hud .hd-core .nm small{color:#7fc4de;letter-spacing:.2em;font-size:11px;text-transform:uppercase;margin-top:2px}
#hud .hd-wave{display:flex;gap:3px;justify-content:center;height:22px;align-items:center;margin-top:10px}
#hud .hd-wave i{width:3px;height:3px;background:var(--h);box-shadow:0 0 6px var(--h);border-radius:2px;transition:height .12s}
#hud .hd-say{min-height:48px;max-width:560px;text-align:center;font-size:15px;color:#eafaff;text-shadow:0 0 10px rgba(95,230,255,.4)}
#hud .hd-say::after{content:"▍";color:var(--h);animation:hdBlink 1s steps(1) infinite;margin-left:2px}
@keyframes hdBlink{50%{opacity:0}}
#hud .hd-in{display:flex;gap:8px;width:100%;max-width:560px}
#hud .hd-in input{flex:1;min-width:0;font:inherit;font-size:14px;color:#eafaff;background:rgba(2,18,30,.8);border:1px solid var(--hl);padding:10px 12px;border-radius:4px;outline:0}
#hud .hd-in input:focus{border-color:var(--h);box-shadow:0 0 16px -4px var(--h)}
#hud .hd-in input::placeholder{color:#4f7f94}
#hud .hd-mic{width:44px;display:grid;place-items:center;padding:0}
#hud .hd-mic svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round}
#hud .hd-mic.on{color:#02101a;background:var(--hw);border-color:var(--hw);box-shadow:0 0 18px var(--hw)}
#hud .hd-chips{display:flex;flex-wrap:wrap;gap:6px;justify-content:center;max-width:560px}
#hud .hd-chips button{font:inherit;font-size:12px;color:#9fd8ee;background:transparent;border:1px dashed rgba(95,230,255,.3);border-radius:20px;padding:4px 10px;cursor:pointer}
#hud .hd-chips button:hover{color:var(--h);border-style:solid}
#hud .hd-log{width:100%;max-width:560px;max-height:190px;overflow:auto;border-top:1px solid rgba(95,230,255,.15);padding-top:8px;font-size:12px;scrollbar-width:thin}
#hud .hd-log p{margin:0 0 4px;color:#8fc3d8}#hud .hd-log p.u{color:#eafaff}#hud .hd-log p.u::before{content:"> ";color:var(--hw)}
#hud .hd-log p.a::before{content:"НЕФОР: ";color:var(--h)}
#hud .hd-log .pw{display:inline-block;margin-top:4px;padding:3px 8px;border:1px solid var(--hl);color:var(--hg);cursor:pointer}
#hud .hd-steps{list-style:none;margin:12px 0 0;padding:0;counter-reset:s}
#hud .hd-steps li{display:grid;grid-template-columns:18px minmax(0,1fr) auto;gap:8px;padding:6px 0;border-bottom:1px dashed rgba(95,230,255,.12);align-items:start;opacity:0;transform:translateX(-8px);transition:opacity .3s,transform .3s}
#hud .hd-steps li.in{opacity:1;transform:none}
#hud .hd-steps li i{font-style:normal;color:var(--h)}#hud .hd-steps li.ok i{color:var(--hg)}#hud .hd-steps li.w i{color:var(--hw)}#hud .hd-steps li.bad i{color:var(--hb)}
#hud .hd-steps li span{min-width:0}#hud .hd-steps li small{display:block;color:#6fa7bf;overflow-wrap:anywhere}
#hud .hd-steps li em{font-style:normal;color:#6fa7bf;font-size:11px}
#hud .hd-steps li.joke small{font-style:italic}
#hud .hd-prog{height:4px;background:rgba(95,230,255,.12);margin-top:12px;position:relative;overflow:hidden}
#hud .hd-prog i{position:absolute;inset:0 auto 0 0;width:0;background:linear-gradient(90deg,var(--h2),var(--h));box-shadow:0 0 10px var(--h);transition:width .35s}
#hud .hd-rep{margin-top:14px;display:none;grid-template-columns:auto minmax(0,1fr);gap:14px;align-items:center;border:1px solid var(--hl);padding:12px;background:rgba(95,230,255,.05)}
#hud .hd-rep.on{display:grid}
#hud .hd-score{width:74px;height:74px;border-radius:50%;display:grid;place-items:center;font-size:24px;font-weight:700;color:#eafaff;background:conic-gradient(var(--c,var(--h)) calc(var(--p,0)*1%),rgba(95,230,255,.1) 0);position:relative}
#hud .hd-score::before{content:"";position:absolute;inset:6px;border-radius:50%;background:#031422}
#hud .hd-score b{position:relative}
#hud .hd-rep p{margin:0;color:#cfefff}
#hud .hd-note{color:#6fa7bf;font-size:12px;margin:10px 0 0}
#hud .hd-lines{position:fixed;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.018) 0 1px,transparent 1px 3px);z-index:3}
#hud .hd-code{margin-top:6px;border:1px solid var(--hl);background:rgba(1,10,18,.85)}
#hud .hd-code div{display:flex;justify-content:space-between;align-items:center;padding:3px 8px;border-bottom:1px solid rgba(95,230,255,.15);font-size:11px;color:#6fa7bf;text-transform:uppercase;letter-spacing:.1em}
#hud .hd-cp{font:inherit;font-size:11px;color:var(--h);background:none;border:1px solid var(--hl);padding:2px 8px;cursor:pointer;text-transform:none;letter-spacing:0}
#hud .hd-cp:hover{background:var(--hd)}
#hud .hd-code pre{margin:0;padding:8px 10px;color:var(--hg);white-space:pre-wrap;overflow-wrap:anywhere;font:inherit;font-size:12px}
#hud .hd-t{margin-top:6px;border-collapse:collapse;width:100%;font-size:12px}
#hud .hd-t th{text-align:left;font-weight:400;color:#6fa7bf;padding:3px 10px 3px 0;white-space:nowrap}#hud .hd-t td{color:#eafaff;padding:3px 0;overflow-wrap:anywhere}
#hud .hd-help{margin-top:8px;display:grid;gap:6px}#hud .hd-help b{color:var(--h);font-weight:600;font-size:11px;letter-spacing:.15em;text-transform:uppercase;margin-top:4px}
#hud .hd-help div,#hud .hd-opts{display:flex;flex-wrap:wrap;gap:5px}#hud .hd-opts{margin-top:6px}
#hud .hd-ex{font:inherit;font-size:12px;color:#cfefff;background:rgba(95,230,255,.06);border:1px solid rgba(95,230,255,.25);border-radius:3px;padding:3px 8px;cursor:pointer;text-align:left}
#hud .hd-ex:hover{border-color:var(--h);color:var(--h)}
#hud .hd-tm{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;margin-top:8px;padding:7px 10px;border:1px solid var(--hl);background:rgba(95,230,255,.05)}
#hud .hd-tm span{overflow-wrap:anywhere}#hud .hd-tm b{color:var(--h);font-variant-numeric:tabular-nums;font-size:15px}#hud .hd-tm.pomo b{color:var(--hw)}
#hud .hd-tm button{font:inherit;background:none;border:0;color:#6fa7bf;cursor:pointer;font-size:16px;line-height:1;padding:2px 4px}#hud .hd-tm button:hover{color:var(--hb)}
#hud .hd-log{max-height:260px}
@media(max-width:560px){#hud .hd-sub{display:none}#hud .hd-top{gap:6px 8px}#hud .hd-top .hd-b{padding:5px 8px;font-size:11px}#hud .hd-clock{font-size:12px}#hud .hd-row{grid-template-columns:92px minmax(0,1fr)}}
@media(prefers-reduced-motion:reduce){#hud .hd-sweep{display:none}#hud .hd-core .r,#hud .hd-core .rad{animation:none!important}}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);

/* ---------- ядро: кольца, метки, радар ---------- */
function ticks(r,n,len,w){let d='';for(let i=0;i<n;i++){const a=i/n*Math.PI*2,l=i%5?len:len*1.9;d+=`M${200+Math.cos(a)*r} ${200+Math.sin(a)*r}L${200+Math.cos(a)*(r-l)} ${200+Math.sin(a)*(r-l)}`}return `<path d="${d}" stroke-width="${w}"/>`}
function arc(r,a0,a1){const p=a=>[200+Math.cos(a*Math.PI/180)*r,200+Math.sin(a*Math.PI/180)*r];const[x0,y0]=p(a0),[x1,y1]=p(a1);return `M${x0} ${y0}A${r} ${r} 0 ${a1-a0>180?1:0} 1 ${x1} ${y1}`}
const CORE=`<svg viewBox="0 0 400 400" aria-hidden="true"><defs>
 <radialGradient id="hdG"><stop offset="0" stop-color="#5fe6ff" stop-opacity=".55"/><stop offset=".55" stop-color="#2a8cff" stop-opacity=".12"/><stop offset="1" stop-color="#2a8cff" stop-opacity="0"/></radialGradient>
 <linearGradient id="hdR" x1="0" x2="1"><stop offset="0" stop-color="#5fe6ff" stop-opacity="0"/><stop offset="1" stop-color="#5fe6ff" stop-opacity=".5"/></linearGradient></defs>
 <g class="boot" fill="none" stroke="currentColor">
  <circle class="glow" cx="200" cy="200" r="120" fill="url(#hdG)" stroke="none" opacity=".6"/>
  <g class="r r3" opacity=".35">${ticks(196,120,5,1)}</g>
  <g class="r r1"><circle cx="200" cy="200" r="178" stroke-opacity=".25"/><path d="${arc(178,-60,40)}" stroke-width="3"/><path d="${arc(178,120,150)}" stroke-width="3"/><path d="${arc(178,200,262)}" stroke-width="1.5" stroke-dasharray="2 5"/></g>
  <g class="r r2"><circle cx="200" cy="200" r="156" stroke-dasharray="1 7" stroke-width="2" stroke-opacity=".7"/><path d="${arc(156,10,95)}" stroke-width="6" stroke-opacity=".55"/><path d="${arc(156,190,215)}" stroke-width="6" stroke-opacity=".55"/></g>
  <g class="r r4"><circle cx="200" cy="200" r="132" stroke-opacity=".3"/><path d="${arc(132,0,60)}" stroke-width="2"/><path d="${arc(132,90,110)}" stroke-width="2"/><path d="${arc(132,180,250)}" stroke-width="2"/><path d="${arc(132,290,320)}" stroke-width="2"/></g>
  <g class="r rad"><path d="M200 200L200 92A108 108 0 0 1 276 124Z" fill="url(#hdR)" stroke="none" opacity=".35"/></g>
  <circle cx="200" cy="200" r="108" stroke-opacity=".5"/><circle cx="200" cy="200" r="84" stroke-opacity=".2" stroke-dasharray="3 3"/>
  <path d="M200 70v14M200 316v14M70 200h14M316 200h14" stroke-width="2"/>
 </g></svg><div class="nm"><b>НЕФОР</b><small id="hd-st">в сети</small><div class="hd-wave" id="hd-wave">${'<i></i>'.repeat(21)}</div></div>`;

/* ---------- разметка ---------- */
const MIC='<svg viewBox="0 0 24 24"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
const SAMPLES=['что умеешь','подсеть 192.168.1.0/26','ошибка 0x80070005','как разблокировать пользователя','таймер на 5 минут','сколько до пятницы','викторина','диагностика'];
const HUD=document.createElement('div');HUD.id='hud';HUD.hidden=true;HUD.setAttribute('role','dialog');HUD.setAttribute('aria-label','Ассистент НЕФОР');
HUD.innerHTML=`<canvas class="hd-bg" id="hd-bg"></canvas><div class="hd-sweep"></div><div class="hd-lines"></div>
<header class="hd-top"><span class="hd-brand">НЕФОР</span><span class="hd-sub">ассистент ne-for.ru · сборка 3.0</span><span class="hd-clock" id="hd-clock"></span>
 <button class="hd-b" id="hd-pers" title="Характер ассистента">вежливый</button><button class="hd-b" id="hd-voice" aria-pressed="true">голос: вкл</button><button class="hd-b" id="hd-x">выход · Esc</button></header>
<main class="hd-grid">
 <div class="hd-col"><section class="hd-pan hd-sys" aria-label="Системы"><h3>Системы <em id="hd-net">онлайн</em></h3><div id="hd-rows"></div>
  <div class="hd-spark"><div><small>пинг до сайта <b id="hd-pv">—</b></small><canvas id="hd-ping"></canvas></div><div><small>кадры/с <b id="hd-fv">—</b></small><canvas id="hd-fps"></canvas></div></div>
  <p class="hd-note">Данные из твоего браузера. Никуда не отправляются.</p></section>
 <section class="hd-pan hd-dutyp" aria-label="Дежурство"><h3>Дежурство <em>таймеры и сроки</em></h3><div id="hd-duty"></div></section></div>
 <section class="hd-mid"><button class="hd-core" id="hd-core" aria-label="Нажми и скажи команду">${CORE}</button>
  <div class="hd-say" id="hd-say" aria-live="polite"></div>
  <form class="hd-in" id="hd-form" autocomplete="off"><button type="button" class="hd-b hd-mic" id="hd-mic" aria-label="Голосовая команда">${MIC}</button><input id="hd-q" placeholder="Скажи или напиши: «подсеть 10.0.0.0/24», «таймер 5 минут»…" aria-label="Команда"><button class="hd-b">→</button></form>
  <div class="hd-chips">${SAMPLES.map(s=>`<button type="button" data-c="${h(s)}">${h(s)}</button>`).join('')}</div>
  <div class="hd-log" id="hd-log" aria-label="Журнал"></div></section>
 <section class="hd-pan hd-diag" aria-label="Диагностика"><h3>Диагностика <em id="hd-dst">ожидание</em></h3>
  <p style="margin:0;color:#9fd8ee">Сканирование компьютера: процессор, память, видеокарта, сеть, питание. Плюс немного эвристики.</p>
  <div style="margin-top:12px"><button class="hd-b main" id="hd-scan">Запустить сканирование</button></div>
  <div class="hd-prog"><i id="hd-prog"></i></div><ol class="hd-steps" id="hd-steps"></ol>
  <div class="hd-rep" id="hd-rep"><div class="hd-score" id="hd-score"><b>0</b></div><p id="hd-verd"></p></div></section>
</main>`;
document.body.append(HUD);
const $h=s=>HUD.querySelector(s);
const coreEl=$h('#hd-core'),sayEl=$h('#hd-say'),logEl=$h('#hd-log'),inp=$h('#hd-q'),micB=$h('#hd-mic'),voiceB=$h('#hd-voice');

/* ---------- датчики ---------- */
const nav=navigator,con=nav.connection||{};
function browser(){const u=nav.userAgent;const b=/YaBrowser\/([\d]+)/.exec(u)?['Яндекс Браузер',RegExp.$1]:/Edg\/([\d]+)/.exec(u)?['Edge',RegExp.$1]:/OPR\/([\d]+)/.exec(u)?['Opera',RegExp.$1]:/Firefox\/([\d]+)/.exec(u)?['Firefox',RegExp.$1]:/Chrome\/([\d]+)/.exec(u)?['Chrome',RegExp.$1]:/Version\/([\d]+).*Safari/.exec(u)?['Safari',RegExp.$1]:['Неизвестный браузер',''];
  const os=/Windows NT 10/.test(u)?'Windows 10/11':/Windows/.test(u)?'Windows':/iPhone|iPad/.test(u)?'iOS':/Android ([\d.]+)/.test(u)?'Android '+RegExp.$1:/Mac OS X/.test(u)?'macOS':/Linux/.test(u)?'Linux':'неизвестная ОС';
  return {b:b[0],v:b[1],os,mobile:/Mobi|Android|iPhone/.test(u)}}
function gpu(){try{const gl=document.createElement('canvas').getContext('webgl');if(!gl)return null;const e=gl.getExtension('WEBGL_debug_renderer_info');let r=e?gl.getParameter(e.UNMASKED_RENDERER_WEBGL):gl.getParameter(gl.RENDERER);
  r=String(r);if(/^ANGLE \(/.test(r)){const q=r.replace(/^ANGLE \(/,'').replace(/\)$/,'').split(', ');r=q[1]||q[0]}r=r.replace(/\s*\(0x[0-9a-f]+\)/ig,'').replace(/\s*Direct3D.*$/,'').replace(/\s*vs_\d.*$/,'');return String(r).replace(/\s*\(TM\)|\s*\(R\)/g,'').replace(/\s+/g,' ').trim()}catch(e){return null}}
const B=browser(),GPU=gpu();let batt=null;nav.getBattery?.().then(b=>{batt=b}).catch(()=>{});
const t0=performance.now(),ping=[],fps=[];let lastPing=null;
function fmtT(ms){const s=Math.floor(ms/1000),m=Math.floor(s/60);return m?`${m} мин ${s%60} с`:`${s} с`}
function rows(){const L=[
  ['Система',`${B.os}`],['Браузер',`${B.b} ${B.v}`],
  ['Экран',`${screen.width}×${screen.height} · ×${(devicePixelRatio||1).toFixed(2).replace(/\.?0+$/,'')}`],
  ['Процессор',nav.hardwareConcurrency?`${nav.hardwareConcurrency} потоков`:'скрыто',Math.min(100,(nav.hardwareConcurrency||4)/16*100)],
  ['Память',nav.deviceMemory?`от ${nav.deviceMemory} ГБ`:'браузер не говорит',nav.deviceMemory?Math.min(100,nav.deviceMemory/8*100):null],
  ['Видеокарта',GPU||'скрыто браузером'],
  ['Сеть',con.effectiveType?`${con.effectiveType.toUpperCase()}${con.downlink?` · ~${con.downlink} Мбит/с`:''}${con.rtt?` · rtt ${con.rtt} мс`:''}`:(nav.onLine?'подключено':'нет сети')],
  ['Питание',batt?`${Math.round(batt.level*100)}%${batt.charging?' · заряжается':' · от батареи'}`:'от сети (скорее всего)',batt?batt.level*100:null],
  ['Часовой пояс',Intl.DateTimeFormat().resolvedOptions().timeZone||'—'],
  ['На сайте',fmtT(performance.now())],['Сеанс НЕФОРа',fmtT(performance.now()-t0)]];
  $h('#hd-rows').innerHTML=L.map(([k,v,p])=>`<div class="hd-row"><span>${k}</span><b>${h(v)}${p!=null?`<div class="hd-bar"><i style="width:${p}%"></i></div>`:''}</b></div>`).join('');
  $h('#hd-net').textContent=nav.onLine?'онлайн':'офлайн'}
function spark(cv,arr,max,col){const r=devicePixelRatio||1,w=cv.clientWidth,ht=cv.clientHeight;if(!w)return;cv.width=w*r;cv.height=ht*r;const c=cv.getContext('2d');c.scale(r,r);
  c.strokeStyle='rgba(95,230,255,.12)';c.lineWidth=1;for(let i=1;i<3;i++){c.beginPath();c.moveTo(0,ht*i/3);c.lineTo(w,ht*i/3);c.stroke()}
  if(arr.length<2)return;const n=40,step=w/(n-1),y=v=>ht-2-Math.min(1,v/max)*(ht-6);c.beginPath();arr.forEach((v,i)=>{const x=(n-arr.length+i)*step;i?c.lineTo(x,y(v)):c.moveTo(x,y(v))});
  c.strokeStyle=col;c.lineWidth=1.6;c.shadowColor=col;c.shadowBlur=6;c.stroke();c.shadowBlur=0;c.lineTo(w,ht);c.lineTo((n-arr.length)*step,ht);c.closePath();c.fillStyle='rgba(95,230,255,.08)';c.fill()}
async function measurePing(){const t=performance.now();try{await fetch('posts/index.json?p='+Date.now(),{cache:'no-store'});lastPing=Math.round(performance.now()-t)}catch(e){lastPing=null}
  if(lastPing!=null){ping.push(lastPing);if(ping.length>40)ping.shift()}$h('#hd-pv').textContent=lastPing!=null?lastPing+' мс':'нет связи';spark($h('#hd-ping'),ping,Math.max(120,...ping),'#5fe6ff');return lastPing}
let frames=0,fLast=performance.now(),raf=0,curFps=0;
function loop(t){frames++;if(t-fLast>=1000){curFps=Math.round(frames*1000/(t-fLast));frames=0;fLast=t;fps.push(curFps);if(fps.length>40)fps.shift();$h('#hd-fv').textContent=curFps;spark($h('#hd-fps'),fps,Math.max(60,...fps),'#4dffb0')}wave();raf=requestAnimationFrame(loop)}
/* волна у ядра: живая, когда говорит или слушает */
let talking=false,listening=false;const bars=[...HUD.querySelectorAll('#hd-wave i')];
function wave(){const on=talking||listening,t=performance.now()/1000;bars.forEach((b,i)=>{const d=Math.abs(i-10);const v=on?(3+Math.abs(Math.sin(t*(talking?9:4)+i*1.7))*(18-d*1.2)*(0.55+Math.random()*.45)):3;b.style.height=Math.max(3,v)+'px'})}

/* фон: сетка точек и шестиугольники */
function bg(){const cv=$h('#hd-bg'),r=devicePixelRatio||1,w=innerWidth,ht=innerHeight;cv.width=w*r;cv.height=ht*r;const c=cv.getContext('2d');c.scale(r,r);
  for(let x=0;x<w;x+=28)for(let y=0;y<ht;y+=28){c.fillStyle=`rgba(95,230,255,${(x/28+y/28)%7?0.06:0.16})`;c.fillRect(x,y,1.2,1.2)}
  c.strokeStyle='rgba(95,230,255,.05)';const hx=(cx,cy,s)=>{c.beginPath();for(let i=0;i<6;i++){const a=Math.PI/3*i+Math.PI/6;c[i?'lineTo':'moveTo'](cx+s*Math.cos(a),cy+s*Math.sin(a))}c.closePath();c.stroke()};
  for(let i=0;i<14;i++)hx(Math.random()*w,Math.random()*ht,20+Math.random()*50)}

/* ---------- голос ---------- */
let voiceOn=store.get('nefor-hud-voice',true),voice=null;
const synth=window.speechSynthesis;
const ruVoices=()=>synth?synth.getVoices().filter(x=>/^ru/i.test(x.lang)):[];const MALE=/Dmitry|Pavel|Maxim|Yuri|Дмитрий|Павел|Максим|male|мужск/i;
function pickVoice(){if(!synth)return;const v=ruVoices(),saved=store.get('nefor-hud-vname','');voice=(saved&&v.find(x=>x.name===saved))||v.find(x=>/Google/i.test(x.name))||v.find(x=>/Dmitry|Pavel|Microsoft/i.test(x.name))||v[0]||null}
if(synth){pickVoice();synth.onvoiceschanged=pickVoice}
function setVoiceBtn(){voiceB.textContent='голос: '+(voiceOn?'вкл':'выкл');voiceB.setAttribute('aria-pressed',voiceOn)}
let sayTok=0;
function say(text,extra,spoken){const tok=++sayTok;sayEl.textContent='';const lp=document.createElement('p');lp.className='a';lp.textContent=text;if(extra)lp.insertAdjacentHTML('beforeend',extra);logEl.append(lp);logEl.scrollTop=1e6;
  let i=0;const typ=()=>{if(tok!==sayTok)return;sayEl.textContent=text.slice(0,i+=2);if(i<text.length)setTimeout(typ,reduce?0:18)};typ();
  const talkOn=()=>{talking=true;coreEl.classList.add('talk');if(voiceOn&&voice)window.nfMusic?.duck(true)},talkOff=()=>{if(tok!==sayTok)return;talking=false;coreEl.classList.remove('talk');window.nfMusic?.duck(false)};
  if(voiceOn&&synth&&voice){synth.cancel();stopDrums();const sh=persona==='shaman';const u=new SpeechSynthesisUtterance((spoken||text).replace(/[«»]/g,''));u.voice=voice;u.lang=voice.lang;u.rate=persona==='grumpy'?.98:1.05;u.pitch=persona==='grumpy'?.7:.9;
    u.onstart=talkOn;u.onend=u.onerror=()=>{stopDrums();talkOff()};if(sh){shamanFx();setTimeout(()=>{if(tok===sayTok)synth.speak(u)},380)}else synth.speak(u);setTimeout(()=>{if(tok===sayTok)stopDrums();talkOff()},Math.max(3500,(spoken||text).length*125))}
  else{talkOn();if(voiceOn&&persona==='shaman')shamanFx();setTimeout(talkOff,Math.min(4000,600+text.length*40))}}
function userLine(t){const p=document.createElement('p');p.className='u';p.textContent=t;logEl.append(p);logEl.scrollTop=1e6}

/* распознавание речи */
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;let rec=null;
function micInit(){if(!SR){micB.disabled=true;micB.title='Голосовые команды есть в Chrome и Edge';return}
  if(!isSecureContext){micB.title='Браузер даёт микрофон только сайтам на https'}
  micB.onclick=()=>listening?rec?.stop():listen()}
function listen(){if(!SR)return;if(!isSecureContext){say('Микрофон браузер даёт только сайтам на https. Как только владелец включит сертификат, я вас услышу. Пока пишите текстом.');return}
  synth?.cancel();rec=new SR();rec.lang='ru-RU';rec.interimResults=true;rec.maxAlternatives=1;let fin='';
  rec.onstart=()=>{listening=true;coreEl.classList.add('listen');micB.classList.add('on');$h('#hd-st').textContent='слушаю…'};
  rec.onresult=e=>{let t='';for(const r of e.results){t+=r[0].transcript;if(r.isFinal)fin=t}inp.value=t};
  rec.onerror=e=>{if(e.error==='not-allowed'||e.error==='service-not-allowed')say('Нет доступа к микрофону. Разрешите его в настройках сайта в браузере.');else if(e.error==='no-speech')say('Ничего не услышал. Попробуйте ещё раз.')};
  rec.onend=()=>{listening=false;coreEl.classList.remove('listen');micB.classList.remove('on');$h('#hd-st').textContent=persona==='shaman'?'духи в сети':'в сети';if(fin){inp.value='';window.ach?.('voice');handle(fin)}};
  try{rec.start()}catch(e){}}

/* ---------- команды ---------- */
const KB=()=>window.NEFOR_KB||{PORTS:[],HTTP:{},WIN:{},EVENTS:{},HOWTO:[],QUIZ:[]};
const kbReady=(window.need?window.need('hud-kb'):Promise.resolve()).catch(()=>{});
const VIEWS=[[/игр|поигра|змейк|сапер/,'games','Игры'],[/тулз|инструмент|утилит|калькулятор/,'tools','Тулзы'],[/блог|заметк|стат[ьи]|кейс|проект/,'blog','Блог'],[/софт|программ|приложен/,'soft','Софт'],
  [/генератор|конфигуратор|скрипт/,'gen','Генераторы'],[/симулятор|тренаж|серверн|обжим/,'sims','Симуляторы'],[/для всех|тест|фишинг/,'fun','Для всех'],[/профил|ачивк|достижен/,'me','Профиль'],[/главн|домой|начал/,'home','Главная']];
function greet(){const hr=new Date().getHours();return hr<5?'Доброй ночи':hr<12?'Доброе утро':hr<18?'Добрый день':'Добрый вечер'}
function genPw(n=16){const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*-_=+';const r=new Uint32Array(n);crypto.getRandomValues(r);return [...r].map(x=>a[x%a.length]).join('')}
function statusText(){const p=[`${B.os}, ${B.b} ${B.v}`];if(nav.hardwareConcurrency)p.push(`${nav.hardwareConcurrency} потоков процессора`);if(nav.deviceMemory)p.push(`памяти не меньше ${nav.deviceMemory} гигабайт`);
  if(lastPing!=null)p.push(`пинг до сайта ${lastPing} миллисекунд`);if(curFps)p.push(`${curFps} кадров в секунду`);if(batt)p.push(`батарея ${Math.round(batt.level*100)} процентов`);return 'Сводка: '+p.join(', ')+'.'}
function go(fn,msg){say(msg);setTimeout(()=>{off().then(fn)},900)}
const esc1=s=>h(s).replace(/"/g,'&quot;');
const chip=c=>`<button type="button" class="hd-ex" data-c="${esc1(c)}">${h(c)}</button>`;
const codeBox=(c,lang)=>`<div class="hd-code"><div><span>${h(lang||'')}</span><button type="button" class="hd-cp" data-copy="${esc1(c)}">копировать</button></div><pre>${h(c)}</pre></div>`;
const tbl=rows=>`<table class="hd-t">${rows.map(([k,v])=>`<tr><th>${h(k)}</th><td>${h(v)}</td></tr>`).join('')}</table>`;
const plural=(n,a,b,c)=>{n=Math.abs(n)%100;const m=n%10;return n>10&&n<20?c:m>1&&m<5?b:m===1?a:c};

/* характер и имя */
let persona=store.get('nefor-hud-persona','polite'),uname=store.get('nefor-hud-name','');
const GRUMP=['Опять вы. Ладно.','Вздыхаю, но делаю.','Это можно было загуглить, но держите.','Без заявки вообще-то не положено. Ладно.','Отвлекаете от важного: я смотрел на логи.','Так и быть.'];
const SH_PRE=['Хе-хе-хе!','Духи сети шепчут:','Кости брошены.','Шаман видит.','О-хо-хо!','Бубен говорит:'],SH_POST=['Хе-хе.','Так сказали духи.','Не гневи провайдера.','Ха-ха-ха!'];
function reply(text,extra,spoken){if(persona==='grumpy'&&Math.random()<.45)text=pick(GRUMP)+' '+text;
  else if(persona==='shaman'){if(Math.random()<.55)text=pick(SH_PRE)+' '+text;if(Math.random()<.3)text+=' '+pick(SH_POST);if(spoken)spoken=text.split('.')[0]+'. '+spoken}say(text,extra,spoken)}
const PERS={polite:'вежливый',grumpy:'ворчун',shaman:'шаман'},PNEXT={polite:'grumpy',grumpy:'shaman',shaman:'polite'};
function setPersonaBtn(){const b=$h('#hd-pers');if(b){b.textContent=PERS[persona]||'вежливый';b.title='Характер ассистента. Нажми, чтобы сменить'}HUD.classList.toggle('shaman',persona==='shaman');const st=$h('#hd-st');if(st&&!listening)st.textContent=persona==='shaman'?'духи в сети':'в сети'}
function setPersona(p){persona=p;store.set('nefor-hud-persona',p);setPersonaBtn();if(p==='shaman')window.ach?.('shaman');
  say(p==='grumpy'?'Режим ворчуна. Работать буду, но молча осуждая. Вслух тоже.':p==='shaman'?'Хе-хе-хе! Шаман НЕФОР пришёл. Бью в бубен, изгоняю баги, задабриваю духов DNS. Спрашивай.':'Вежливый режим. Чем могу помочь?')}
/* звуки шамана: бубен и трещотка, синтез через Web Audio */
let drumT=0;function aud(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();return actx}catch(e){return null}}
function drum(t,vol=.5){const a=aud();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type='sine';o.frequency.setValueAtTime(120,t);o.frequency.exponentialRampToValueAtTime(42,t+.28);
  g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(vol,t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+.35);o.connect(g);g.connect(a.destination);o.start(t);o.stop(t+.4)}
function rattle(t,vol=.12){const a=aud();if(!a)return;const n=Math.floor(a.sampleRate*.12),buf=a.createBuffer(1,n,a.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/n,2)*(i%900<450?1:.3);
  const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();s.buffer=buf;f.type='bandpass';f.frequency.value=3800;f.Q.value=1.2;g.gain.value=vol;s.connect(f);f.connect(g);g.connect(a.destination);s.start(t)}
function shamanFx(){const a=aud();if(!a)return;const t=a.currentTime+.02;drum(t);drum(t+.17,.35);rattle(t+.3);drum(t+.42,.45)}
function startDrums(){stopDrums();let k=0;drumT=setInterval(()=>{const a=aud();if(!a)return;const t=a.currentTime;drum(t,k%4===0?.2:.11);if(k%2)rattle(t+.13,.05);k++},430)}
function stopDrums(){if(drumT){clearInterval(drumT);drumT=0}}

/* ----- утилиты ----- */
const ip2n=s=>{const p=s.split('.').map(Number);if(p.length!==4||p.some(x=>!(x>=0&&x<=255)))return null;return((p[0]<<24)>>>0)+(p[1]<<16)+(p[2]<<8)+p[3]};
const n2ip=n=>[n>>>24,(n>>>16)&255,(n>>>8)&255,n&255].join('.');
function subnet(q){let m=/(\d{1,3}(?:\.\d{1,3}){3})\s*\/\s*(\d{1,2})\b/.exec(q),ip,pre;
  if(m){ip=ip2n(m[1]);pre=+m[2]}else{m=/(\d{1,3}(?:\.\d{1,3}){3})\s+(?:маск\S*\s+)?(255(?:\.\d{1,3}){3})/.exec(q);if(!m)return false;ip=ip2n(m[1]);const mk=ip2n(m[2]);if(mk==null)return false;pre=mk.toString(2).replace(/0+$/,'').length}
  if(ip==null||pre>32)return false;const mask=pre?(0xFFFFFFFF<<(32-pre))>>>0:0,net=(ip&mask)>>>0,bc=(net|~mask)>>>0,hosts=pre>=31?(pre===31?2:1):bc-net-1;
  const first=pre>=31?net:net+1,last=pre>=31?bc:bc-1;
  reply(`Подсеть ${n2ip(net)}/${pre}: ${hosts} ${plural(hosts,'адрес','адреса','адресов')} для хостов, маска ${n2ip(mask)}.`,tbl([['Сеть',`${n2ip(net)}/${pre}`],['Маска',n2ip(mask)],['Wildcard',n2ip(~mask>>>0)],['Хосты',`${n2ip(first)} — ${n2ip(last)}`],['Broadcast',n2ip(bc)],['Всего хостов',hosts]]));return true}
async function myIp(){reply('Спрашиваю у внешнего сервиса…');try{const r=await fetch('https://api.ipify.org?format=json');const j=await r.json();say(`Ваш внешний IP: ${j.ip}.`,`<br>${codeBox(j.ip,'IP')}`,'Ваш внешний IP на экране.')}catch(e){say('Сервис определения IP не ответил. Возможно, его режет блокировщик рекламы.')}}
async function dns(q){const qq=q.replace(/\s+точка\s+/g,'.');const d=/([a-z0-9а-я-]+(?:\.[a-z0-9а-я-]+)+)/i.exec(qq.replace(/^\S*(dns|днс)\S*\s*/,''));if(!d||/^\d+(\.\d+)+$/.test(d[1]))return false;
  const type=/\bmx\b|почт/.test(q)?'MX':/\btxt\b|spf/.test(q)?'TXT':/\bns\b/.test(q)?'NS':/aaaa|ipv6/.test(q)?'AAAA':/cname/.test(q)?'CNAME':'A';const name=d[1].replace(/\.$/,'');
  reply(`Смотрю ${type}-записи ${name}…`);const urls=[`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`,`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`];
  for(const u of urls){try{const r=await fetch(u,{headers:{accept:'application/dns-json'}});const j=await r.json();const a=(j.Answer||[]).map(x=>x.data);
    if(!a.length)return say(`У ${name} нет ${type}-записей.`),true;return say(`${type}-записи ${name}: ${a.length} шт.`,codeBox(a.join('\n'),type),`Нашёл ${a.length} ${plural(a.length,'запись','записи','записей')}.`),true}catch(e){}}
  say('DNS-сервисы не ответили. Попробуйте позже.');return true}
function portInfo(q){const P=KB().PORTS;let m=/(?:порт\S*|port)\s*(\d{1,5})\b|^(\d{2,5})(?:\s*порт\S*)?$|(\d{2,5})\s*порт/.exec(q);
  if(m){const n=+(m[1]||m[2]||m[3]);const f=P.filter(p=>p[0]===n);if(!f.length)return reply(`Порт ${n} не помню. Это не значит, что он безопасен.`),true;
    return reply(f.map(p=>`Порт ${p[0]}/${p[1]}: ${p[2]}, ${p[3]}.`).join(' ')),true}
  m=/как(ой|ие) порт\S* (?:у |для |в |использует |слушает )?(.+)/.exec(q);if(m){const w=m[2].replace(/[?]/g,'').trim();const f=P.filter(p=>norm(p[2]).includes(w)||w.includes(norm(p[2]))||norm(p[3]).includes(w));
    if(!f.length)return reply(`Не знаю, какой порт у «${w}».`),true;return reply(f.slice(0,4).map(p=>`${p[2]}: ${p[0]}/${p[1]}`).join(', ')+'.'),true}
  return false}
function errCode(q,raw){const K=KB();let m=/0x[0-9a-f]{8}/i.exec(raw);if(m){const c=m[0].toLowerCase(),e=K.WIN[c];
    return reply(e?`${c}: ${e[0]}. ${e[1]}`:`Код ${c} в моей базе не нашёл. Загуглите его вместе с названием программы.`),true}
  m=/(?:ошибк\S*|код\S*|error|err|http)\s*(?:№|номер)?\s*(\d{1,4})\b/.exec(q);if(!m)return false;const n=m[1];
  const http=K.HTTP[n],win=K.WIN[n],preferHttp=/http|сайт|nginx|апач|apache|браузер|веб/.test(q)||!win;
  if(http&&preferHttp)return reply(`HTTP ${n}: ${http}.`),true;if(win)return reply(`Системная ошибка Windows ${n}: ${win[0]}.${win[1]?' '+win[1]:''}`),true;
  return reply(`Код ${n} в моей базе не нашёл.`),true}
function eventId(q){const m=/(?:event|ивент|эвент|событи\S*|event id|id)\s*(?:id\s*)?(\d{2,4})\b/.exec(q);if(!m)return false;const e=KB().EVENTS[m[1]];
  return reply(e?`Event ID ${m[1]}: ${e}.`:`Событие ${m[1]} в моей базе не нашёл.`),true}
const CRF=['минута','час','день месяца','месяц','день недели'],DOW=['воскресенье','понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
function cronPart(v,i){if(v==='*')return null;let m=/^\*\/(\d+)$/.exec(v);if(m)return ['каждую '+m[1]+'-ю минуту','каждый '+m[1]+'-й час','каждый '+m[1]+'-й день','каждый '+m[1]+'-й месяц','каждый '+m[1]+'-й день недели'][i];
  const name=x=>i===4?DOW[+x]||x:x;if(/^\d+-\d+$/.test(v)){const[a,b]=v.split('-');return i===1?`с ${a}:00 до ${b}:59`:`${CRF[i]} с ${name(a)} по ${name(b)}`}return `${CRF[i]}: ${v.split(',').map(name).join(', ')}`}
function cron(raw){if(!/cron|крон|\*/.test(raw))return false;const m=/((?:[\d*\/,-]+\s+){4}[\d*\/,-]+)/.exec(raw);if(!m)return false;const f=m[1].trim().split(/\s+/);let s;
  if(/^\d+$/.test(f[0])&&/^\d+$/.test(f[1]))s=`В ${f[1].padStart(2,'0')}:${f[0].padStart(2,'0')}`;else s=[cronPart(f[0],0)||'каждую минуту',cronPart(f[1],1)].filter(Boolean).join(', ');
  const rest=[2,3,4].map(i=>cronPart(f[i],i)).filter(Boolean);if(f[4]==='1-5')rest.splice(rest.findIndex(x=>x.startsWith('день недели')),1,'по будням');
  const out=`${s}${rest.length?', '+rest.join(', '):', каждый день'}.`;reply(out[0].toUpperCase()+out.slice(1),codeBox(f.join(' '),'cron'));return true}
const b64e=s=>btoa(String.fromCharCode(...new TextEncoder().encode(s))),b64d=s=>new TextDecoder().decode(Uint8Array.from(atob(s.trim()),c=>c.charCodeAt(0)));
function base64(raw,q){if(!/base ?64|бейс ?64|base64/.test(q))return false;const t=raw.replace(/^.*?(base ?64|бейс ?64)\s*:?\s*/i,'').replace(/^(закодир\S*|раскодир\S*|декодир\S*|encode|decode)\s*/i,'').trim();
  const dec=/раскод|декод|decode/.test(q);if(!t)return reply('Напишите текст после команды, например: base64 привет.'),true;
  try{const r=dec?b64d(t):b64e(t);reply(dec?'Раскодировал.':'Закодировал.',codeBox(r,'base64'))}catch(e){reply('Это не похоже на корректный base64.')}return true}
async function hashCmd(raw,q){const m=/\b(md5|sha-?1|sha-?256|sha-?512)\b\s*:?\s*(.+)/i.exec(raw);if(!m)return false;const alg=m[1].toLowerCase().replace('-',''),t=m[2];
  if(alg==='md5'){if(!window.md5)await window.need?.('md5').catch(()=>{});return window.md5?(reply('MD5 готов.',codeBox(window.md5(t),'md5')),true):(reply('Модуль MD5 не загрузился.'),true)}
  if(!crypto.subtle)return reply('SHA браузер считает только на https. Пока доступен MD5.'),true;
  const d=await crypto.subtle.digest({sha1:'SHA-1',sha256:'SHA-256',sha512:'SHA-512'}[alg],new TextEncoder().encode(t));reply(alg.toUpperCase()+' готов.',codeBox([...new Uint8Array(d)].map(x=>x.toString(16).padStart(2,'0')).join(''),alg));return true}
function uuid(){const r=crypto.getRandomValues(new Uint8Array(16));r[6]=r[6]&15|64;r[8]=r[8]&63|128;const x=[...r].map(b=>b.toString(16).padStart(2,'0')).join('');return `${x.slice(0,8)}-${x.slice(8,12)}-${x.slice(12,16)}-${x.slice(16,20)}-${x.slice(20)}`}
function chmod(q){const m=/chmod\s*([0-7]{3,4})/.exec(q);if(!m)return false;const d=m[1].slice(-3),rwx=c=>['---','--x','-w-','-wx','r--','r-x','rw-','rwx'][+c];
  const who=['владелец','группа','остальные'],can=c=>{const s=[];if(c&4)s.push('чтение');if(c&2)s.push('запись');if(c&1)s.push('запуск');return s.join(', ')||'ничего'};
  reply(`chmod ${m[1]}: ${[...d].map((c,i)=>`${who[i]} — ${can(+c)}`).join('; ')}.`,codeBox([...d].map(rwx).join(''),'rwx'));return true}
function unix(q){if(!/unix|юникс|timestamp|таймстамп|эпох/.test(q))return false;const m=/(\d{9,13})/.exec(q);
  if(!m){const n=Math.floor(Date.now()/1000);return reply(`Сейчас unix time ${n}.`,codeBox(String(n),'unix')),true}
  let n=+m[1];if(m[1].length>10)n=Math.floor(n/1000);return reply(`${n} — это ${new Date(n*1000).toLocaleString('ru-RU')}.`),true}
const UN={тб:8e6,tb:8e6,гб:8e3,gb:8e3,мб:8,mb:8,гиг:8e3};
function speed(q){let m=/(\d+(?:[.,]\d+)?)\s*(тб|гб|мб|tb|gb|mb|гиг\S*)(?=[^а-яa-z]|$).*?(\d+(?:[.,]\d+)?)\s*(гбит|мбит|gbit|mbit|мегабит|гигабит)/.exec(q);
  if(m){const size=parseFloat(m[1].replace(',','.'))*UN[m[2].slice(0,3).replace(/гиг.*/,'гиг')]||0,sp=parseFloat(m[3].replace(',','.'))*(/^(г|g)/.test(m[4])?1000:1);const s=size/sp/0.9;
    const t=s<60?`${Math.ceil(s)} с`:s<3600?`${Math.round(s/60)} мин`:`${Math.floor(s/3600)} ч ${Math.round(s%3600/60)} мин`;return reply(`Примерно ${t}, если канал загружен на 90%. В реальности дольше, потому что кто-то обязательно смотрит видео.`),true}
  m=/(\d+(?:[.,]\d+)?)\s*(мбит|гбит|мегабит|гигабит)/.exec(q);if(m&&/мегабайт|мбайт|мб\/с|в байт|сколько/.test(q)){const v=parseFloat(m[1].replace(',','.'))*(/г/.test(m[2][0])?1000:1);return reply(`${m[1]} ${m[2]} — это около ${(v/8).toFixed(v/8<100?1:0).replace('.0','')} мегабайт в секунду.`),true}
  return false}

/* ----- справочник: готовые команды ----- */
const stem=w=>w.length>5?w.slice(0,5):w;
function howto(q,force){const words=q.split(' ').filter(w=>w.length>2&&!/^(как|мне|для|это|что|где|покажи|команд\S*|напиши|сделать|через|на|в)$/.test(w)).map(stem);if(!words.length)return false;
  let best=null,bs=0;for(const e of KB().HOWTO){const k=e[0].split(' ').map(stem);let s=0;for(const w of words)if(k.some(x=>x.startsWith(w)||w.startsWith(x)))s++;if(s>bs){bs=s;best=e}}
  if(!best||bs<(force?1:2)||(force&&bs<Math.min(2,words.length)))return false;reply(`${best[1]}. Скопировать можно кнопкой.`,codeBox(best[3],best[2]),best[1]+'. Команда на экране.');return true}

/* ----- дежурство: таймеры, помодоро, сроки ----- */
const NUMW={одну:1,один:1,одна:1,две:2,два:2,три:3,четыре:4,пять:5,шесть:6,семь:7,восемь:8,девять:9,десять:10,пятнадцать:15,двадцать:20,тридцать:30,сорок:40,пятьдесят:50};
function dur(q){let s=0,hit=false;q=q.replace(/полчаса/g,'30 минут').replace(/полтора часа/g,'90 минут').replace(/(через|на) час(?=\s|$)/g,'$1 1 час').replace(/(через|на) минуту(?=\s|$)/g,'$1 1 минуту');
  for(const w in NUMW)q=q.replace(new RegExp('(^|\\s)'+w+'(?=\\s)','g'),'$1'+NUMW[w]);
  const re=/(\d+(?:[.,]\d+)?)\s*(сек\S*|с(?=\s|$)|мин\S*|м(?=\s|$)|час\S*|ч(?=\s|$))/g;let m;while((m=re.exec(q))){hit=true;const v=parseFloat(m[1].replace(',','.'));s+=/^с/.test(m[2])?v:/^м/.test(m[2])?v*60:v*3600}
  return hit?{s,q}:null}
let TM=store.get('nefor-hud-timers',[]),pomo=store.get('nefor-hud-pomo',null),tmTick=0;
const saveTm=()=>{store.set('nefor-hud-timers',TM);store.set('nefor-hud-pomo',pomo)};
function fmtLeft(ms){const s=Math.max(0,Math.round(ms/1000)),hh=Math.floor(s/3600),mm=Math.floor(s%3600/60),ss=s%60;return hh?`${hh}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`:`${mm}:${String(ss).padStart(2,'0')}`}
function fmtDur(s){s=Math.round(s);const hh=Math.floor(s/3600),mm=Math.floor(s%3600/60),ss=s%60;return [hh&&`${hh} ${plural(hh,'час','часа','часов')}`,mm&&`${mm} ${plural(mm,'минуту','минуты','минут')}`,ss&&!hh&&`${ss} ${plural(ss,'секунду','секунды','секунд')}`].filter(Boolean).join(' ')||'0 секунд'}
let actx=null;function beep(){try{actx=actx||new (window.AudioContext||window.webkitAudioContext)();const t=actx.currentTime;[0,.25,.5].forEach(d=>{const o=actx.createOscillator(),g=actx.createGain();o.frequency.value=880;o.connect(g);g.connect(actx.destination);g.gain.setValueAtTime(.0001,t+d);g.gain.exponentialRampToValueAtTime(.25,t+d+.02);g.gain.exponentialRampToValueAtTime(.0001,t+d+.2);o.start(t+d);o.stop(t+d+.22)})}catch(e){}}
function alarm(text){beep();if(!HUD.hidden)say(text);else{typeof toast==='function'&&toast('НЕФОР: '+text);if(voiceOn&&synth&&voice){const u=new SpeechSynthesisUtterance(text);u.voice=voice;u.lang=voice.lang;synth.speak(u)}}
  try{if(window.Notification&&Notification.permission==='granted'&&document.hidden)new Notification('НЕФОР',{body:text})}catch(e){}}
function addTimer(sec,label){const t={id:Date.now()+Math.random(),end:Date.now()+sec*1000,label};TM.push(t);saveTm();ensureTick();drawDuty();try{window.Notification?.permission==='default'&&Notification.requestPermission()}catch(e){}return t}
function tickTimers(){const now=Date.now();let ch=false;TM=TM.filter(t=>{if(t.end<=now){ch=true;alarm(t.label?`Напоминаю: ${t.label}.`:'Время вышло! Таймер сработал.');return false}return true});
  if(pomo&&pomo.end<=now){ch=true;const work=pomo.phase==='work';pomo.phase=work?'break':'work';if(work)pomo.n++;pomo.end=now+(work?(pomo.n%4===0?15:5):25)*60000;
    alarm(work?`Помодоро ${pomo.n} готов. Перерыв ${pomo.n%4===0?15:5} минут: встаньте и отойдите от монитора.`:'Перерыв окончен. Следующие 25 минут — только работа.')}
  if(ch)saveTm();if(!TM.length&&!pomo){clearInterval(tmTick);tmTick=0}if(!HUD.hidden)drawDuty()}
function ensureTick(){if(!tmTick&&(TM.length||pomo))tmTick=setInterval(tickTimers,1000)}
function workEnd(){const[hh,mm]=String(store.get('nefor-hud-eod','18:00')).split(':').map(Number);return {hh,mm}}
function untilEod(){const n=new Date(),{hh,mm}=workEnd(),e=new Date(n);e.setHours(hh,mm,0,0);const wd=n.getDay();if(wd===0||wd===6)return null;return e-n}
function untilFri(){const n=new Date(),{hh,mm}=workEnd(),e=new Date(n),wd=n.getDay();if(wd===6||wd===0)return -1;e.setDate(n.getDate()+(5-wd));e.setHours(hh,mm,0,0);return e-n}
function humanMs(ms){const m=Math.round(ms/60000),d=Math.floor(m/1440),hh=Math.floor(m%1440/60),mi=m%60;return [d&&`${d} ${plural(d,'день','дня','дней')}`,hh&&`${hh} ${plural(hh,'час','часа','часов')}`,!d&&mi&&`${mi} ${plural(mi,'минута','минуты','минут')}`].filter(Boolean).join(' ')||'меньше минуты'}
function drawDuty(){const el=$h('#hd-duty');if(!el)return;const e=untilEod(),f=untilFri();
  const L=[['До конца дня',e==null?'выходной':e<=0?'рабочий день окончен':humanMs(e)],['До пятницы',f<0?'уже выходные':f<=0?'пятница наступила':humanMs(f)]];
  el.innerHTML=L.map(([k,v])=>`<div class="hd-row"><span>${k}</span><b>${h(v)}</b></div>`).join('')+
   (pomo?`<div class="hd-tm pomo"><span>Помодоро #${pomo.n+(pomo.phase==='work'?1:0)} · ${pomo.phase==='work'?'работа':'перерыв'}</span><b>${fmtLeft(pomo.end-Date.now())}</b><button type="button" data-pomo-x aria-label="Остановить помодоро">×</button></div>`:'')+
   TM.map(t=>`<div class="hd-tm"><span>${h(t.label||'Таймер')}</span><b>${fmtLeft(t.end-Date.now())}</b><button type="button" data-tm-x="${t.id}" aria-label="Отменить">×</button></div>`).join('')+
   (!TM.length&&!pomo?'<p class="hd-note" style="margin-top:8px">Скажите «таймер на 5 минут» или «напомни через 10 минут проверить бэкап».</p>':'')}
function timerCmd(raw,q){
  if(/(отмени|удали|сбрось|убери)\S* (все )?(таймер|напомина)/.test(q)){const n=TM.length;TM=[];saveTm();drawDuty();return reply(n?`Отменил ${n} ${plural(n,'таймер','таймера','таймеров')}.`:'Таймеров и так нет.'),true}
  if(/как(ие|ой) таймер|мои таймеры|список напомин/.test(q))return reply(TM.length?TM.map(t=>`${t.label||'таймер'} через ${fmtDur((t.end-Date.now())/1000)}`).join('; ')+'.':'Активных таймеров нет.'),true;
  if(/помодоро|pomodoro|режим фокус/.test(q)){if(/стоп|выключ|останов|хватит|отмен/.test(q)){pomo=null;saveTm();drawDuty();return reply('Помодоро остановлен.'),true}
    pomo={phase:'work',n:0,end:Date.now()+25*60000};saveTm();ensureTick();drawDuty();return reply('Помодоро запущен: 25 минут работы, потом 5 минут перерыва. Таймер слева, в панели «Дежурство».'),true}
  const at=/(?:^|\s)в (\d{1,2})[:.\s](\d{2})\b/.exec(q);
  if(/напомни|напоминание/.test(q)&&at){const d=new Date();d.setHours(+at[1],+at[2],0,0);if(d<new Date())d.setDate(d.getDate()+1);
    const label=raw.replace(/напомни(те)?( мне)?|напоминание/i,'').replace(/(^|\s)в \d{1,2}[:.\s]\d{2}/i,'').replace(/^[\s,:-]+|[\s,.]+$/g,'')||'напоминание';
    addTimer((d-Date.now())/1000,label);return reply(`Напомню в ${at[1]}:${at[2]}: «${label}».`),true}
  if(!/таймер|засеки|напомни|будильник|поставь .*на \d|через \d/.test(q))return false;const dd=dur(q);if(!dd)return reply('На сколько ставить? Скажите, например: «таймер на 10 минут».'),true;
  if(dd.s<1||dd.s>86400)return reply('Таймер можно поставить от секунды до суток.'),true;
  let label='';if(/напомни/.test(q)){label=raw.replace(/напомни(те)?( мне)?/i,'').replace(/(через|на)\s+(\S+\s+)?(сек\S*|минут\S*|мин\S*|час\S*|полчаса|полтора часа)/i,'').replace(/(через|на)\s+(полчаса|час)\b/i,'').replace(/^[\s,:-]+|[\s,.]+$/g,'')}
  addTimer(dd.s,label);return reply(label?`Напомню через ${fmtDur(dd.s)}: «${label}».`:`Таймер на ${fmtDur(dd.s)} запущен.`),true}
function dutyCmd(q){
  const m=/рабоч\S* день (?:до|заканчивается в|кончается в) (\d{1,2})(?:[:.\s](\d{2}))?/.exec(q);if(m){store.set('nefor-hud-eod',`${m[1]}:${m[2]||'00'}`);drawDuty();return reply(`Запомнил: рабочий день до ${m[1]}:${m[2]||'00'}.`),true}
  if(/до (пятниц|выходн)/.test(q)){const f=untilFri();return reply(f<0?'Так ведь уже выходные. Закройте ноутбук.':f<=0?'Пятница вечер уже наступила. Не открывайте почту.':`До пятницы ${workEnd().hh}:${String(workEnd().mm).padStart(2,'0')} осталось ${humanMs(f)}.`),true}
  if(/до конца (рабоч|дня|смены)|когда домой|скоро домой/.test(q)){const e=untilEod();return reply(e==null?'Сегодня выходной. Какой ещё рабочий день?':e<=0?'Рабочий день уже закончился. Почему вы ещё здесь?':`До конца рабочего дня ${humanMs(e)}.`),true}
  if(/до нового года/.test(q)){const n=new Date(),y=new Date(n.getFullYear()+1,0,1);return reply(`До Нового года ${Math.ceil((y-n)/864e5)} ${plural(Math.ceil((y-n)/864e5),'день','дня','дней')}. Успейте закрыть все заявки.`),true}
  if(/до (отпуск|зарплат|аванс)/.test(q))return reply(/отпуск/.test(q)?'Отпуск в календаре не найден. Подайте заявку в отдел кадров и ждите согласования.':'Слишком долго. Точнее сказать не могу, бухгалтерия не даёт доступ к API.'),true;
  return false}
const WCODE={0:'ясно',1:'в основном ясно',2:'переменная облачность',3:'пасмурно',45:'туман',48:'изморозь',51:'морось',53:'морось',55:'сильная морось',56:'ледяная морось',57:'ледяная морось',61:'небольшой дождь',63:'дождь',65:'ливень',66:'ледяной дождь',67:'ледяной дождь',71:'небольшой снег',73:'снег',75:'сильный снег',77:'снежная крупа',80:'ливневый дождь',81:'ливень',82:'сильный ливень',85:'снегопад',86:'сильный снегопад',95:'гроза',96:'гроза с градом',99:'гроза с градом'};
async function weather(raw,q){if(!/погод|температур\S* (на улице|в )|на улице|нужен ли зонт/.test(q))return false;
  raw=raw.replace(/\s+(сегодня|завтра|сейчас)\s*\??$/i,'').trim();let m=/(?:в|во)\s+([а-яёa-z-]+(?:[\s-][а-яёa-z-]+)?)\s*\??$/i.exec(raw);let lat,lon,name;
  let netErr=false;async function geo(w){w=w[0].toUpperCase()+w.slice(1).toLowerCase();const vs=[w,w.replace(/е$/,'а'),w.replace(/е$/,''),w.replace(/и$/,'ь'),w.replace(/и$/,'а'),w.replace(/ом$/,''),w.replace(/е$/,'я')];
    for(const v of [...new Set(vs)]){try{const r=await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(v)}&count=1&language=ru`);const j=await r.json();if(j.results?.length){const x=j.results[0];return {lat:x.latitude,lon:x.longitude,name:x.name}}}catch(e){netErr=true;break}}return null}
  if(m){const g=await geo(m[1]);if(g){({lat,lon,name}=g);store.set('nefor-hud-city',g)}else return reply(netErr?'Сервис погоды не ответил. Выгляните в окно, это надёжнее.':`Город «${m[1]}» не нашёл. Попробуйте в именительном падеже: «погода Псков».`),true}
  else{const m2=/погод\S*\s+([а-яёa-z-]{3,})$/i.exec(raw);if(m2&&!/сейчас|сегодня|завтра|там/.test(m2[1])){const g=await geo(m2[1]);if(g){({lat,lon,name}=g);store.set('nefor-hud-city',g)}}}
  if(lat==null){const c=store.get('nefor-hud-city',null);if(c)({lat,lon,name}=c)}
  if(lat==null&&isSecureContext&&nav.geolocation){try{const p=await new Promise((ok,no)=>nav.geolocation.getCurrentPosition(ok,no,{timeout:8000}));lat=p.coords.latitude;lon=p.coords.longitude;name='вашем районе'}catch(e){}}
  if(lat==null)return reply('Скажите город, например: «погода в Казани».'),true;
  try{const r=await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,apparent_temperature,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto&forecast_days=1&wind_speed_unit=ms`);const j=await r.json(),c=j.current,d=j.daily;
    const t=Math.round(c.temperature_2m),fl=Math.round(c.apparent_temperature),pr=d.precipitation_probability_max?.[0];
    const tip=pr>=60?' Возьмите зонт.':t<=-15?' Наденьте всё, что есть.':t>=28?' Включите кондиционер в серверной.':'';
    reply(`${name==='вашем районе'?'В вашем районе':name}: ${t>0?'+':''}${t}°, ${WCODE[c.weather_code]||'погода непонятная'}, ощущается как ${fl>0?'+':''}${fl}°, ветер ${Math.round(c.wind_speed_10m)} м/с. Днём от ${Math.round(d.temperature_2m_min[0])} до ${Math.round(d.temperature_2m_max[0])}°${pr!=null?`, осадки ${pr}%`:''}.${tip}`)}
  catch(e){reply('Сервис погоды не ответил. Выгляните в окно, это надёжнее.')}return true}

/* ----- игры ----- */
let pending=null;
const ORD={1:/^(1|один|первы\S*|перв\S*|а)$/,2:/^(2|два|втор\S*|б)$/,3:/^(3|три|трет\S*|в)$/,4:/^(4|четыре|четверт\S*|г)$/};
function quiz(){const Q=[...KB().QUIZ].sort(()=>Math.random()-.5).slice(0,10);if(!Q.length)return reply('Вопросы ещё грузятся, попробуйте через секунду.');let i=0,sc=0;
  const ask=()=>{const[q,o]=Q[i];say(`Вопрос ${i+1} из ${Q.length}. ${q}`,`<div class="hd-opts">${o.map((x,k)=>`<button type="button" class="hd-ex" data-c="${k+1}">${k+1}. ${h(x)}</button>`).join('')}</div>`,`Вопрос ${i+1}. ${q} ${o.map((x,k)=>`${k+1}: ${x}.`).join(' ')}`)};
  pending=(q)=>{const[,o,ok,ex]=Q[i];let a=-1;for(const k in ORD)if(ORD[k].test(q))a=k-1;if(a<0)a=o.findIndex(x=>norm(x)===q||norm(x).startsWith(q)&&q.length>2);
    if(a<0){say('Ответьте номером варианта: от 1 до 4.');return}const right=a===ok;if(right)sc++;
    const fb=right?pick(persona==='shaman'?['Духи довольны! Верно.','Хе-хе, точно!']:persona==='grumpy'?['Верно. Не ожидал.','Правильно. Случайно, наверное.']:['Верно!','Правильно, отлично.','Точно!']):(persona==='grumpy'?'Мимо. ':'Не совсем. ')+`Правильный ответ: ${o[ok]}.`;
    i++;if(i<Q.length){say(`${fb} ${ex}`);setTimeout(ask,reduce?50:1800)}else{pending=null;if(sc>=8)window.ach?.('hudquiz');
      say(`${fb} Викторина окончена: ${sc} из ${Q.length}. ${sc>=9?'Уровень: сеньор. Возьмите себе зарплату побольше.':sc>=7?'Уровень: мидл. Крепко.':sc>=4?'Уровень: джун. Есть куда расти.':'Уровень: стажёр. Начните с раздела «Для всех».'}`)}};
  say(`Викторина для админов: ${Q.length} вопросов. Отвечайте номером варианта. Скажите «стоп», чтобы выйти.`);setTimeout(ask,reduce?50:1600)}
const GUESS=['SSH','RDP','HTTPS','HTTP','DNS','SMB','LDAP','WinBox','MySQL','PostgreSQL','SMTP','IMAPS','Telnet','NTP','SNMP','WireGuard','OpenVPN','Zabbix agent','MS SQL','FTP','Kerberos','VNC','WinRM HTTP'];
function guessPort(){const P=KB().PORTS,pool=GUESS.map(n=>P.find(p=>p[2]===n)).filter(Boolean).sort(()=>Math.random()-.5).slice(0,5);if(!pool.length)return reply('База портов ещё грузится.');let i=0,sc=0;
  const ask=()=>say(`Раунд ${i+1}. Какой порт у ${pool[i][2]}?`);pending=q=>{const m=/(\d{1,5})/.exec(q);if(!m){say('Назовите номер порта цифрами.');return}const p=pool[i],ok=+m[1]===p[0];if(ok)sc++;
    i++;const fb=ok?'Верно!':`Нет, ${p[2]} — это ${p[0]}.`;if(i<pool.length){say(fb);setTimeout(ask,reduce?50:1300)}else{pending=null;say(`${fb} Итог: ${sc} из ${pool.length}. ${sc===5?'Порты знаете лучше, чем nmap.':sc>=3?'Неплохо.':'Ничего, шпаргалка портов есть в Тулзах.'}`)}};
  say('Угадай порт: пять раундов, отвечайте номером.');setTimeout(ask,reduce?50:1200)}
function fun(raw,q){if(/монетк|орел или решк|орёл или решк/.test(q))return reply(Math.random()<.5?'Орёл.':'Решка.'),true;
  if(/кубик|кости/.test(q))return reply(`Выпало ${1+Math.floor(Math.random()*6)}.`),true;
  let m=/случайн\S* числ\S*(?: от (-?\d+) до (-?\d+))?/.exec(q);if(m){const a=m[1]!=null?+m[1]:1,b=m[2]!=null?+m[2]:100;return reply(`Число: ${a+Math.floor(Math.random()*(Math.abs(b-a)+1))*(b>=a?1:-1)}.`),true}
  m=/^(?:выбери|что выбрать)\s*:?\s*(.+)/.exec(q);if(m){const o=m[1].split(/\s*(?:,| или )\s*/).filter(Boolean);if(o.length>1)return reply(`Выбираю: ${pick(o)}.`),true}
  return false}
function helpCard(){const G=[['Сайт',['открой игры','покажи кейсы','включи компьютер','паника']],['Утилиты',['подсеть 192.168.1.0/26','мой IP','dns mx ya.ru','что за порт 3389','объясни cron */15 9-18 * * 1-5','base64 привет','md5 test','uuid','chmod 755','unix 1700000000','сколько качать 50 гб на 100 мбит']],
  ['Справочник',['ошибка 0x80070005','ошибка 1219','код 502','event 4740','как разблокировать пользователя','как пробросить порт на микротике','как очистить очередь печати']],
  ['Дежурство',['таймер на 5 минут','напомни через 10 минут проверить бэкап','помодоро','сколько до пятницы','до конца рабочего дня','погода в Москве']],
  ['Характер и игры',['режим ворчуна','режим шамана','вежливый режим','смени голос','меня зовут Саша','викторина','угадай порт','кинь кубик','выбери пицца или суши']],['Система',['диагностика','статус','пинг','сгенерируй пароль','расскажи байку','отмазка']],['Музыка',['включи музыку','следующий трек','что играет','громче','пауза']]];
  return `<div class="hd-help">${G.map(([t,l])=>`<b>${t}</b><div>${l.map(chip).join('')}</div>`).join('')}</div>`}

async function handle(raw){raw=String(raw||'').trim();const q=norm(raw);if(!q)return;userLine(raw);await kbReady;
  const has=r=>r.test(q),ql=raw.toLowerCase().replace(/ё/g,'е').replace(/\s*(слэш|слеш|дробь)\s*/g,'/').replace(/(\d)\s+точка\s+(?=\d)/g,'$1.');
  if(pending){if(has(/^(стоп|хватит|выход|отмена|закончить|надоело)/)){pending=null;return say('Игра остановлена.')}pending(q,raw);return}
  if(has(/^(выход|выйти|закрой(ся)?|отключись|пока|до свидания|хватит)(?=\s|$)/)||has(/выключ(и|ись) (себя|ассистент|нефор)/))return go(()=>{},persona==='grumpy'?'Наконец-то. Отключаюсь.':persona==='shaman'?'Шаман уходит в дым. Хе-хе-хе!':'Отключаюсь. Все системы остаются под наблюдением.');
  if(has(/диагност|сканир|просканир|проверь (комп|пк|систем|машин)/))return scan();
  const MU=window.nfMusic;
  if(MU&&has(/(включи|поставь|запусти|вруби|давай) (музык|песн|трек)|^музык\S*$|^плеер$/)){const ok=await MU.play();return say(ok?`Играет «${MU.title}».`:'Браузер не дал включить музыку. Нажмите на кнопку с нотой в углу сайта.')}
  if(MU&&has(/(выключи|останови|убери|стоп|пауза|хватит) (музык|песн|трек)|^пауза$/)){MU.pause();return say('Музыка на паузе.')}
  if(MU&&has(/(следующ|другой|другую|переключи|дальше).{0,10}(трек|песн)|^следующий$|^дальше$/)){MU.next();return say('Следующий трек.')}
  if(MU&&has(/предыдущ.{0,8}(трек|песн)|^назад$/)){MU.prev();return say('Предыдущий трек.')}
  if(MU&&has(/что (сейчас )?играет|как называется (песня|трек)/))return say(MU.playing?`Играет «${MU.title}».`:'Сейчас тихо. Скажите «включи музыку».');
  if(MU&&MU.playing&&has(/^(громче|тише)|(сделай|музык\S*) (громче|тише)/)){MU.vol(has(/громче/)?.15:-.15);return say(`Громкость музыки ${Math.round(MU.volume*100)}%.`)}
  /* утилиты с явными данными */
  if(subnet(ql)||base64(raw,q)||await hashCmd(raw,q)||errCode(q,raw)||eventId(q)||chmod(q)||cron(raw)||unix(q)||speed(ql))return;
  if(has(/^(uuid|guid)|(сгенерируй|создай|дай) (uuid|guid)/)){const u=uuid();return reply('Новый UUID.',codeBox(u,'uuid'))}
  if(has(/мой (ip|айпи|адрес)|какой у меня (ip|айпи)|внешний (ip|айпи)/))return myIp();
  if(/(^|\s)(dns|днс)(\s|$)|\b(mx|txt|ns|aaaa|cname)\b.*\.|запис\S* (домена|для)/.test(ql)&&await dns(ql))return;
  if(!has(/проброс|пробросить|открыть порт|открой порт|mikrotik|микротик/)&&portInfo(q))return;
  /* дежурство */
  if(timerCmd(raw,ql)||dutyCmd(q)||await weather(raw,q))return;
  /* характер, имя, игры */
  if(has(/ворчун|ворчлив|будь (злым|грубым|дерзким)|дерзк\S* режим/))return setPersona('grumpy');
  if(has(/вежлив|будь (добрее|добрым|милым)|нормальный режим/))return setPersona('polite');
  if(has(/шаман|вуду|колдун|бубен|знахар/))return setPersona('shaman');
  if(has(/смени характер|другой характер/))return setPersona(PNEXT[persona]||'polite');
  if(has(/(смени|другой|следующий|поменяй) голос/)){const v=ruVoices();if(!v.length)return say('В браузере нет русских голосов. Отвечу текстом.');const i=(v.indexOf(voice)+1)%v.length;voice=v[i];store.set('nefor-hud-vname',voice.name);return say(`Голос: ${voice.name}. Всего русских голосов: ${v.length}.`)}
  let m=/(?:меня зовут|зови меня|мое имя|моё имя)\s+([а-яёa-z-]{2,20})/i.exec(raw);if(m){uname=m[1][0].toUpperCase()+m[1].slice(1).toLowerCase();store.set('nefor-hud-name',uname);return reply(persona==='shaman'?`Духи запомнили имя: ${uname}. Хе-хе.`:persona==='grumpy'?`Записал: ${uname}. Теперь не отвертитесь.`:`Приятно познакомиться, ${uname}. Запомнил.`)}
  if(has(/как меня зовут|ты помнишь мое имя|кто я/))return reply(uname?`Вы ${uname}. Я помню.`:'Вы не представились. Скажите: «меня зовут…»');
  if(has(/забудь (мое |моё )?имя/)){uname='';store.set('nefor-hud-name','');return reply('Имя забыл. Вы снова таинственный незнакомец.')}
  if(has(/викторин|экзамен|проверь мои знания|квиз/))return quiz();
  if(has(/угадай порт|игра в порты|угадать порт/))return guessPort();
  if(fun(raw,q))return;
  /* справочник: «как сделать…» */
  if(has(/^(как|покажи команду|напиши команду|какой командой|команда (для|чтобы))/)&&howto(q,true))return;
  /* навигация по сайту */
  if(has(/(включи|запусти|загрузи) (комп|пк|ос|систем|ne-for ?os|неформ)|ne-for ?os|рабочий стол/))return go(()=>{if(window.osPower)window.osPower('power');else window.need?.('os').then(()=>window.osPower?.('power'))},'Передаю управление ne-forOS.');
  if(has(/паник|начальник/))return go(()=>window.panicOn?.(),'Режим маскировки. Выглядите занятым.');
  if(has(/^(поиск|найди на сайте)/))return go(()=>window.openSearch?.(),'Открываю поиск по сайту.');
  if(has(/^(открой|покажи|перейди|давай|запусти|хочу)|раздел/)||VIEWS.some(v=>v[0].test(q))&&q.split(' ').length<=3){const v=VIEWS.find(v=>v[0].test(q));if(v)return go(()=>{location.hash=v[1]},`Открываю раздел «${v[2]}».`)}
  if(howto(q,false))return;
  if(has(/пароль/)){const pw=genPw();return reply('Пароль готов: шестнадцать символов, без похожих букв. Нажмите, чтобы скопировать.',codeBox(pw,'пароль'),'Пароль готов, он на экране.')}
  if(has(/пинг|задержк/)){const p=await measurePing();return reply(p!=null?`Пинг до ne-for.ru: ${p} миллисекунд. ${p<60?'Отлично.':p<150?'Нормально.':'Медленновато. Проверьте, не качает ли кто-то сериалы.'}`:'Сайт не отвечает. Это не я, это DNS.')}
  if(has(/статус|сводк|систем|отчет|как (дела|ты|жизнь)|все в норме/))return reply(has(/как (дела|ты|жизнь)/)?(persona==='shaman'?'Духи спокойны, бубен цел. ':persona==='grumpy'?'Как у всех в IT: всё горит, но стабильно. ':'Все системы в норме. Кроме принтера, но это его обычное состояние. ')+statusText():statusText());
  if(has(/байк|истори|анекдот|шутк|пошути|смешн/)){const s=Math.random()<.5&&window.ST_LIST?pick(window.ST_LIST):(window.genStory?.()||pick(window.ST_LIST||['Байки ещё грузятся.']));return say(s)}
  if(has(/отмаз|оправдан|почему не работает|что сломалось/)){let e='Это DNS. Всегда DNS.';try{if(typeof excuse==='function')e=excuse()}catch(_){}return say(e)}
  if(has(/тем[ау] сайта|смени тему|цвет сайта/)){document.getElementById('themeBtn')?.click();return reply('Тема сайта переключена. Мне идёт голубой, я останусь в нём.')}
  if(has(/который час|сколько времени|^время$/)){const d=new Date();return reply(`Сейчас ${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}.`)}
  if(has(/какое (сегодня )?число|^дата|какой (сегодня )?день/))return reply('Сегодня '+new Date().toLocaleDateString('ru-RU',{weekday:'long',day:'numeric',month:'long'})+'.');
  if(has(/(без|выключи|убери) (звук|голос)|замолчи|тише|молчи/)){voiceOn=false;store.set('nefor-hud-voice',false);setVoiceBtn();synth?.cancel();return say('Перехожу в текстовый режим.')}
  if(has(/(включи|верни) (звук|голос)|говори/)){voiceOn=true;store.set('nefor-hud-voice',true);setVoiceBtn();return say(voice?'Голосовой модуль активен.':'Хотел бы, но в вашем браузере нет русского голоса.')}
  if(has(/кто ты|как тебя зовут|что ты такое|представься|нефор|расшифр/))return reply('Я НЕФОР: Нейронный Ежедневный Фронт Обслуживания Рабочих. Ассистент этого сайта: считаю подсети, знаю коды ошибок, ставлю таймеры и иногда ворчу.');
  if(has(/аргус/))return reply('Аргус — моё старое имя. Сменил его вместе с прошивкой.');
  if(has(/джарвис|пятниц/))return reply('Коллега в отпуске. Я за него. Костюм не выдали, но подсеть посчитать могу.');
  if(has(/что умеешь|помощь|помоги|команды|help|список команд/))return say('Вот что я умею. Нажмите на любой пример или скажите его голосом.',helpCard(),'Я умею работать с сайтом, считать подсети и коды ошибок, давать готовые команды, ставить таймеры, показывать погоду и играть в викторину. Примеры на экране.');
  if(has(/привет|здравствуй|здорово|хай|добр(ое|ый) /))return say(persona==='shaman'?`Хе-хе! ${uname||'Путник'}, духи ждали тебя. Что сломалось?`:persona==='grumpy'?`${uname?uname+', опять':'Опять'} вы. Ну, привет. Что сломалось?`:`${greet()}${uname?', '+uname:''}. Все системы в норме. Чем займёмся?`);
  if(has(/спасибо|благодар|молодец|красав/))return say(persona==='shaman'?pick(['Духи довольны. Хе-хе.','Принеси духам кофе, и мы в расчёте.']):persona==='grumpy'?pick(['Спасибо на хлеб не намажешь. Но приятно.','Запишу в отчёт о полезности. Его никто не читает.']):pick(['Всегда к вашим услугам.','Обращайтесь. Я всё равно никуда не денусь.','Рад стараться.']));
  if(has(/кофе/))return reply('Кофеварка не подключена к сети. Заявка создана, срок решения: никогда.');
  if(has(/перезагру/)){say('Перезагружаюсь. Не выключайте компьютер.');HUD.classList.remove('ready');await sleep(1200);HUD.classList.add('ready');return say('Готово. Помогло? Обычно помогает.')}
  if(has(/rm -rf|удали все|снеси/))return reply('Отказано. Я видел, что стало с ne-forOS.');
  say(persona==='shaman'?pick(['Духи не поняли твоих слов. Скажи «что умеешь».','Бубен молчит. Спроси иначе или скажи «что умеешь».']):persona==='grumpy'?pick(['Не понял. И не хочу. Скажите «что умеешь».','Это не ко мне. Создайте заявку. Или скажите «что умеешь».']):pick(['Команда не распознана. Скажите «что умеешь», там примеры.','Не понял. Попробуйте: «подсеть 10.0.0.0/24», «таймер 5 минут» или «викторина».','Это за пределами моих протоколов. Пока. Скажите «что умеешь».']))}

/* ---------- диагностика ---------- */
const JOKES=['Вкладок в браузере больше, чем нужно. Точное число скрыто из милосердия.','Последняя перезагрузка: предположительно в прошлом квартале.','Пароль на стикере под клавиатурой не обнаружен. Уважаю.',
 'Пыль в системном блоке: датчика нет, но она там есть.','Обновления Windows ждут самого неподходящего момента.','Папка «Новая папка (7)»: вероятность наличия 94%.','Ярлыков на рабочем столе больше, чем видно обоев.',
 'Уровень кофе у пользователя: требует пополнения.','Принтер недоступен. Как всегда.','Файл «финал_финал_точно_финал.docx» найден.','Кабель мыши запутан с зарядкой. Классика.','Антивирус работает и мешает. Всё штатно.'];
let scanning=false;
async function scan(){if(scanning)return;scanning=true;window.ach?.('scan');const btn=$h('#hd-scan');btn.disabled=true;$h('#hd-rep').classList.remove('on');$h('#hd-dst').textContent='идёт скан';
  const ol=$h('#hd-steps'),prog=$h('#hd-prog');ol.innerHTML='';prog.style.width='0';say(persona==='shaman'?'Бросаю кости на твой компьютер. Хе-хе-хе…':'Запускаю полную диагностику. Не трогайте мышь. Шучу, трогайте.');
  const p=await measurePing();let score=100;const cores=nav.hardwareConcurrency||0,mem=nav.deviceMemory||0;
  const S=[
   ['Процессор',cores?`${cores} потоков`:'данные скрыты',cores>=8?'ok':cores>=4?'w':cores?'bad':'w',cores>=8?0:cores>=4?-8:cores?-18:-4],
   ['Память',mem?`от ${mem} ГБ${mem>=8?' (браузер больше 8 не показывает)':''}`:'браузер не сообщает',mem>=8?'ok':mem>=4?'w':mem?'bad':'w',mem>=8?0:mem>=4?-8:mem?-18:-4],
   ['Видеокарта',GPU||'скрыта браузером',GPU&&/RTX|RX \d|Radeon Pro|Apple M|Arc/i.test(GPU)?'ok':GPU?'w':'w',GPU&&/RTX|RX \d|Apple M|Arc/i.test(GPU)?0:-5],
   ['Сеть',`${p!=null?p+' мс до сайта':'сайт не ответил'}${con.effectiveType?' · '+con.effectiveType.toUpperCase():''}`,p==null?'bad':p<80?'ok':p<200?'w':'bad',p==null?-20:p<80?0:p<200?-6:-14],
   ['Питание',batt?`${Math.round(batt.level*100)}%${batt.charging?', заряжается':''}`:'от сети',batt&&!batt.charging&&batt.level<.2?'bad':'ok',batt&&!batt.charging&&batt.level<.2?-10:0],
   ['Браузер',`${B.b} ${B.v}`,(+B.v>=110||B.b==='Safari'||B.b==='Яндекс Браузер')?'ok':'w',(+B.v>=110||B.b==='Safari'||B.b==='Яндекс Браузер')?0:-8],
   ['Графика',curFps?`${curFps} кадров/с`:'измеряю',curFps>=50||!curFps?'ok':'w',curFps>=50||!curFps?0:-6]];
  const J=[...JOKES].sort(()=>Math.random()-.5).slice(0,3).map(t=>['Эвристика',t,'joke',0]);
  const all=[...S,...J];
  for(let i=0;i<all.length;i++){const[k,v,c,d]=all[i];score+=d;const li=document.createElement('li');li.className=c;li.innerHTML=`<i>${c==='ok'?'✓':c==='bad'?'✕':c==='joke'?'~':'!'}</i><span>${h(k)}<small>${h(v)}</small></span><em>${c==='joke'?'эвр.':c==='ok'?'норма':c==='bad'?'плохо':'так себе'}</em>`;
   ol.append(li);requestAnimationFrame(()=>li.classList.add('in'));prog.style.width=((i+1)/all.length*100)+'%';await sleep(430)}
  score=Math.max(12,Math.min(100,score));const col=score>=85?'#4dffb0':score>=65?'#ffb020':'#ff5a72';
  const verd=score>=85?'Машина в отличной форме. Можно смело открывать ещё двести вкладок.':score>=65?'Жить можно. Но перезагрузка раз в месяц не повредит.':'Эту машину пора апгрейдить. Или хотя бы продуть от пыли.';
  const sc=$h('#hd-score');sc.style.setProperty('--c',col);let cur=0;$h('#hd-rep').classList.add('on');$h('#hd-verd').textContent=verd;
  const tick=()=>{cur=Math.min(score,cur+3);sc.style.setProperty('--p',cur);sc.querySelector('b').textContent=cur;if(cur<score)requestAnimationFrame(tick)};tick();
  $h('#hd-dst').textContent='готово';say(`Диагностика завершена. Оценка: ${score} из ста. ${verd}`);btn.disabled=false;btn.textContent='Повторить сканирование';scanning=false}

/* ---------- включение / выключение ---------- */
let timers=[],running=false;
function clock(){const d=new Date();$h('#hd-clock').textContent=d.toLocaleTimeString('ru-RU')+' · '+d.toLocaleDateString('ru-RU',{day:'2-digit',month:'short'})}
async function on(mode){if(running){if(mode==='scan')scan();return}running=true;window.ach?.('hud');
  HUD.hidden=false;document.body.style.overflow='hidden';HUD.classList.remove('ready','off');bg();rows();clock();logEl.innerHTML='';sayEl.textContent='';setVoiceBtn();micInit();
  requestAnimationFrame(()=>HUD.classList.add('on'));
  const boot=['Инициализация ядра','Калибровка сенсоров','Подключение к ne-for.ru','Голосовой модуль'];
  for(const b of boot){sayEl.textContent=b+'…';await sleep(260)}
  HUD.classList.add('ready');raf=requestAnimationFrame(loop);
  drawDuty();setPersonaBtn();timers.push(setInterval(()=>{rows();clock();drawDuty()},1000),setInterval(measurePing,3000));measurePing();
  const n=store.get('nefor-hud-n',0)+1;store.set('nefor-hud-n',n);
  await sleep(400);say(`${greet()}${uname?', '+uname:''}. ${n>1?'С возвращением.':'Я НЕФОР, ассистент этого сайта.'} ${persona==='shaman'?'Хе-хе! Духи сети проснулись.':persona==='grumpy'?'Опять работать.':'Все системы в норме.'} ${SR&&isSecureContext?'Нажмите на микрофон и скажите команду':'Напишите команду'} или скажите «что умеешь».`);
  if(mode==='scan')setTimeout(scan,1600);else setTimeout(()=>matchMedia('(pointer:fine)').matches&&inp.focus(),300)}
async function off(){if(!running)return;running=false;stopDrums();timers.forEach(clearInterval);timers=[];cancelAnimationFrame(raf);try{rec?.abort()}catch(e){}synth?.cancel();sayTok++;talking=listening=false;
  HUD.classList.add('off');HUD.classList.remove('on');await sleep(420);HUD.hidden=true;HUD.classList.remove('off','ready');document.body.style.overflow=''}
window.hudOn=on;window.hudOff=off;

$h('#hd-x').onclick=()=>off();
voiceB.onclick=()=>{voiceOn=!voiceOn;store.set('nefor-hud-voice',voiceOn);setVoiceBtn();if(!voiceOn)synth?.cancel();else say(voice?'Голос включён.':'В браузере нет русского голоса, отвечу текстом.')};
$h('#hd-form').onsubmit=e=>{e.preventDefault();const v=inp.value;inp.value='';handle(v)};
HUD.querySelectorAll('.hd-chips [data-c]').forEach(b=>b.onclick=()=>handle(b.dataset.c));
$h('#hd-scan').onclick=scan;coreEl.onclick=()=>SR&&isSecureContext?(listening?rec?.stop():listen()):inp.focus();
logEl.addEventListener('click',e=>{const p=e.target.closest('[data-copy]');if(p){typeof copy==='function'?copy(p.dataset.copy):navigator.clipboard?.writeText(p.dataset.copy);p.textContent='скопировано';setTimeout(()=>p.textContent='копировать',1400);return}
  const c=e.target.closest('[data-c]');if(c)handle(c.dataset.c)});
$h('#hd-duty').addEventListener('click',e=>{const x=e.target.closest('[data-tm-x]');if(x){TM=TM.filter(t=>String(t.id)!==x.dataset.tmX);saveTm();drawDuty()}if(e.target.closest('[data-pomo-x]')){pomo=null;saveTm();drawDuty()}});
$h('#hd-pers').onclick=()=>setPersona(PNEXT[persona]||'polite');
ensureTick();
addEventListener('keydown',e=>{if(HUD.hidden)return;if(e.key==='Escape'){e.preventDefault();off()}},true);
addEventListener('resize',()=>{if(!HUD.hidden)bg()});
if(typeof CMDS!=='undefined'){CMDS.nefor=CMDS.argus=CMDS.hud=()=>{setTimeout(()=>on(),200);return 'Запускаю НЕФОРа…'};CMDS.jarvis=()=>{setTimeout(()=>on(),600);return 'Коллега в отпуске. Вместо него — НЕФОР.'}}
})();
