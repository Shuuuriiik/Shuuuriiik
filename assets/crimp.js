/* ne-for.ru — симулятор обжимки RJ45 */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const el = $('#s-crimp'); if (!el) return;

/* цвета жил — физические цвета проводов, одинаковые в любой теме */
const W={wo:{n:'бело-оранжевый',c:'#f08a24',s:1},o:{n:'оранжевый',c:'#f08a24'},wg:{n:'бело-зелёный',c:'#2e9e4d',s:1},g:{n:'зелёный',c:'#2e9e4d'},
         wb:{n:'бело-синий',c:'#2f6bd3',s:1},b:{n:'синий',c:'#2f6bd3'},wbr:{n:'бело-коричневый',c:'#86562a',s:1},br:{n:'коричневый',c:'#86562a'}};
const STD={B:['wo','o','wg','b','wb','g','wbr','br'],A:['wg','g','wo','b','wb','o','wbr','br']};
const PAIRS=[['wo','o','оранжевую'],['wg','g','зелёную'],['wb','b','синюю'],['wbr','br','коричневую']];
const PINPAIRS=[[0,1],[2,5],[3,4],[6,7]];
const TASKS=[
 {t:'Прямой патч-корд по T568B',d:'Самый частый случай: ПК → розетка, свитч → роутер. Оба конца по B.',ends:['B','B']},
 {t:'Прямой патч-корд по T568A',d:'Заказчик настаивает на стандарте A. Оба конца по A.',ends:['A','A']},
 {t:'Кроссовер A–B',d:'Для старого оборудования без Auto-MDIX: один конец по A, другой по B.',ends:['A','B']},
];
const STEPS=[['strip','Снять оболочку'],['untwist','Раскрутить пары'],['order','Разложить жилы'],['trim','Обрезать ровно'],['insert','Вставить в коннектор'],['crimp','Обжать кримпером']];
const rand=n=>Math.floor(Math.random()*n);
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
let C=null, hint=false;

function newEnd(){const pairs=shuffle(PAIRS).map(p=>Math.random()<.5?[p[0],p[1]]:[p[1],p[0]]);
  return{strip:0,untw:[false,false,false,false],order:pairs.flat(),trim:0,flip:null,crimp:0,tries:0,jag:Array.from({length:8},()=>rand(18))}}
function newGame(ti){C={ti:ti??store.get('nefor-crimp-task',0),stage:'cut',end:0,ends:[newEnd(),newEnd()],t0:Date.now(),notes:[],sel:null,test:null,msg:''};render()}
const E=()=>C.ends[C.end];
const task=()=>TASKS[C.ti];

/* ---------- рисование ---------- */
const cv=()=>$('#cr-cv');
function wire(x,x0,y1,y2,id,wd=7){const g=cv().getContext('2d'),w=W[id];g.lineCap='butt';g.lineWidth=wd;
  g.strokeStyle=w.s?'#f4f1ea':w.c;g.beginPath();g.moveTo(x0,y1);g.lineTo(x,y1-12);g.lineTo(x,y2);g.stroke();
  if(w.s){g.strokeStyle=w.c;g.lineWidth=wd;g.setLineDash([5,7]);g.beginPath();g.moveTo(x,y1-12);g.lineTo(x,y2);g.stroke();g.setLineDash([])}}
function twisted(cx,yb,yt,a,b){const g=cv().getContext('2d');[[a,0],[b,Math.PI]].forEach(([id,ph])=>{const w=W[id];
  g.lineWidth=6;g.strokeStyle=w.s?'#f4f1ea':w.c;g.beginPath();for(let y=yb;y>=yt;y-=2){const x=cx+Math.sin((yb-y)/9+ph)*6;y===yb?g.moveTo(x,y):g.lineTo(x,y)}g.stroke();
  if(w.s){g.strokeStyle=w.c;g.setLineDash([4,8]);g.stroke();g.setLineDash([])}})}
