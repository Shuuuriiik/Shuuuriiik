/* ne-for.ru — разделы, переходы и анимации */
(() => {
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const fine = matchMedia('(pointer: fine)').matches;

/* ================= РАЗДЕЛЫ ================= */
const VIEWS={home:'Главная',fun:'Для всех',games:'Игры',sims:'Симуляторы',tools:'Тулзы',gen:'Генераторы',soft:'Софт',blog:'Блог',me:'Профиль'};
const viewOf=id=>{const el=document.getElementById(id);return el?.closest('.view')?.id.slice(2)};
let cur=null,vt=null;
const MOD={games:['desk'],sims:['sims','crimp'],tools:['gen'],gen:['gen'],soft:['soft']};
const loadView=v=>(MOD[v]||[]).reduce((p,n)=>p.then(()=>need(n)).catch(()=>{}),Promise.resolve());
async function show(v,target){await loadView(v);
  const swap=()=>{document.querySelectorAll('.view').forEach(x=>x.hidden=x.id!=='v-'+v);cur=v;
    document.querySelectorAll('[data-nav]').forEach(a=>a.classList.toggle('on',a.dataset.nav===v));navBar();
    document.title=v==='home'?'ne-for.ru — не для всех':`${VIEWS[v]} · ne-for.ru`;
    const t=target&&document.getElementById(target);(t||document.body).scrollIntoView({behavior:t&&!reduce?'smooth':'auto',block:'start'});if(!t)scrollTo(0,0);
    document.querySelectorAll(`#v-${v} .h1v .ttl, #v-${v} .h2 .ttl`).forEach(e=>scramble(e));
    dispatchEvent(new Event('resize'))};
  if(v===cur){const t=target&&document.getElementById(target);if(t)t.scrollIntoView({behavior:reduce?'auto':'smooth'});else scrollTo({top:0,behavior:reduce?'auto':'smooth'});return}
  if(!reduce&&document.startViewTransition&&cur&&!vt){try{vt=document.startViewTransition(swap);vt.finished.finally(()=>{vt=null})}catch(e){vt=null;swap()}}
  else if(vt){swap()}
  else{swap();if(!reduce){const el=$('#v-'+v);el.classList.remove('enter');void el.offsetWidth;el.classList.add('enter')}}
}
function route(){const hh=decodeURIComponent(location.hash.slice(1));
  if(!hh||hh==='top')return show('home');
  if(hh.startsWith('post/'))return show('blog');
  if(hh.startsWith('guide='))return cur||show('home');
  if(VIEWS[hh])return show(hh);
  const v=viewOf(hh);if(v)return show(v,hh);show('home')}
addEventListener('hashchange',route);

/* индикатор под активным пунктом меню */
function navBar(){const bar=$('#navbar'),a=document.querySelector('[data-nav].on'),ul=a?.closest('ul');if(!bar||!a||!ul)return;
  bar.style.width=a.offsetWidth+'px';bar.style.transform=`translateX(${ul.offsetLeft+a.offsetLeft-ul.scrollLeft}px)`;
  const r=a.getBoundingClientRect(),u=ul.getBoundingClientRect();if(r.right>u.right||r.left<u.left)ul.scrollTo({left:a.offsetLeft-20,behavior:'smooth'})}
addEventListener('resize',navBar);$('#navlinks')?.addEventListener('scroll',navBar);

/* ================= ТЕКСТ, КОТОРЫЙ «РАСШИФРОВЫВАЕТСЯ» ================= */
const GL='АБВГДЕЖЗИКЛМНОПРСТ01<>/#$%_';
function scramble(el){if(!el||reduce)return;const fin=el.dataset.final||(el.dataset.final=el.textContent);let f=0;const N=Math.min(22,fin.length+8);
  clearInterval(el._sc);el._sc=setInterval(()=>{f++;el.textContent=[...fin].map((c,i)=>c===' '||i<(f/N)*fin.length?c:GL[Math.floor(Math.random()*GL.length)]).join('');if(f>=N){clearInterval(el._sc);el.textContent=fin}},32)}
window.scramble=scramble;

/* ================= ЗАГРУЗКА ================= */
const boot=$('#boot');
if(boot){const L=['ne-for BIOS v2.6 · © 2026','Проверка памяти ........ 16384 МБ OK','Поиск загрузочного устройства ... /dev/coffee','Монтирую /home/admin ........... OK','Поднимаю сеть ................... eth0 up','DNS ............................. надеемся','Запуск ne-for.ru'];
  const pre=boot.querySelector('pre');let i=0,done=false;
  const end=()=>{if(done)return;done=true;try{sessionStorage.setItem('nefor-booted','1')}catch(e){}boot.classList.add('out');setTimeout(()=>boot.remove(),600)};
  const step=()=>{if(done)return;if(i<L.length){pre.textContent+=L[i++]+'\n';setTimeout(step,i===L.length?260:130)}else{boot.classList.add('logo');setTimeout(end,700)}};
  boot.addEventListener('click',end);addEventListener('keydown',end,{once:true});setTimeout(step,120);setTimeout(end,3200)}

/* ================= ЖИВОЙ ФОН: СЕТЬ ИЗ УЗЛОВ И ПАКЕТОВ ================= */
(()=>{const c=$('#matrix');if(!c)return;const x=c.getContext('2d');let W,H,N=[],P=[],mouse={x:-999,y:-999},dpr=Math.min(2,devicePixelRatio||1),acc='#39ff88';
  const rs=()=>{W=innerWidth;H=innerHeight;c.width=W*dpr;c.height=H*dpr;c.style.width=W+'px';c.style.height=H+'px';x.setTransform(dpr,0,0,dpr,0,0);
    const n=Math.min(90,Math.round(W*H/16000));N=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.25,vy:(Math.random()-.5)*.25,r:Math.random()<.12?3:1.6}))};
  rs();addEventListener('resize',rs);
  if(fine)addEventListener('pointermove',e=>{mouse.x=e.clientX;mouse.y=e.clientY});
  const col=()=>{acc=getComputedStyle(document.body).getPropertyValue('--acc').trim()||'#39ff88'};col();new MutationObserver(col).observe(document.body,{attributes:true,attributeFilter:['class']});
  const D=140;
  function frame(){x.clearRect(0,0,W,H);x.strokeStyle=acc;x.fillStyle=acc;
    for(const n of N){if(!reduce){n.x+=n.vx;n.y+=n.vy;if(n.x<0||n.x>W)n.vx*=-1;if(n.y<0||n.y>H)n.vy*=-1}}
    for(let i=0;i<N.length;i++){const a=N[i];for(let j=i+1;j<N.length;j++){const b=N[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);if(d<D){x.globalAlpha=(1-d/D)*.35;x.lineWidth=1;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(b.x,b.y);x.stroke();
        if(!reduce&&Math.random()<.0009&&P.length<24)P.push({a,b,t:0,s:.008+Math.random()*.01})}}
      const md=Math.hypot(a.x-mouse.x,a.y-mouse.y);if(md<180){x.globalAlpha=(1-md/180)*.6;x.beginPath();x.moveTo(a.x,a.y);x.lineTo(mouse.x,mouse.y);x.stroke()}
      x.globalAlpha=.7;x.beginPath();x.arc(a.x,a.y,a.r,0,7);x.fill()}
    P=P.filter(p=>{p.t+=p.s;if(p.t>=1)return false;x.globalAlpha=1;x.beginPath();x.arc(p.a.x+(p.b.x-p.a.x)*p.t,p.a.y+(p.b.y-p.a.y)*p.t,2.2,0,7);x.fill();return true});
    x.globalAlpha=1;if(!reduce&&!document.hidden)requestAnimationFrame(frame)}
  frame();document.addEventListener('visibilitychange',()=>{if(!document.hidden&&!reduce)requestAnimationFrame(frame)})})();

