/* ne-for.ru — «Для всех»: тест, фишинг или нет, проверка пароля, кнопка «Паника» */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const ach = id => window.ach?.(id);
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);

document.querySelectorAll('#ftabs .tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#ftabs .tab').forEach(x=>x.classList.toggle('on',x===t));
  document.querySelectorAll('.fpane').forEach(p=>p.classList.toggle('on',p.id==='f-'+t.dataset.f));
});

/* ================= ТЕСТ «КАКОЙ ТЫ ПОЛЬЗОВАТЕЛЬ» ================= */
const TYPES={
 sticker:{t:'Хранитель стикеров',d:'Пароли на мониторе, напоминания на клавиатуре, важное на обороте кружки. У тебя всё под рукой, в том числе у любого, кто пройдёт мимо.',tip:'Заведи менеджер паролей. Стикеры оставь для списка покупок.'},
 reboot:{t:'Великий перезагрузчик',d:'Ты знаешь главный секрет IT: выключить и включить. В 80% случаев это работает, и ты этим гордишься по праву.',tip:'Оставшиеся 20% лучше описать админу словами: что делал и что увидел.'},
 clicker:{t:'Открыватель вложений',d:'Письмо «Вы выиграли»? Открыть! Ссылка «Срочно подтвердите»? Перейти! Ты любопытен, и безопасники знают тебя по имени.',tip:'Перед кликом наведи на ссылку и посмотри, куда она ведёт на самом деле.'},
 panic:{t:'Паникёр',d:'«ВСЁ СЛОМАЛОСЬ!!!» — это ты про погасший монитор, у которого выпал кабель. Зато ты всегда сообщаешь о проблемах сразу.',tip:'Перед звонком глубокий вдох и проверка кабеля. Потом можно паниковать.'},
 friend:{t:'Друг админа',d:'Пишешь заявки со скриншотами, обновляешься вовремя и приносишь шоколадку. Админы тебя ценят и чинят твоё вне очереди.',tip:'Продолжай в том же духе. И научи коллег.'},
};
const Q=[
 ['Компьютер завис. Твои действия?',[['Перезагружаю, пока не отвиснет','reboot'],['Звоню админу: ВСЁ СЛОМАЛОСЬ','panic'],['Жду минуту и открываю диспетчер задач','friend'],['Жму на всё подряд, вдруг поможет','clicker']]],
 ['Где ты хранишь пароли?',[['На стикере на мониторе','sticker'],['В менеджере паролей','friend'],['Один пароль на всё, помню наизусть','clicker'],['Каждый раз сбрасываю через админа','panic']]],
 ['Пришло письмо «Ваш ящик переполнен, перейдите по ссылке».',[['Перехожу, конечно','clicker'],['Пересылаю админу с вопросом','friend'],['Пишу всему отделу, что нас взломали','panic'],['Удаляю. Пароль всё равно на стикере','sticker']]],
 ['Принтер не печатает.',[['Отправляю документ ещё десять раз','clicker'],['Выключаю и включаю принтер','reboot'],['Проверяю бумагу и очередь печати','friend'],['Пишу в общий чат «кто сломал принтер?!»','panic']]],
 ['Windows предлагает обновиться.',[['Откладываю на «завтра» уже год','sticker'],['Соглашаюсь, это же безопасность','friend'],['Выдёргиваю шнур, чтобы не обновлялся','panic'],['Жму «Перезагрузить сейчас» посреди созвона','reboot']]],
 ['Твой рабочий стол выглядит как…',[['Сотня ярлыков и «Новый документ (14)»','clicker'],['Три папки, всё по порядку','friend'],['Стикеры по периметру монитора','sticker'],['Не знаю, после перезагрузки всё куда-то девается','reboot']]],
 ['Что ты говоришь админу чаще всего?',[['«Я ничего не трогал»','clicker'],['«Спасибо!» и шоколадка','friend'],['«Я уже перезагружал, три раза»','reboot'],['«СРОЧНО!!!»','panic']]],
 ['Коллега спрашивает пароль от Wi-Fi.',[['Показываю стикер','sticker'],['Отправляю QR-код гостевой сети','friend'],['Перезагружаю роутер, вдруг пароль сбросится','reboot'],['Пишу админу: «У нас нет интернета!»','panic']]],
];
let qi=0,qs={};const qEl=$('#f-quiz');
function quizRender(){
  if(qi>=Q.length){const top=Object.entries(qs).sort((a,b)=>b[1]-a[1])[0][0],T=TYPES[top],tot=Q.length;ach('quiz');
    qEl.innerHTML=`<div class="qz-res"><div class="qz-eyebrow">Твой тип</div><h3 class="qz-title" data-scramble>${h(T.t)}</h3><p>${h(T.d)}</p>
     <div class="qz-bars">${Object.entries(TYPES).map(([k,t])=>`<div><span>${h(t.t)}</span><div class="meter"><i style="width:${Math.round((qs[k]||0)/tot*100)}%"></i></div><em>${Math.round((qs[k]||0)/tot*100)}%</em></div>`).join('')}</div>
     <p class="qz-tip"><b>Совет от админа:</b> ${h(T.tip)}</p>
     <div class="row"><button class="btn" id="qz-share" style="flex:0 0 auto">Скопировать результат</button><button class="btn ghost" id="qz-again" style="flex:0 0 auto">Пройти ещё раз</button></div></div>`;
    $('#qz-share').onclick=()=>copy(`Я прошёл тест на ne-for.ru: я — «${T.t}». А ты какой пользователь? https://ne-for.ru/#fun`);
    $('#qz-again').onclick=()=>{qi=0;qs={};quizRender()};window.scramble?.(qEl.querySelector('.qz-title'));return}
  const [q,a]=Q[qi];
  qEl.innerHTML=`<div class="qz"><div class="qz-top"><span>Вопрос ${qi+1} из ${Q.length}</span><div class="meter"><i style="width:${qi/Q.length*100}%"></i></div></div>
   <h3 class="qz-q">${h(q)}</h3><div class="qz-a">${shuffle(a).map(x=>`<button class="dk-opt" data-t="${x[1]}">${h(x[0])}</button>`).join('')}</div></div>`;
  qEl.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{qs[b.dataset.t]=(qs[b.dataset.t]||0)+1;b.classList.add('picked');qEl.querySelectorAll('[data-t]').forEach(x=>x.disabled=true);setTimeout(()=>{qi++;quizRender()},280)});
}
quizRender();

