/* ne-for.ru — достижения, байки из саппорта, гостевая книга */

/* ---- Гостевая книга: giscus (комментарии хранятся в GitHub Discussions репозитория) ----
   1. Settings репозитория → Features → включить Discussions.
   2. Установить приложение https://github.com/apps/giscus на этот репозиторий.
   3. На https://giscus.app/ru ввести репозиторий и скопировать data-repo-id и data-category-id сюда. */
const GISCUS = {
  repo: 'Shuuuriiik/Shuuuriiik',
  repoId: '',          // data-repo-id, например R_kgDO...
  category: 'General',
  categoryId: '',      // data-category-id, например DIC_kwDO...
};

(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };

/* ================= ДОСТИЖЕНИЯ ================= */
const A=[
 ['cmd','Hello, world','Ввести первую команду в терминал'],
 ['sudo','Не в sudoers','Попробовать sudo'],
 ['root','↑↑↓↓←→←→BA','Включить root-режим'],
 ['hack','Я в системе','Запустить хакер-режим'],
 ['theme','Дизайнер','Сменить тему'],
 ['tools','Мультитул','Открыть все вкладки тулз'],
 ['kps','Смена выстояла','Дожить до конца смены в «Кто положил сеть»'],
 ['snake','Пакетный менеджер','Доставить 10 пакетов в змейке'],
 ['mine','Сапёр','Разминировать серверную'],
 ['call','Голос поддержки','Набрать 100 кармы в «Звонке на линию»'],
 ['desk','Ноль жалоб','Отработать смену в сервис-деске без жалоб'],
 ['legend','Легенда первой линии','Средняя оценка 4,5+ и ни одной просрочки'],
 ['night','Ночной дозор','Закрыть инцидент в 3 ночи'],
 ['sherlock','Шерлок','Раскрыть 4 разных инцидента'],
 ['firewall','Стена','Пройти все уровни firewall-тренажёра'],
 ['architect','Архитектор','Собрать рабочую сеть офиса'],
 ['tama','Заботливый админ','Довести сервер-питомца до идеала'],
 ['reboot','А вы пробовали перезагрузить?','Перезагрузить сервер в стойке'],
 ['cables','Кабель-менеджер','Распутать 5 уровней кабелей'],
 ['mtconf','Конфиг готов','Забрать конфиг MikroTik'],
 ['ps','Автоматизатор','Забрать скрипт PowerShell'],
 ['guide','Методист','Сделать инструкцию для пользователей'],
 ['sitecheck','Аудитор','Проверить сайт'],
 ['reader','Читатель','Прочитать 3 заметки'],
 ['bsod','Синий экран','Увидеть BSOD на странице 404'],
 ['story','Байкер','Прочитать 10 баек из саппорта'],
];
const have=store.get('nefor-ach',{});
let AC=null;
function fanfare(){if(!store.get('nefor-sound',false))return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();[523,784,1047].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain(),t=AC.currentTime+i*.09;o.type='triangle';o.frequency.value=f;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.3);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+.35)})}catch(e){}}
window.ach=function(id){if(have[id])return;const a=A.find(x=>x[0]===id);if(!a)return;have[id]=Date.now();store.set('nefor-ach',have);
  fanfare();if(typeof toast==='function')toast('Достижение: '+a[1]);render()};
window.achSet=function(key,val,need,id){const s=new Set(store.get('nefor-achset-'+key,[]));s.add(val);store.set('nefor-achset-'+key,[...s]);if(s.size>=need)window.ach(id)};
function render(){const el=$('#achgrid');if(!el)return;const n=A.filter(a=>have[a[0]]).length;
  $('#achcount').textContent=`${n} из ${A.length}`;$('#achbar').style.width=(n/A.length*100)+'%';
  el.innerHTML=A.map(a=>{const got=have[a[0]];return `<div class="ach${got?' got':''}"><div class="ach-ic" aria-hidden="true">${got?'★':'?'}</div><div><b>${got?h(a[1]):'???'}</b><span>${h(a[2])}</span>${got?`<em>${new Date(got).toLocaleDateString('ru')}</em>`:''}</div></div>`}).join('')}
try{if(localStorage.getItem('nefor-404')){window.ach('bsod')}}catch(e){}
render();
if(typeof CMDS!=='undefined')CMDS.ach=()=>{location.hash='ach';return `Достижений: ${A.filter(a=>have[a[0]]).length} из ${A.length}`};

