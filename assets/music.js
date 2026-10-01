/* ne-for.ru — музыкальный плеер. Треки лежат в папке music/, список — TRACKS ниже.
   Музыка не прерывается при переходах по разделам, место и громкость запоминаются. */
(() => {
const TRACKS=[
 ['music/4-etazh.mp3','Четвёртый этаж'],
 ['music/skoro-avans.mp3','Скоро аванс'],
 ['music/4-etazh-v2.mp3','Четвёртый этаж (версия 2)'],
];
const h=s=>String(s??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store={get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const fmt=s=>!isFinite(s)?'0:00':`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;

const css=`
.mp{position:fixed;right:18px;bottom:18px;z-index:46;font:13px/1.4 var(--mono);color:var(--txt)}
.mp-fab{width:50px;height:50px;border-radius:50%;border:1px solid var(--line);background:var(--card);color:var(--acc);cursor:pointer;display:grid;place-items:center;box-shadow:0 10px 30px -10px rgba(0,0,0,.7);transition:transform .2s,box-shadow .2s,border-color .2s;margin-left:auto}
.mp-fab:hover{transform:translateY(-2px);border-color:var(--acc);box-shadow:0 12px 30px -8px var(--acc)}
.mp-fab svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2;stroke-linecap:round;stroke-linejoin:round}
.mp-eq{display:none;gap:3px;align-items:flex-end;height:18px}.mp-eq i{width:3px;background:currentColor;border-radius:1px;height:30%;animation:mpEq .9s ease-in-out infinite alternate}
.mp-eq i:nth-child(2){animation-delay:-.3s}.mp-eq i:nth-child(3){animation-delay:-.6s}.mp-eq i:nth-child(4){animation-delay:-.15s}
@keyframes mpEq{from{height:20%}to{height:100%}}
.mp.playing .mp-fab .mp-note{display:none}.mp.playing .mp-fab .mp-eq{display:flex}
.mp-panel{position:absolute;right:0;bottom:62px;width:310px;max-width:calc(100vw - 36px);background:color-mix(in srgb,var(--card) 94%,transparent);backdrop-filter:blur(10px);border:1px solid var(--line);border-radius:16px;padding:14px;box-shadow:0 20px 50px -15px rgba(0,0,0,.8);transform-origin:bottom right;transition:opacity .2s,transform .2s}
.mp:not(.open) .mp-panel{opacity:0;transform:scale(.92) translateY(8px);pointer-events:none;visibility:hidden}
.mp-vis{display:block;width:100%;height:46px;border-radius:8px;background:color-mix(in srgb,var(--bg) 70%,transparent)}
.mp-t{margin-top:10px;display:flex;justify-content:space-between;gap:10px;align-items:baseline}
.mp-t b{font-weight:600;color:var(--txt);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.mp-t small{color:var(--mut);flex:none}
.mp-seek{display:grid;grid-template-columns:auto 1fr auto;gap:8px;align-items:center;margin-top:8px;font-size:11px;color:var(--mut);font-variant-numeric:tabular-nums}
.mp input[type=range]{-webkit-appearance:none;appearance:none;width:100%;height:4px;border-radius:2px;background:linear-gradient(90deg,var(--acc) var(--p,0%),var(--line) var(--p,0%));cursor:pointer;margin:0}
.mp input[type=range]::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;border-radius:50%;background:var(--acc);border:0}
.mp input[type=range]::-moz-range-thumb{width:12px;height:12px;border-radius:50%;background:var(--acc);border:0}
.mp-ctl{display:flex;align-items:center;gap:6px;margin-top:10px}
.mp-b{width:36px;height:36px;border-radius:50%;border:1px solid var(--line);background:transparent;color:var(--txt);cursor:pointer;display:grid;place-items:center;flex:none}
.mp-b:hover{border-color:var(--acc);color:var(--acc)}.mp-b svg{width:16px;height:16px;fill:currentColor}
.mp-b.big{width:44px;height:44px;background:var(--acc);color:var(--onacc,#000);border-color:var(--acc)}.mp-b.big:hover{color:var(--onacc,#000);filter:brightness(1.1)}
.mp-vol{display:flex;align-items:center;gap:6px;margin-left:auto;width:96px;color:var(--mut)}.mp-vol svg{width:15px;height:15px;flex:none;fill:none;stroke:currentColor;stroke-width:2}
.mp-list{list-style:none;margin:12px 0 0;padding:8px 0 0;border-top:1px solid var(--line);max-height:170px;overflow:auto}
.mp-list button{width:100%;display:flex;justify-content:space-between;gap:8px;font:inherit;font-size:12px;text-align:left;background:none;border:0;color:var(--mut);padding:6px 8px;border-radius:8px;cursor:pointer}
.mp-list button:hover{background:color-mix(in srgb,var(--acc) 8%,transparent);color:var(--txt)}.mp-list button.on{color:var(--acc)}
.mp-list button.on span::before{content:"▶ "}
.mp-foot{margin:8px 0 0;font-size:11px;color:var(--mut)}
@media(max-width:520px){.mp{right:12px;bottom:12px}.mp-fab{width:44px;height:44px}.mp-panel{bottom:54px}}
@media(prefers-reduced-motion:reduce){.mp-eq i{animation:none;height:70%}}
`;
const st=document.createElement('style');st.textContent=css;document.head.append(st);

const I={play:'<svg viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>',pause:'<svg viewBox="0 0 24 24"><path d="M7 5h4v14H7zM13 5h4v14h-4z"/></svg>',
 prev:'<svg viewBox="0 0 24 24"><path d="M6 5h2v14H6zM20 5v14L9 12z"/></svg>',next:'<svg viewBox="0 0 24 24"><path d="M16 5h2v14h-2zM4 5v14l11-7z"/></svg>'};
const el=document.createElement('div');el.className='mp';el.id='mp';
el.innerHTML=`<div class="mp-panel" role="dialog" aria-label="Музыкальный плеер">
 <canvas class="mp-vis" aria-hidden="true"></canvas>
 <div class="mp-t"><b id="mp-title"></b><small id="mp-n"></small></div>
 <div class="mp-seek"><span id="mp-cur">0:00</span><input type="range" id="mp-pos" min="0" max="1000" value="0" aria-label="Перемотка"><span id="mp-dur">0:00</span></div>
 <div class="mp-ctl"><button class="mp-b" id="mp-prev" aria-label="Предыдущий трек">${I.prev}</button><button class="mp-b big" id="mp-play" aria-label="Играть">${I.play}</button><button class="mp-b" id="mp-next" aria-label="Следующий трек">${I.next}</button>
  <label class="mp-vol"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z"/><path d="M17 9a4 4 0 0 1 0 6"/></svg><input type="range" id="mp-v" min="0" max="100" aria-label="Громкость"></label></div>
 <ol class="mp-list" id="mp-list"></ol>
 <p class="mp-foot">Треки сгенерированы ИИ для ne-for.ru</p></div>
<button class="mp-fab" id="mp-fab" aria-label="Музыка" aria-expanded="false"><svg class="mp-note" viewBox="0 0 24 24"><path d="M9 18V5l11-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="17" cy="16" r="3"/></svg><span class="mp-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></span></button>`;
document.body.append(el);
const $m=s=>el.querySelector(s);

const S=store.get('nefor-music',{i:0,t:0,v:.6});let idx=Math.min(TRACKS.length-1,Math.max(0,S.i|0));
const audio=new Audio();audio.preload='metadata';audio.volume=S.v??.6;let baseVol=audio.volume,ducked=false;
function save(){if(audio.readyState<1&&S.t)return store.set('nefor-music',{i:idx,t:S.t,v:baseVol});store.set('nefor-music',{i:idx,t:audio.currentTime||0,v:baseVol})}
function load(i,keepTime){idx=(i+TRACKS.length)%TRACKS.length;audio.src=TRACKS[idx][0];if(keepTime&&S.t)audio.addEventListener('loadedmetadata',()=>{if(S.t<audio.duration-3){audio.currentTime=S.t;const p=S.t/audio.duration*1000;pos.value=p;pos.style.setProperty('--p',p/10+'%');$m('#mp-cur').textContent=fmt(S.t)}},{once:true});ui();if(!keepTime)save();meta()}
function ui(){$m('#mp-title').textContent=TRACKS[idx][1];$m('#mp-n').textContent=`${idx+1}/${TRACKS.length}`;
  $m('#mp-list').innerHTML=TRACKS.map((t,i)=>`<li><button type="button" data-i="${i}" class="${i===idx?'on':''}"><span>${h(t[1])}</span></button></li>`).join('');
  const playing=!audio.paused;el.classList.toggle('playing',playing);$m('#mp-play').innerHTML=playing?I.pause:I.play;$m('#mp-play').setAttribute('aria-label',playing?'Пауза':'Играть');
  const v=$m('#mp-v');v.value=Math.round(baseVol*100);v.style.setProperty('--p',v.value+'%')}
function meta(){try{if('mediaSession' in navigator){navigator.mediaSession.metadata=new MediaMetadata({title:TRACKS[idx][1],artist:'ne-for.ru',album:'Саундтрек серверной'})}}catch(e){}}

/* визуализатор */
let actx,an,data,raf=0;
function initAudio(){if(actx)return;try{actx=new (window.AudioContext||window.webkitAudioContext)();const src=actx.createMediaElementSource(audio);an=actx.createAnalyser();an.fftSize=128;an.smoothingTimeConstant=.8;src.connect(an);an.connect(actx.destination);data=new Uint8Array(an.frequencyBinCount)}catch(e){actx=null}}
function draw(){raf=0;if(!el.classList.contains('open'))return;const cv=$m('.mp-vis'),r=devicePixelRatio||1,w=cv.clientWidth,ht=cv.clientHeight;if(cv.width!==w*r){cv.width=w*r;cv.height=ht*r}
  const c=cv.getContext('2d');c.setTransform(r,0,0,r,0,0);c.clearRect(0,0,w,ht);const col=getComputedStyle(document.body).getPropertyValue('--acc').trim()||'#39ff88';c.fillStyle=col;
  const n=32,bw=w/n;for(let i=0;i<n;i++){let v=an&&!audio.paused?data[Math.floor(i*data.length/n*.75)]/255:0;if(!an&&!audio.paused)v=.25+.2*Math.sin(performance.now()/180+i);const bh=Math.max(2,v*(ht-6));c.globalAlpha=.35+.65*v;c.fillRect(i*bw+1,ht-bh-3,bw-2,bh)}
  c.globalAlpha=1;if(an&&!audio.paused)an.getByteFrequencyData(data);if(!audio.paused&&!reduce)raf=requestAnimationFrame(draw)}
const kick=()=>{if(!raf)raf=requestAnimationFrame(draw)};

/* управление */
async function play(){initAudio();try{await actx?.resume()}catch(e){}try{if(!audio.src)load(idx,true);await audio.play();window.ach?.('music')}catch(e){typeof toast==='function'&&toast('Не удалось включить музыку');return false}ui();kick();return true}
function pause(){audio.pause();save();ui()}
function toggle(){return audio.paused?play():pause()}
function next(){const was=!audio.paused;S.t=0;load(idx+1);if(was||true)play()}
function prev(){if(audio.currentTime>4){audio.currentTime=0;return}S.t=0;load(idx-1);play()}
function setVol(v){baseVol=Math.max(0,Math.min(1,v));audio.volume=ducked?baseVol*.3:baseVol;save();ui()}
function duck(on){ducked=on;audio.volume=on?baseVol*.3:baseVol}
window.nfMusic={play,pause,toggle,next,prev,duck,vol:d=>setVol(baseVol+d),setVol,get playing(){return !audio.paused},get title(){return TRACKS[idx][1]},get volume(){return baseVol}};

$m('#mp-fab').onclick=()=>{const o=el.classList.toggle('open');$m('#mp-fab').setAttribute('aria-expanded',o);if(o){kick();if(audio.paused&&!store.get('nefor-music-opened',false)){store.set('nefor-music-opened',true);play()}}};
$m('#mp-play').onclick=toggle;$m('#mp-next').onclick=next;$m('#mp-prev').onclick=prev;
$m('#mp-list').onclick=e=>{const b=e.target.closest('[data-i]');if(!b)return;S.t=0;load(+b.dataset.i);play()};
$m('#mp-v').oninput=e=>setVol(e.target.value/100);
const pos=$m('#mp-pos');let seeking=false;pos.oninput=()=>{seeking=true;pos.style.setProperty('--p',pos.value/10+'%');$m('#mp-cur').textContent=fmt(pos.value/1000*audio.duration)};
pos.onchange=()=>{if(isFinite(audio.duration))audio.currentTime=pos.value/1000*audio.duration;seeking=false};
let lastSave=0;audio.addEventListener('timeupdate',()=>{if(!seeking&&isFinite(audio.duration)){const p=audio.currentTime/audio.duration*1000;pos.value=p;pos.style.setProperty('--p',p/10+'%');$m('#mp-cur').textContent=fmt(audio.currentTime)}
  if(Date.now()-lastSave>4000){lastSave=Date.now();save()}});
audio.addEventListener('loadedmetadata',()=>{$m('#mp-dur').textContent=fmt(audio.duration)});
audio.addEventListener('ended',()=>{S.t=0;load(idx+1);play()});
audio.addEventListener('play',()=>{ui();kick()});audio.addEventListener('pause',ui);
document.addEventListener('click',e=>{if(el.classList.contains('open')&&!el.contains(e.target)){el.classList.remove('open');$m('#mp-fab').setAttribute('aria-expanded',false)}},true);
addEventListener('keydown',e=>{if(e.key==='Escape'&&el.classList.contains('open')){el.classList.remove('open');$m('#mp-fab').setAttribute('aria-expanded',false)}});
try{if('mediaSession' in navigator){const ms=navigator.mediaSession;ms.setActionHandler('play',play);ms.setActionHandler('pause',pause);ms.setActionHandler('nexttrack',next);ms.setActionHandler('previoustrack',prev)}}catch(e){}
addEventListener('pagehide',save);
load(idx,true);

/* терминал */
if(typeof CMDS!=='undefined')CMDS.music=CMDS.mp3=a=>{const x=String(a||'').trim().toLowerCase();
  if(x==='next')next();else if(x==='prev')prev();else if(/^(stop|pause)$/.test(x))pause();else if(/^\d+$/.test(x)){S.t=0;load(+x-1);play()}else if(x==='list')return TRACKS.map((t,i)=>`${i+1}. ${h(t[1])}`).join('<br>');else play();
  return `♪ ${h(TRACKS[idx][1])} (${idx+1}/${TRACKS.length}). Команды: music next | prev | stop | list | номер`};
})();