/* ================= ФИШИНГ ИЛИ НЕТ ================= */
/* все компании и адреса вымышленные: «Ромашка», банк «Северный» */
const MAIL=[
 {ph:1,fn:'Служба поддержки почты',fa:'support@mail-romashka-help.ru',s:'Ваш почтовый ящик переполнен на 99%',b:'Уважаемый пользователь!\nВаш ящик переполнен. Через 24 часа входящие письма будут удаляться. Чтобы увеличить квоту, подтвердите учётные данные.',link:['Увеличить квоту','http://romashka-mail.quota-upgrade.top/login'],
  why:['Адрес не из домена компании: mail-romashka-help.ru вместо romashka.ru','Давление сроком: «через 24 часа»','Просят ввести пароль по ссылке на чужой сайт']},
 {ph:0,fn:'IT-отдел',fa:'it@romashka.ru',s:'Плановые работы в субботу с 10:00 до 14:00',b:'Коллеги, в субботу обновляем почтовый сервер. Почта будет недоступна с 10:00 до 14:00. Ничего делать не нужно.\nВопросы: доб. 305.',
  why:['Внутренний домен romashka.ru','Нет ссылок и вложений','Ничего не просят ввести или оплатить']},
 {ph:1,fn:'Игорь Владимирович',fa:'direktor.romashka@gmail.com',s:'Срочно! Оплатить сегодня',b:'Нужно срочно оплатить счёт поставщику, реквизиты во вложении. Я на совещании, не звоните, просто сделайте до 15:00.',att:'Счёт_№847.pdf.exe',
  why:['Директор пишет с личной почты на gmail.com','«Не звоните» — чтобы нельзя было проверить','Вложение .pdf.exe — это программа, а не документ']},
 {ph:0,fn:'Бухгалтерия',fa:'buh@romashka.ru',s:'Расчётные листы за сентябрь',b:'Расчётные листы за сентябрь доступны в личном кабинете 1С. Если что-то не сходится, напишите нам.',
  why:['Внутренний адрес','Никаких ссылок: всё в привычной 1С','Тон спокойный, без срочности']},
 {ph:1,fn:'Банк «Северный»',fa:'security@severny-bank-verify.com',s:'Ваша карта заблокирована',b:'Зафиксирована подозрительная операция. Карта временно заблокирована. Подтвердите данные карты в течение 24 часов, иначе счёт будет закрыт.',link:['Подтвердить данные','https://severny-bank-verify.com/card/unlock'],
  why:['Банки не просят «подтвердить данные карты» по ссылке','Домен с лишним словом verify','Угроза закрыть счёт']},
 {ph:0,fn:'Ольга Смирнова',fa:'o.smirnova@romashka.ru',s:'Файлы по проекту',b:'Привет! Положила макеты в общую папку \\\\srv-files\\Проекты\\Каталог. Посмотри, пожалуйста, до пятницы.',
  why:['Коллега с корпоративного адреса','Ссылка на внутреннюю общую папку, а не на внешний сайт','Обычная рабочая просьба']},
 {ph:1,fn:'Служба доставки',fa:'info@dostavka-track.xyz',s:'Посылка не доставлена',b:'Ваша посылка ожидает на складе. Для повторной доставки оплатите хранение 89 ₽.',link:['Оплатить 89 ₽','https://dostavka-track.xyz/pay'],
  why:['Вы ничего не заказывали на рабочую почту','Маленькая сумма, чтобы не задумывались','Странный домен .xyz']},
 {ph:1,fn:'IT-отдел',fa:'it@r0mashka.ru',s:'Смените пароль: срок истекает сегодня',b:'Срок действия вашего пароля истекает сегодня. Чтобы не потерять доступ, смените пароль по ссылке.',link:['Сменить пароль','https://r0mashka-login.ru/reset'],
  why:['r0mashka.ru: ноль вместо буквы «о»','Пароль в домене меняют через Ctrl+Alt+Del, а не по ссылке','Срочность: «истекает сегодня»']},
 {ph:0,fn:'Отдел кадров',fa:'hr@romashka.ru',s:'Поздравляем с днём рождения!',b:'Дорогая команда, сегодня день рождения у нашего коллеги из отдела продаж. Торт в переговорке в 16:00!',
  why:['Внутренний адрес','Ничего не просят','Торт реален, проверено']},
 {ph:1,fn:'Розыгрыш призов',fa:'promo@lucky-prize.win',s:'Поздравляем! Вы выиграли смартфон',b:'Ваш адрес выбран случайным образом. Чтобы получить приз, оплатите доставку и укажите данные карты.',link:['Забрать приз','https://lucky-prize.win/claim'],
  why:['Вы не участвовали в розыгрыше','Платить за «бесплатный» приз','Домен .win']},
];
let pm=[],pi=0,pok=0,pans=null;const pEl=$('#f-phish');
function phNew(){pm=shuffle(MAIL);pi=0;pok=0;pans=null;phRender()}
function phRender(){
  if(pi>=pm.length){const r=pok===10?'Безопасник года. Тебя не проведёшь.':pok>=8?'Хорошо! Пару писем стоит перечитать.':pok>=5?'Средне. Мошенники уже потирают руки.':'Срочно к админу на инструктаж.';
    if(pok===10)ach('phish');
    pEl.innerHTML=`<div class="qz-res"><div class="qz-eyebrow">Результат</div><h3 class="qz-title" data-scramble>${pok} из ${pm.length}</h3><p>${r}</p>
     <p class="qz-tip"><b>Три правила:</b> проверяй домен отправителя, наводи на ссылку перед кликом, не верь срочности.</p><button class="btn" id="ph-again">Ещё раз</button></div>`;
    $('#ph-again').onclick=phNew;window.scramble?.(pEl.querySelector('.qz-title'));return}
  const m=pm[pi],done=pans!==null,right=done&&pans===!!m.ph;
  pEl.innerHTML=`<div class="qz-top"><span>Письмо ${pi+1} из ${pm.length} · верно: ${pok}</span><div class="meter"><i style="width:${pi/pm.length*100}%"></i></div></div>
   <div class="mail${done?(m.ph?' is-ph':' is-ok'):''}"><div class="mail-h"><div class="mail-av">${h(m.fn[0])}</div><div><b>${h(m.fn)}</b> <span class="mail-a">&lt;${h(m.fa)}&gt;</span><div class="mail-to">кому: мне · сегодня, ${9+pi}:${String(7*pi%60).padStart(2,'0')}</div></div></div>
    <div class="mail-s">${h(m.s)}</div><div class="mail-b">${h(m.b).replace(/\n/g,'<br>')}</div>
    ${m.link?`<button class="mail-link" data-url="${h(m.link[1])}">${h(m.link[0])}</button>`:''}${m.att?`<div class="mail-att">Вложение: ${h(m.att)}</div>`:''}
    <div class="mail-status" id="mail-st">${m.link?'Наведи или нажми на кнопку в письме, чтобы увидеть, куда она ведёт':'&nbsp;'}</div></div>
   ${done?`<div class="dk-res ${right?'ok':'bad'}"><b>${right?'Верно':'Мимо'}: ${m.ph?'это фишинг':'это настоящее письмо'}</b><ul class="ph-why">${m.why.map(w=>`<li>${h(w)}</li>`).join('')}</ul></div><button class="btn" id="ph-next">${pi<pm.length-1?'Следующее письмо':'Итог'}</button>`
    :`<div class="ph-btns"><button class="btn ghost" data-a="0">Настоящее</button><button class="btn" data-a="1">Фишинг</button></div>`}`;
  const L=pEl.querySelector('.mail-link');if(L){const show=()=>{$('#mail-st').textContent=L.dataset.url};L.onmouseenter=show;L.onfocus=show;L.onclick=show}
  pEl.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{pans=b.dataset.a==='1';if(pans===!!m.ph)pok++;phRender()});
  const nx=$('#ph-next');if(nx)nx.onclick=()=>{pi++;pans=null;phRender()};
}
phNew();