/* ================= БАЙКИ ИЗ САППОРТА ================= */
const ST=[
 '«Интернет не работает». Приезжаю: сотрудник выключил Wi-Fi на ноутбуке кнопкой, чтобы «не мешал печатать».',
 'Принтер не печатал неделю. Все отправляли документы повторно. В очереди было 1 400 заданий, из них 300 одинаковых.',
 'Заявка: «Компьютер сам по себе пищит». Причина: на клавиатуре лежал степлер и держал пробел.',
 '«Можно мне интернет побыстрее, у соседа быстрее». Сосед сидел на том же канале. Он просто закрыл 60 вкладок.',
 'Уборщица каждое утро выключала серверную розетку, чтобы включить пылесос. Мониторинг видел «аварию» ровно в 7:40 по будням.',
 'Бухгалтер хранила пароли на стикере под клавиатурой. «Но я же его переворачиваю!»',
 'Пользователь звонит: «Мышка не двигается». Мышка была на коврике. Коврик был на мышке. Точнее, мышка лежала на подставке для кружки.',
 'Директор попросил «сделать, чтобы почта не приходила по выходным». Сделали правило. В понедельник пришло 300 писем разом, и директор попросил вернуть как было.',
 'Сканер штрихкодов «сломался». На стекле была наклейка «Не сканировать», которую кто-то наклеил для порядка.',
 'Новенький подключил свой роутер «чтобы Wi-Fi был лучше». Через час у половины офиса были адреса 192.168.0.x и никакого интернета.',
 '«Всё зависло!» Экран в режиме энергосбережения. Помогло нажать любую клавишу. Пользователь нажал Esc и попросил записать это в инструкцию.',
 'Сервер в кладовке стабильно перегревался летом. Решение от завхоза: повесить на дверь табличку «Не закрывать».',
 'Заявка с пометкой «СРОЧНО!!!»: поменять обои на рабочем столе, потому что «на них осень, а уже весна».',
 '«Я ничего не трогал». В истории команд: удаление папки System32, чтобы «освободить место».',
 'Видеонаблюдение «ничего не записывало». Жёсткий диск регистратора лежал в коробке рядом. Его «вынули на время ремонта» два года назад.',
 'Пользователь пожаловался, что компьютер медленно включается. Компьютер был выключен. Монитор включался быстро.',
 '«Не могу войти, пишет неверный пароль». Пароль был правильный. Раскладка была немецкая. Как она там оказалась, никто не знает.',
 'Зарядку от ноутбука директора три раза «находили» в переговорке и уносили в другие отделы. На четвёртый раз её подписали маркером.',
 'IP-телефон «не работал». Трубка была положена поперёк, и телефон месяц думал, что идёт разговор.',
 '«Можно отключить обновления? Они всегда в самый неподходящий момент». Подходящего момента, по опросу, не было ни у кого.',
 'Ночью упал VPN до филиала. Утром филиал сказал, что всё работало. Они просто ничего не открывали до обеда.',
 '«Флешка не открывается». Это была флешка-открывашка для пива.',
];
let si=Math.floor(Math.random()*ST.length),seen=new Set(store.get('nefor-stories',[]));
function story(step){si=(si+step+ST.length)%ST.length;const el=$('#story-t');if(!el)return;el.textContent=ST[si];$('#story-n').textContent=`${si+1}/${ST.length}`;
  seen.add(si);store.set('nefor-stories',[...seen]);if(seen.size>=10)window.ach('story')}
if($('#story-t')){$('#story-next').onclick=()=>story(1);$('#story-prev').onclick=()=>story(-1);story(0)}
if(typeof CMDS!=='undefined')CMDS.story=()=>ST[Math.floor(Math.random()*ST.length)];

/* ================= ГОСТЕВАЯ КНИГА ================= */
const gb=$('#giscus');
if(gb){
  const t=new Date(),ts=t.toLocaleString('en',{month:'short'})+' '+String(t.getDate()).padStart(2,' ')+' '+t.toTimeString().slice(0,8);
  $('#gb-tail').innerHTML=`<div><span class="t">${ts}</span> ne-for guestbook[1]: журнал открыт, пиши строку</div>`;
  if(!GISCUS.repoId||!GISCUS.categoryId){gb.innerHTML='<p class="muted">Гостевая книга скоро откроется.</p>'}
  else{
    const dark=()=>!document.body.classList.contains('t-light');
    const s=document.createElement('script');s.src='https://giscus.app/client.js';s.async=true;s.crossOrigin='anonymous';
    Object.entries({repo:GISCUS.repo,'repo-id':GISCUS.repoId,category:GISCUS.category,'category-id':GISCUS.categoryId,mapping:'specific',term:'guestbook',strict:'0','reactions-enabled':'1','emit-metadata':'0','input-position':'top',theme:dark()?'transparent_dark':'light',lang:'ru',loading:'lazy'})
      .forEach(([k,v])=>s.setAttribute('data-'+k,v));
    gb.append(s);
    new MutationObserver(()=>{const f=document.querySelector('iframe.giscus-frame');f?.contentWindow?.postMessage({giscus:{setConfig:{theme:dark()?'transparent_dark':'light'}}},'https://giscus.app')}).observe(document.body,{attributes:true,attributeFilter:['class']});
  }
}
})();