function jacket(yTop,H){const g=cv().getContext('2d');g.fillStyle='#8f9a94';g.fillRect(300,yTop,40,H-yTop);g.fillStyle='#a9b3ae';g.fillRect(304,yTop,6,H-yTop);
  g.fillStyle='#5e6863';g.font='10px monospace';g.save();g.translate(326,H-12);g.rotate(-Math.PI/2);g.fillText('UTP CAT5e 4x2x0.5',0,0);g.restore()}
function css(v){return getComputedStyle(document.body).getPropertyValue(v).trim()}
function draw(){const c=cv();if(!c)return;const g=c.getContext('2d'),Wd=c.width,H=c.height,e=E(),st=C.stage;
  g.clearRect(0,0,Wd,H);g.fillStyle=css('--inset');g.fillRect(0,0,Wd,H);
  const mut=css('--mut');g.fillStyle=mut;g.font='11px monospace';
  if(st==='test'||st==='done'){drawTest(g,Wd,H);return}
  const yJ=H-40,px=5;
  if(st==='cut'){jacket(40,H);g.fillText('← отмерили 3 м, режем здесь',346,50);g.strokeStyle=css('--warn');g.setLineDash([4,4]);g.beginPath();g.moveTo(280,40);g.lineTo(360,40);g.stroke();g.setLineDash([]);return}
  if(st==='strip'){const px0=5,L=+($('#cr-range')?.value||25)*px0;jacket(e.strip?yJ:60,H);
    if(!e.strip){g.strokeStyle=css('--acc');g.setLineDash([4,4]);g.beginPath();g.moveTo(280,60+L);g.lineTo(360,60+L);g.stroke();g.setLineDash([]);
      g.fillText(`надрез: ${L/px0} мм от края`,366,64+L);g.fillText('край',366,64)}return}
  const L=e.strip*px;jacket(yJ,H);
  if(st==='untwist'){PAIRS.forEach((p,i)=>{const cx=290+i*20;if(e.untw[i]){wire(cx-4,cx-4,yJ,yJ-L,p[0],6);wire(cx+4,cx+4,yJ,yJ-L,p[1],6)}else twisted(cx,yJ,yJ-L,p[0],p[1])});return}
  const n=8,gap=st==='order'?26:14,x0=320-gap*3.5;
  const top=i=>st==='order'?yJ-L:(e.trim?yJ-e.trim*px:yJ-L+e.jag[i]);
  e.order.forEach((id,i)=>{const x=x0+i*gap;wire(x,306+i*4,yJ,top(i),id,st==='order'?9:7);
    if(st==='order'){g.fillStyle=C.sel===i?css('--acc'):mut;g.font='12px monospace';g.textAlign='center';g.fillText(String(i+1),x,yJ-L-10);g.textAlign='start';
      if(C.sel===i){g.strokeStyle=css('--acc');g.lineWidth=2;g.strokeRect(x-9,yJ-L-2,18,L-10)}}});
  if(st==='trim'&&!e.trim){const T=+($('#cr-range')?.value||20)*px;g.strokeStyle=css('--acc');g.setLineDash([4,4]);g.beginPath();g.moveTo(250,yJ-T);g.lineTo(390,yJ-T);g.stroke();g.setLineDash([]);g.fillStyle=mut;g.fillText(`${T/px} мм от оболочки`,396,yJ-T+4)}
  if(st==='insert'||st==='crimp'){const tipY=yJ-e.trim*px,plugTop=tipY-6,plugH=23*px;
    g.fillStyle='rgba(190,215,255,.16)';g.strokeStyle='#b8c8d8';g.lineWidth=2;g.fillRect(262,plugTop,116,plugH);g.strokeRect(262,plugTop,116,plugH);
    for(let i=0;i<8;i++){const x=x0+i*gap;const down=e.crimp>=100?10:0;g.fillStyle='#d4a72c';g.fillRect(x-4,plugTop+2+down*0,8,18+down)}
    const clampY=plugTop+plugH-30;g.fillStyle=e.crimp>=100?'#9aa7b3':'rgba(154,167,179,.5)';g.fillRect(270,clampY,100,8);
    g.fillStyle=mut;g.font='11px monospace';g.fillText(e.flip===true?'защёлка сверху':'защёлка снизу',386,plugTop+14);
    if(e.crimp>=100&&e.trim>15){g.strokeStyle=css('--bad');g.lineWidth=2;g.strokeRect(268,clampY-3,104,14);g.fillStyle=css('--bad');g.fillText('фиксатор на жилах',386,clampY+8)}}
}
function drawTest(g,Wd,H){g.save();g.translate(0,70);const T=C.test;const plug=(x,end,label)=>{const pins=pinsOf(end);g.fillStyle='rgba(190,215,255,.16)';g.strokeStyle='#b8c8d8';g.lineWidth=2;g.fillRect(x,40,150,110);g.strokeRect(x,40,150,110);
    pins.forEach((id,i)=>{const px=x+14+i*17;wire(px,px,150,62,id,9);g.fillStyle='#d4a72c';g.fillRect(px-4,44,8,14);g.fillStyle=css('--mut');g.font='10px monospace';g.textAlign='center';g.fillText(i+1,px,170);g.textAlign='start'});
    g.fillStyle=css('--txt');g.font='12px monospace';g.fillText(label,x,28)};
  plug(60,C.ends[0],`Конец 1 (${task().ends[0]})`);plug(Wd-210,C.ends[1],`Конец 2 (${task().ends[1]})`);
  g.fillStyle='#8f9a94';g.fillRect(210,120,Wd-420,18);g.fillStyle=css('--mut');g.font='11px monospace';g.fillText('контакты видно сквозь коннектор, пин 1 слева',210,200);g.restore()}