/* ================= ПРОВЕРКА ПАРОЛЯ ================= */
const COMMON='123456 password 12345678 qwerty 123456789 12345 1234 111111 1234567 dragon 123123 abc123 football monkey letmein shadow master 666666 qwertyuiop 123321 1234567890 654321 superman 1qaz2wsx 7777777 121212 000000 qazwsx 123qwe killer trustno1 zxcvbnm asdfgh hunter soccer batman sunshine iloveyou charlie starwars 112233 computer 1111 zxcvbn 555555 11111111 freedom 777777 pass princess summer love admin qwerty123 password1 1q2w3e4r 1q2w3e admin123 welcome пароль йцукен привет любовь 123qweasd qweasd zaq12wsx'.split(' ');
const WORDS='password admin qwerty love welcome dragon monkey master login user test pass secret пароль привет любовь солнце котик'.split(' ');
const SEQ=['abcdefghijklmnopqrstuvwxyz','qwertyuiopasdfghjklzxcvbnm','йцукенгшщзхъфывапролджэячсмитьбю','абвгдеёжзийклмнопрстуфхцчшщъыьэюя','01234567890'];
const leet=s=>s.toLowerCase().replace(/@/g,'a').replace(/0/g,'o').replace(/[1!]/g,'i').replace(/3/g,'e').replace(/\$/g,'s').replace(/5/g,'s').replace(/7/g,'t');
function crack(pw){
  if(!pw)return null;const low=pw.toLowerCase(),notes=[];
  if(COMMON.includes(low)||COMMON.includes(leet(pw)))return{bits:4,notes:['Этот пароль в списке самых популярных. Его проверяют первым.']};
  let pool=0;if(/[a-z]/.test(pw))pool+=26;if(/[A-Z]/.test(pw))pool+=26;if(/[а-яё]/.test(pw))pool+=33;if(/[А-ЯЁ]/.test(pw))pool+=33;if(/\d/.test(pw))pool+=10;if(/[^a-zA-Zа-яА-ЯёЁ\d]/.test(pw))pool+=33;
  const per=Math.log2(pool||1);let bits=pw.length*per;
  const lw=leet(pw);WORDS.forEach(w=>{if(lw.includes(w)){bits-=(w.length*per)-10;notes.push(`Внутри есть словарное слово «${w}»: его перебирают целиком.`)}});
  SEQ.forEach(sq=>{for(let L=pw.length;L>=4;L--){let hit=false;for(let i=0;i+L<=low.length;i++){const sub=low.slice(i,i+L);if(sq.includes(sub)){bits-=(L*per)-6;notes.push(`«${pw.slice(i,i+L)}» — это клавиши подряд или последовательность.`);hit=true;break}}if(hit)break}});
  const rep=pw.match(/(.)\1{2,}/g);if(rep){rep.forEach(r=>{bits-=(r.length-1)*per});notes.push('Повторяющиеся символы почти не добавляют стойкости.')}
  const yr=pw.match(/(19|20)\d\d/);if(yr){bits-=4*per-7;notes.push(`«${yr[0]}» похоже на год. Годы перебирают в первую очередь.`)}
  if(/^[A-ZА-Я][a-zа-я]+\d+[!.?]?$/.test(pw))notes.push('Схема «Слово + цифры + !» известна всем программам перебора.');
  if(pw.length<10)notes.push('Короче 10 символов: длина важнее хитрых символов.');
  return{bits:Math.max(1,bits),notes}}