/* ================= КАРТОЧКИ: 3D-НАКЛОН И ПОДСВЕТКА ================= */
if(fine&&!reduce)document.querySelectorAll('.hub-card').forEach(card=>{
  card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),px=(e.clientX-r.left)/r.width,py=(e.clientY-r.top)/r.height;
    card.style.setProperty('--mx',px*100+'%');card.style.setProperty('--my',py*100+'%');card.style.transform=`perspective(900px) rotateX(${(.5-py)*8}deg) rotateY(${(px-.5)*10}deg) translateY(-4px)`});
  card.addEventListener('pointerleave',()=>{card.style.transform=''})});

/* свечение за курсором */
const glow=$('#cursor-glow');if(glow&&fine&&!reduce)addEventListener('pointermove',e=>{glow.style.transform=`translate(${e.clientX-300}px,${e.clientY-300}px)`;glow.style.opacity=1});

/* счётчики на главной */
if(!reduce)document.querySelectorAll('.stat b').forEach(b=>{const t=b.textContent,m=t.match(/^([\d.]+)(.*)$/);if(!m)return;const v=parseFloat(m[1]),dec=(m[1].split('.')[1]||'').length;let s=null;
  const run=ts=>{s=s??ts;const k=Math.min(1,(ts-s)/1100),e=1-Math.pow(1-k,3);b.textContent=(v*e).toFixed(dec)+m[2];if(k<1)requestAnimationFrame(run)};requestAnimationFrame(run)});

/* счётчики карточек разделов */
const cnt={games:document.querySelectorAll('#v-games .tab, #game').length,tools:document.querySelectorAll('#tabs .tab').length,sims:document.querySelectorAll('#stabs .tab').length,gen:document.querySelectorAll('#gtabs .tab').length};
document.querySelectorAll('[data-count]').forEach(e=>{const k=e.dataset.count;if(k==='blog')fetch('posts/index.json').then(r=>r.json()).then(l=>e.textContent=`${l.filter(x=>x.case).length} кейсов и ${l.filter(x=>!x.case).length} заметок`).catch(()=>{});else if(cnt[k])e.textContent=e.textContent.replace('#',cnt[k])});

window.nfShow=show;
document.addEventListener('click',e=>{const d=e.target.closest('[data-hud]');if(d){e.preventDefault();need('hud').then(()=>window.hudOn?.(d.dataset.hud))}});
document.addEventListener('click',e=>{const b=e.target.closest('[data-os]');if(!b)return;e.preventDefault();need('os').then(()=>window.osPower?.(b.dataset.os))});
route();
/* после загрузки главной тихо догружаем остальное */
const idle=window.requestIdleCallback||(f=>setTimeout(f,1200));
addEventListener('load',()=>idle(()=>['soft','desk','sims','crimp','gen','os','hud'].reduce((p,n)=>p.then(()=>need(n)).catch(()=>{}),Promise.resolve()),{timeout:3000}));
})();