/* ---------- логика ---------- */
const pinsOf=e=>e.flip?[...e.order].reverse():[...e.order];
function opens(e){const o=new Set();if(e.trim<10){while(o.size<3)o.add(rand(8))}else if(e.trim<12)o.add(rand(8));return o}
function runTest(){const a=C.ends[0],b=C.ends[1],pa=pinsOf(a),pb=pinsOf(b),oa=a.op||(a.op=opens(a)),ob=b.op||(b.op=opens(b));
  const map=pa.map((id,i)=>{const j=pb.indexOf(id);return oa.has(i)||ob.has(j)?null:j});
  const open=map.map((j,i)=>j===null?i+1:null).filter(Boolean);
  const same=pa.join()===pb.join(),isStd=o=>o.join()===STD.A.join()?'A':o.join()===STD.B.join()?'B':null,sa=isStd(pa),sb=isStd(pb);
  const pairsOk=o=>PINPAIRS.every(([x,y])=>PAIRS.some(p=>(p[0]===o[x]&&p[1]===o[y])||(p[1]===o[x]&&p[0]===o[y])));
  let v,ok=false;const want=task().ends;
  if(open.length)v=`Обрыв на пинах ${open.join(', ')}. ${a.trim<12||b.trim<12?'Жилы обрезаны слишком коротко и не дошли до контактов.':''}`;
  else if(same&&sa){ok=want[0]===sa&&want[1]===sa;v=ok?`Прямой кабель по T568${sa}. Всё горит 1-1 … 8-8.`:`Кабель рабочий, прямой по T568${sa}, но задание было другое: ${task().t}.`}
  else if(sa&&sb&&sa!==sb){ok=want[0]!==want[1]&&((want[0]===sa&&want[1]===sb)||(want[0]===sb&&want[1]===sa));v=ok?'Кроссовер A–B: 1↔3 и 2↔6 перекрещены, как и надо.':'Получился кроссовер A–B, а нужен был прямой кабель.'}
  else if(same&&!pairsOk(pa))v='Тестер показывает 1-1 … 8-8, но пары разбиты (split pair): на 100 Мбит и 1 Гбит будут ошибки и помехи. Раскладка не по стандарту.';
  else if(same)v='Кабель прозванивается 1-1 … 8-8 и пары целые, но цвета не по стандарту. Следующий админ будет долго думать.';
  else{const bad=map.map((j,i)=>j!==i?`${i+1}→${j+1}`:null).filter(Boolean);v=`Жилы перепутаны: ${bad.join(', ')}.${a.flip!==b.flip?' Похоже, один коннектор вставлен вверх ногами.':''}`}
  const notes=[];[a,b].forEach((e,k)=>{if(e.trim>15)notes.push(`Конец ${k+1}: жилы слишком длинные, фиксатор прижал жилы, а не оболочку. Кабель выдернется.`);
    if(e.strip>45)notes.push(`Конец ${k+1}: оболочки снято много, но это исправили обрезкой.`)});
  let score=ok?100:same&&sa?60:30;score-=notes.filter(n=>n.includes('фиксатор')).length*20;if(open.length)score=10;
  const sec=Math.round((Date.now()-C.t0)/1000);
  C.test={map,ok,v,notes,score:Math.max(0,score),sec,lit:0};
  if(ok&&!notes.length){window.ach?.('crimp');if(want[0]!==want[1])window.ach?.('crossover');const best=store.get('nefor-crimp-best',0);if(!best||sec<best)store.set('nefor-crimp-best',sec)}
}