function human(sec){if(sec<1)return 'мгновенно';const u=[['лет',31557600],['дней',86400],['часов',3600],['минут',60],['секунд',1]];
  if(sec>31557600*1.4e10)return 'дольше, чем существует Вселенная';if(sec>31557600*1e6)return `${(sec/31557600/1e6).toFixed(0)} млн лет`;if(sec>31557600*1e3)return `${Math.round(sec/31557600/1e3)} тыс. лет`;
  for(const[n,s]of u)if(sec>=s)return `${Math.round(sec/s)} ${n}`}
const LV=[[0,'Взломают быстрее, чем ты моргнёшь.','bad'],[28,'Продержится до конца обеденного перерыва.','bad'],[40,'Пару дней на видеокарте, и всё.','warn'],[55,'Уже неплохо. Можно спать спокойно.','ok'],[70,'Хороший пароль. Хакер пойдёт к соседу.','ok'],[90,'Параноидально хорош.','ok']];
const pw=$('#pw-in'),pwOut=$('#pw-out');
function pwRun(){const r=crack(pw.value);if(!r){pwOut.innerHTML='<p class="muted">Начни вводить: оценка появится сразу.</p>';$('#pw-bar').style.width='0';return}
  const sec=Math.pow(2,r.bits)/2/1e10,lv=[...LV].reverse().find(l=>r.bits>=l[0]);
  $('#pw-bar').style.width=Math.min(100,r.bits/1.1)+'%';$('#pw-bar').style.background=`var(--${lv[2]==='ok'?'acc':lv[2]})`;
  pwOut.innerHTML=`<div class="pw-time"><span>Взломают перебором за</span><b class="${lv[2]}">${human(sec)}</b></div><p class="pw-say">${lv[1]}</p>
   ${r.notes.length?`<ul class="ph-why">${[...new Set(r.notes)].map(n=>`<li>${h(n)}</li>`).join('')}</ul>`:''}
   <p class="muted" style="font-size:12px">Оценка для офлайн-перебора на видеокарте, 10 млрд вариантов в секунду: так ломают утёкшие базы. Стойкость ≈ ${Math.round(r.bits)} бит.</p>`;
  if(sec>31557600*1.4e10)ach('strongpass')}
pw.oninput=pwRun;$('#pw-show').onclick=()=>{pw.type=pw.type==='password'?'text':'password';$('#pw-show').textContent=pw.type==='password'?'показать':'скрыть'};pwRun();

/* ================= ПАНИКА ================= */
const PN=$('#panic');
function panicOn(){if(!PN.hidden)return;ach('panic');window.nfMusic?.pause();const cols='ABCDEFGHI',rows=28,names=['Регион','Январь','Февраль','Март','Апрель','Май','Июнь','Итого','Δ %'],reg=['Москва','Санкт-Петербург','Казань','Новосибирск','Екатеринбург','Самара','Псков','Великие Луки','Тверь','Смоленск'];
  let row=[];let t='<table><thead><tr><th></th>'+[...cols].map(c=>`<th>${c}</th>`).join('')+'</tr></thead><tbody>';
  for(let r=1;r<=rows;r++){t+=`<tr><th>${r}</th>`;for(let c=0;c<cols.length;c++){let v='';if(r===1)v=names[c];else if(r-2<reg.length){if(c===0){v=reg[r-2];row=[]}else if(c<7){const n=Math.random()*900+100;row.push(n);v=n.toFixed(1).replace('.',',')}else if(c===7)v=row.reduce((a,b)=>a+b,0).toFixed(1).replace('.',',');else v=(Math.random()*30-10).toFixed(1).replace('.',',')+'%'}
    t+=`<td class="${r===1?'hd':''}${c>0&&r>1?' n':''}${r===3&&c===7?' sel':''}">${v}</td>`}t+='</tr>'}
  PN.querySelector('.xl-grid').innerHTML=t+'</tbody></table>';PN.hidden=false;document.body.style.overflow='hidden';PN.dataset.title=document.title;document.title='Отчёт_продажи_Q3.xlsx';PN.dataset.t=Date.now()}
function panicOff(){if(PN.hidden||Date.now()-PN.dataset.t<400)return;PN.hidden=true;document.body.style.overflow='';document.title=PN.dataset.title||document.title}
window.panicOn=panicOn;
$('#panicBtn').onclick=panicOn;$('#panic-go')?.addEventListener('click',panicOn);
addEventListener('keydown',e=>{if(e.code==='Backquote'&&!/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName)&&PN.hidden){e.preventDefault();panicOn()}else if(!PN.hidden){e.preventDefault();panicOff()}},true);
PN.addEventListener('click',panicOff);
if(typeof CMDS!=='undefined'){CMDS.panic=()=>{setTimeout(panicOn,200);return 'Шеф идёт…'};CMDS.quiz=()=>{location.hash='fun';return 'Какой ты пользователь? →'}}
})();