/* ---------- интерфейс ---------- */
function stepsHTML(){if(C.stage==='cut')return '<span class="cr-st on">Отрезать кабель</span>';
  if(C.stage==='test'||C.stage==='done')return '<span class="cr-st done">Конец 1</span><span class="cr-st done">Конец 2</span><span class="cr-st on">Прозвонка тестером</span>';
  const i=STEPS.findIndex(s=>s[0]===C.stage);return `<span class="cr-end">Конец ${C.end+1} · T568${task().ends[C.end]}</span>`+STEPS.map((s,k)=>`<span class="cr-st${k<i?' done':k===i?' on':''}">${k+1}. ${s[1]}</span>`).join('')}
function ctrlHTML(){const e=E();switch(C.stage){
 case 'cut':return `<p>Отмерь 3 метра и отрежь кабель бокорезами. Торец должен быть ровным, без замятых жил.</p><button class="btn" id="cr-go">Отрезать бокорезами</button>`;
 case 'strip':return `<p>Установи стриппер и сними внешнюю оболочку. Лучше снять с запасом, 25–40 мм: так удобнее раскладывать жилы, лишнее потом обрежем.</p>
   <label class="fld">Длина: <b id="cr-val">25 мм</b><input type="range" id="cr-range" min="5" max="50" value="25"></label><button class="btn" id="cr-go">Прокрутить стриппер</button>`;
 case 'untwist':return `<p>Раскрути пары и выпрями жилы. Раскручивай только снятый участок: под оболочкой скрутка должна остаться.</p>
   <div class="chips">${PAIRS.map((p,i)=>`<button class="chip${e.untw[i]?' on':''}" data-u="${i}" ${e.untw[i]?'disabled':''}>${e.untw[i]?'✓ ':''}Раскрутить ${p[2]}</button>`).join('')}</div>`;
 case 'order':return `<p>Разложи жилы по T568${task().ends[C.end]}. Коннектор будешь держать защёлкой вниз, контактами вверх, отверстием к себе: тогда пин 1 слева.</p>
   <p class="muted" style="font-size:12px">Нажми на жилу, потом на другую, чтобы поменять их местами. Раскладку никто не проверит до тестера, как в жизни.</p>
   <div class="cr-wires">${e.order.map((id,i)=>`<button class="cr-w${C.sel===i?' on':''}" data-w="${i}" aria-label="пин ${i+1}: ${W[id].n}"><i style="${swatch(id)}"></i><span>${i+1}</span><small>${W[id].n}</small></button>`).join('')}</div>
   <button class="btn" id="cr-go">Выпрямить и выровнять</button>`;
 case 'trim':return `<p>Обрежь жилы ровно. Оболочка должна зайти в коннектор под фиксатор, а жилы дойти до самого торца: ориентир 12–14 мм.</p>
   <label class="fld">Оставить: <b id="cr-val">20 мм</b><input type="range" id="cr-range" min="6" max="30" value="20"></label><button class="btn" id="cr-go">Обрезать бокорезами</button>`;
 case 'insert':return `<p>Как держишь коннектор?</p><div class="chips"><button class="chip${e.flip===false?' on':''}" data-f="0">Защёлкой вниз, контактами вверх</button><button class="chip${e.flip===true?' on':''}" data-f="1">Защёлкой вверх</button></div>
   <p class="muted" style="font-size:12px">Вставляй до упора: кончики жил должны быть видны у самого торца коннектора.</p><button class="btn" id="cr-go" ${e.flip===null?'disabled':''}>Вставить до упора</button>`;
 case 'crimp':return `<p>Вставь коннектор в гнездо 8P кримпера и сожми ручки до щелчка трещотки. Отпустишь раньше, и ножи не прорежут изоляцию.</p>
   <div class="meter" style="margin:8px 0"><i id="cr-p" style="width:0%"></i></div><button class="btn" id="cr-hold">Держи, чтобы обжать</button>`;
 case 'test':case 'done':{const T=C.test;return `<p>Подключаем концы к тестеру. Мастер зажигает пины по очереди, ответная часть показывает, куда пришёл сигнал.</p>
   <div class="cr-tester"><div><span>Мастер</span>${[...Array(8)].map((_,i)=>`<i class="${i<T.lit?'on':''}">${i+1}</i>`).join('')}</div>
   <div><span>Ответ</span>${[...Array(8)].map((_,j)=>{const src=T.map.findIndex((x,i)=>x===j&&i<T.lit);return `<i class="${src>=0?'on':''}${src>=0&&src!==j?' x':''}">${j+1}</i>`}).join('')}</div></div>
   ${C.stage==='done'?`<div class="dk-res ${T.ok&&!T.notes.length?'ok':'bad'}"><b>${T.ok&&!T.notes.length?'Кабель готов':'Надо переобжать'}</b> · ${T.score}/100 · ${Math.floor(T.sec/60)}:${String(T.sec%60).padStart(2,'0')}<p>${h(T.v)}</p>${T.notes.map(n=>`<p>${h(n)}</p>`).join('')}</div>
   <div class="row" style="margin-top:10px"><button class="btn" id="cr-new" style="flex:0 0 auto">Новый кабель</button></div>`:''}`}
 }}
const swatch=id=>W[id].s?`background:repeating-linear-gradient(90deg,#f4f1ea 0 6px,${W[id].c} 6px 10px)`:`background:${W[id].c}`;
function hintHTML(){const row=k=>`<div class="cr-std"><b>T568${k}</b>${STD[k].map((id,i)=>`<div><i style="${swatch(id)}"></i><span>${i+1}</span><small>${W[id].n}</small></div>`).join('')}</div>`;
  return `${row('B')}${row('A')}
  <ul class="cr-notes"><li><b>Как держать:</b> защёлкой вниз, контактами вверх, отверстием к себе. Пин 1 слева.</li>
  <li><b>Запомнить B:</b> бело-оранжевый, оранжевый, бело-зелёный, синий, бело-синий, зелёный, бело-коричневый, коричневый. A получается, если поменять местами оранжевую и зелёную пары.</li>
  <li><b>Прямой кабель:</b> оба конца одинаково, B–B или A–A. Сейчас почти всё обжимают по B.</li>
  <li><b>Кроссовер:</b> один конец A, другой B. Нужен только старому оборудованию без Auto-MDIX.</li>
  <li><b>Синяя пара</b> всегда в центре (4–5), <b>коричневая</b> всегда на 7–8. Зелёная пара «обнимает» синюю: 3 и 6.</li></ul>`}
function render(){el.innerHTML=`<div class="cr-head"><div><b>${h(task().t)}</b><p class="muted">${h(task().d)}</p></div>
   <div class="cr-hctl"><select id="cr-task" aria-label="задание">${TASKS.map((t,i)=>`<option value="${i}"${i===C.ti?' selected':''}>${h(t.t)}</option>`).join('')}</select><button class="btn ghost" id="cr-hint" aria-pressed="${hint}">${hint?'Скрыть подсказку':'Подсказка A / B'}</button></div></div>
  <div class="cr-steps">${stepsHTML()}</div>
  <div class="cr-hint" ${hint?'':'hidden'}>${hintHTML()}</div>
  <div class="cr-main"><canvas id="cr-cv" width="640" height="340" aria-label="Кабель и коннектор"></canvas><div class="cr-ctrl">${ctrlHTML()}<p class="cr-msg" id="cr-msg">${h(C.msg)}</p></div></div>`;
  bind();draw()}
function next(){const i=STEPS.findIndex(s=>s[0]===C.stage);C.msg='';
  if(C.stage==='cut')C.stage='strip';
  else if(i<STEPS.length-1)C.stage=STEPS[i+1][0];
  else if(C.end===0){C.end=1;C.stage='strip';C.msg='Первый конец готов. Теперь второй.'}
  else{C.stage='test';runTest();render();const iv=setInterval(()=>{C.test.lit++;render();if(C.test.lit>=8){clearInterval(iv);C.stage='done';render()}},320);return}
  render()}
function bind(){const e=E(),go=$('#cr-go'),rg=$('#cr-range');
  $('#cr-task').onchange=ev=>{store.set('nefor-crimp-task',+ev.target.value);newGame(+ev.target.value)};
  $('#cr-hint').onclick=()=>{hint=!hint;render()};
  if(rg)rg.oninput=()=>{$('#cr-val').textContent=rg.value+' мм';draw()};
  el.querySelectorAll('[data-u]').forEach(b=>b.onclick=()=>{e.untw[+b.dataset.u]=true;if(e.untw.every(Boolean))next();else render()});
  el.querySelectorAll('[data-w]').forEach(b=>b.onclick=()=>{const i=+b.dataset.w;if(C.sel===null)C.sel=i;else{const j=C.sel;[e.order[i],e.order[j]]=[e.order[j],e.order[i]];C.sel=null}render()});
  el.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{e.flip=b.dataset.f==='1';render()});
  const nw=$('#cr-new');if(nw)nw.onclick=()=>newGame(C.ti);
  if(go)go.onclick=()=>{
    if(C.stage==='strip'){const v=+rg.value;if(v<20){C.msg=`${v} мм мало: пары не развести и не разложить. Сними больше.`;render();return}e.strip=v;
      if(v>45)C.notes.push('strip');next()}
    else if(C.stage==='trim'){const v=+rg.value;if(v>e.strip-2){C.msg='Столько жил нет: оболочки снято меньше.';render();return}e.trim=v;next()}
    else if(C.stage==='order'){C.sel=null;next()}
    else next()};
  const hold=$('#cr-hold');if(hold){let iv=null;const stop=()=>{if(!iv)return;clearInterval(iv);iv=null;
      if(e.crimp>=100){C.msg='Щёлк! Трещотка отпустила, контакты прорезали изоляцию.';next()}
      else{e.tries++;e.crimp=0;C.msg='Недожал: трещотка не щёлкнула, ручки не раскрылись. Жми до конца.';render()}};
    hold.onpointerdown=ev=>{ev.preventDefault();hold.setPointerCapture?.(ev.pointerId);iv=setInterval(()=>{e.crimp=Math.min(100,e.crimp+3);const p=$('#cr-p');if(p)p.style.width=e.crimp+'%';if(e.crimp>=100){draw();stop()}},30)};
    hold.onpointerup=stop;hold.onpointercancel=stop;hold.onpointerleave=stop;
    hold.onkeydown=ev=>{if((ev.key===' '||ev.key==='Enter')&&!iv){ev.preventDefault();hold.onpointerdown(ev)}};hold.onkeyup=stop}
  const c=cv();if(c&&C.stage==='order')c.onclick=ev=>{const r=c.getBoundingClientRect(),x=(ev.clientX-r.left)/r.width*c.width,i=Math.round((x-(320-26*3.5))/26);if(i>=0&&i<8)el.querySelector(`[data-w="${i}"]`)?.click()};
}
newGame();
if(typeof CMDS!=='undefined')CMDS.crimp=()=>{document.querySelector('#stabs .tab[data-s="crimp"]')?.click();location.hash='sims';return 'Бери кримпер →'};
})();
