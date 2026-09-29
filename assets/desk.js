/* ne-for.ru — Сервис-деск: симулятор первой линии */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };

/* Опция: [текст ответа, куда дальше | #ok | #bad | #esc, влияние на оценку, системная запись, итог (для финала)] */
const S = [
{who:'Светлана Петровна',dept:'Бухгалтерия',pc:'BUH-PC07',pr:'high',cat:'1С',subj:'1С не запускается',
 first:'Добрый день. 1С не открывается вообще. Мне до обеда отчёт в налоговую сдавать!!!',
 n:{a:{o:[['Что именно пишет на экране? Пришлите скрин, пожалуйста','b',1],['Перезагрузите компьютер','a2',0],['Это вопрос к 1С-нику, не ко мне','#bad',-2,0,'Светлана Петровна пошла к директору. Директор идёт к тебе.']]},
  a2:{u:'Перезагрузила. Всё то же самое. Время идёт!!',o:[['Пришлите скрин ошибки','b',0],['Пришлите ID AnyDesk, посмотрю сам','c',0]]},
  b:{u:'[скриншот.png]\n«Недостаточно свободного места на диске». Это как вообще?',o:[['Пришлите ID AnyDesk, подключусь и почищу','c',1],['Удалите что-нибудь ненужное с рабочего стола','b2',-1]]},
  b2:{u:'Удалила ярлык 1С, он всё равно не работал. Теперь его вообще нет.',o:[['Ничего страшного, ярлык верну. Пришлите ID AnyDesk','c',0]]},
  c:{u:'AnyDesk: 482 915 037. Только быстрее!',o:[['Подключаюсь: чищу Temp и кэш 1С, переношу «Загрузки» на диск D','#ok',1,'AnyDesk: сеанс установлен · BUH-PC07','Освободилось 38 ГБ, 1С запустилась, отчёт ушёл. «Спасибо, золотой человек!»'],['Подключаюсь и форматирую диск C, так быстрее','#bad',-3,'AnyDesk: сеанс установлен · BUH-PC07','Быстрее не стало. Отчёт тоже не ушёл.']]}}},

{who:'Игорь Владимирович',dept:'Генеральный директор',pc:'CEO-NB01',pr:'crit',cat:'VPN',vip:1,subj:'Не подключается VPN',
 first:'Не могу подключиться к VPN. Я в командировке, через 20 минут совещание. Срочно.',
 n:{a:{o:[['Что пишет при подключении?','b',1],['Перезагрузите ноутбук','a2',-1],['Создам заявку, рассмотрим в течение 3 рабочих дней','#bad',-3,0,'Тебя вызвали на ковёр. Прямо в чат.']]},
  a2:{u:'Перезагрузил. Совещание через 15 минут.',o:[['Что пишет при подключении?','b',0]]},
  b:{u:'«Удалённый сервер не отвечает». Я в гостинице, сижу на их Wi-Fi.',o:[['Раздайте интернет с телефона и попробуйте снова','c',1],['Попросите на ресепшене открыть порты','b2',-1]]},
  b2:{u:'На ресепшене спросили, что такое порт. Совещание через 10 минут.',o:[['Раздайте интернет с телефона и попробуйте','c',0]]},
  c:{u:'С телефона подключилось. А почему с Wi-Fi нет?',o:[['Гостиничный Wi-Fi режет VPN. Добавлю вам резервный профиль через 443 порт, будет работать везде','#ok',1,0,'Совещание прошло. Директор запомнил, что ты молодец.'],['Не знаю, работает и хорошо','#ok',-1,0,'Совещание прошло. В следующей командировке всё повторится.']]}}},

{who:'Артём Смирнов',dept:'Отдел продаж',pc:'SALE-NB12',pr:'normal',cat:'Учётная запись',subj:'Не могу войти в компьютер',
 first:'Здравствуйте, не могу войти в компьютер, пишет, что учётная запись заблокирована.',
 n:{a:{o:[['Сейчас проверю вашу учётку в AD','b',1,'AD: a.smirnov заблокирован (5 неудачных попыток входа)'],['Скажите ваш пароль, я проверю','#bad',-3,0,'Пароль теперь знают двое. Служба безопасности знает, что трое.'],['Попробуйте ещё раз, внимательнее','a2',-1]]},
  a2:{u:'Попробовал ещё 3 раза. Пишет то же самое, но как будто злее.',o:[['Сейчас проверю учётку в AD','b',0,'AD: a.smirnov заблокирован (8 неудачных попыток входа)']]},
  b:{u:'Я вчера пароль менял, может в этом дело?',o:[['Разблокировал. Проверьте Caps Lock и раскладку и войдите новым паролем','#ok',1,'AD: учётная запись разблокирована','Был включён Caps Lock. Вошёл с первой попытки.'],['Сброшу пароль на 123456, так проще','#bad',-2,'AD: пароль сброшен','Через неделю пароль 123456 нашли ещё у шести человек.']]}}},

{who:'Николай',dept:'Склад',pc:'TSD-03',pr:'high',cat:'Оборудование',subj:'Сканер маркировки не пищит',
 first:'Сканер Честного ЗНАКа не пищит. Машина под погрузкой стоит.',
 n:{a:{o:[['Он заряжен? Индикатор горит?','b',1],['Переустановлю драйвер, пришлите AnyDesk','a2',-1],['Работайте пока по бумажке','#bad',-2,0,'Отгрузка встала. Бумажка маркировку не сканирует.']]},
  a2:{u:'Какой AnyDesk, это сканер. Он к компу вообще не подключается.',o:[['Понял. Он заряжен? Индикатор горит?','b',0]]},
  b:{u:'Индикатор не горит... А, он же на базе не стоял с пятницы.',o:[['Поставьте его на зарядку, а пока возьмите запасной из шкафа в серверной','#ok',1,0,'Запасной сработал, машину отгрузили вовремя.'],['Ну вот, сами разобрались','#ok',0,0,'Машина простояла 40 минут, пока сканер заряжался.']]}}},

{who:'«Техподдержка Microsoft»',dept:'Внешний номер',pc:'—',pr:'crit',cat:'Безопасность',subj:'Вирус на вашем сервере!',
 first:'Здравствуйте, это служба поддержки Microsoft. На вашем сервере обнаружен вирус. Установите AnyDesk и продиктуйте код, мы бесплатно удалим угрозу.',
 n:{a:{o:[['Вот код: 715 402 889','#bad',-4,'AnyDesk: входящее подключение с неизвестного ID','Через час файлы на сервере зашифрованы. Бэкап, к счастью, был. Наверное.'],['Из какого вы отдела? Назовите номер нашего договора','b',1],['Закрываю обращение и предупреждаю всех в общем чате','#ok',1,0,'Через 10 минут этот же «Microsoft» звонил бухгалтеру. Она прочитала чат и положила трубку.']]},
  b:{u:'Эм... отдел безопасности Windows. Договор номер 1. Быстрее, вирус распространяется!',o:[['Закрываю, номер в чёрный список, сотрудников предупреждаю','#ok',1,'Телефония: номер добавлен в чёрный список','Атака отбита. В общем чате все поставили лайк.'],['Ну раз договор номер 1, диктую код','#bad',-4,0,'«Номер 1» оказался не договором.']]}}},

{who:'Елена Викторовна',dept:'Юридический отдел',pc:'LAW-PC02',pr:'high',cat:'ЭДО / ЭП',subj:'Не подписывается договор в Диадоке',
 first:'Не могу подписать договор в Диадоке, пишет ошибку сертификата. Контрагент ждёт.',
 n:{a:{o:[['Сейчас проверю срок сертификата по реестру ЭП','b',1,'Реестр ЭП: сертификат истёк вчера в 23:59'],['Вставьте токен в другой USB-порт','a2',0],['Подпишите ручкой и отправьте скан','#bad',-2,0,'Контрагент вежливо напомнил, что у вас вообще-то ЭДО.']]},
  a2:{u:'Переставила. Та же ошибка.',o:[['Проверю срок сертификата по реестру','b',0,'Реестр ЭП: сертификат истёк вчера в 23:59']]},
  b:{u:'Истёк?! И что теперь, договор сорвётся?',o:[['Подпишет генеральный своей ЭП, а вам сегодня заказываю перевыпуск','#ok',1,0,'Договор подписан. В реестр ЭП добавлено напоминание за 30 дней.'],['Ну истёк и истёк, закажите в удостоверяющем центре сами','#ok',-2,0,'Договор подписали через три дня. Контрагент уже не ждал.']]}}},

{who:'Ольга',dept:'Отдел продаж',pc:'SALE-PC04',pr:'normal',cat:'Печать',subj:'Принтер печатает иероглифы',
 first:'Принтер печатает какие-то иероглифы. Уже пачку бумаги извёл.',
 n:{a:{o:[['Сейчас очищу очередь печати на сервере','b',1,'Сервер печати: удалено задание (PDF, 2 400 страниц, RAW)'],['Выключите и включите принтер','a2',0],['Это японский. Учите','#bad',-1,0,'Шутку оценил только принтер.']]},
  a2:{u:'Включила. Он продолжил печатать иероглифы. С новыми силами.',o:[['Очищу очередь печати','b',0,'Сервер печати: удалено задание (PDF, 2 400 страниц, RAW)']]},
  b:{u:'Перестал! А что это было?',o:[['Кто-то отправил PDF через неправильный драйвер. Поставлю вам корректный, чтобы не повторилось','#ok',1,0,'Иероглифы больше не появлялись.'],['Бывает','#ok',0,0,'Через два дня бывает снова.']]}}},

{who:'Кристина',dept:'Маркетинг',pc:'MRK-PC01',pr:'low',cat:'Доступ',subj:'Нужны права администратора',
 first:'Дайте мне права администратора, пожалуйста. Хочу поставить Фотошоп и пару шрифтов.',
 n:{a:{o:[['Права не дам, но всё поставлю сам. Пришлите ID AnyDesk','b',1],['Хорошо, добавлю вас в локальные админы','#bad',-2,'AD: пользователь добавлен в Administrators','Вместе с Фотошопом установились три тулбара, майнер и «Оптимизатор ПК».'],['Нельзя. Не положено','#ok',-1,0,'Кристина обиделась и нарисовала баннер в Paint.']]},
  b:{u:'AnyDesk: 305 118 772. А шрифты тоже поставите? Их 400 штук.',o:[['Поставлю. Фотошоп возьму из нашего лицензионного дистрибутива','#ok',1,'AnyDesk: сеанс установлен · MRK-PC01','Фотошоп и 400 шрифтов на месте. Word теперь открывается на 3 секунды дольше.']]}}},

{who:'Марина',dept:'Бухгалтерия',pc:'BUH-PC03',pr:'high',cat:'Почта',subj:'Не приходят письма',
 first:'У меня уже час не приходят письма. Жду платёжку от контрагента.',
 n:{a:{o:[['У коллег почта приходит?','b',1],['Посмотрите в папке «Спам»','a2',0]]},
  a2:{u:'Там только реклама окон. Платёжки нет.',o:[['У коллег почта приходит?','b',0]]},
  b:{u:'Спросила. Ни у кого не приходит уже час!',o:[['Проверю почтовый сервер','c',1,'srv-mail01: в очереди 1 842 письма, диск E: заполнен на 100%'],['Наверное, у провайдера проблемы','#bad',-2,0,'Провайдер ни при чём. Почта лежала до вечера.']]},
  c:{u:'Ну что там?',o:[['Кончилось место под базы. Расширил диск, очередь пошла, письма придут за 5 минут','#ok',1,'srv-mail01: диск расширен, очередь отправляется','Платёжка пришла. Место на диске теперь мониторится в Zabbix.'],['Передаю подрядчику по почтовому серверу','#esc',0,0,'Подрядчик ответит завтра. Почта пришла послезавтра.']]}}},

{who:'Сергей Иванович',dept:'Охрана',pc:'SEC-PC01',pr:'normal',cat:'Видеонаблюдение',subj:'Не показывают камеры на 2 этаже',
 first:'На втором этаже не показывают камеры 5, 6 и 7. Чёрный экран.',
 n:{a:{o:[['Сейчас посмотрю коммутатор, к которому они подключены','b',1,'sw-2floor: порты 5–7, питание PoE отключено (превышен бюджет)'],['Протрите объективы','a2',-1]]},
  a2:{u:'Протёр. Экран чёрный, но теперь чистый.',o:[['Посмотрю коммутатор','b',0,'sw-2floor: порты 5–7, питание PoE отключено (превышен бюджет)']]},
  b:{u:'Что-то нашли?',o:[['В этот свитч подключили новую камеру на парковку, бюджета PoE не хватило. Переношу её на соседний свитч','#ok',1,'sw-2floor: PoE на портах 5–7 восстановлено','Все камеры показывают.'],['Перезагружу весь коммутатор','#ok',-1,'sw-2floor: перезагрузка…','Камеры вернулись, но через час снова погасли.']]}}},

{who:'Анна',dept:'Отдел кадров',pc:'HR-PC01',pr:'low',cat:'Учётная запись',subj:'Увольнение сотрудника',
 first:'Иванов с сегодняшнего дня уволен. Отключите ему всё, пожалуйста.',
 n:{a:{o:[['Уточните, что именно у него было?','b',1],['Отключаю учётку, почту перенаправляю руководителю','#ok',0,'AD: i.ivanov отключён, перемещён в OU=Disabled','Учётка закрыта. Про ЭЦП Иванова вспомнили через месяц.'],['Удаляю учётку и почтовый ящик','#bad',-2,'AD: i.ivanov удалён','Через неделю понадобилась переписка Иванова с поставщиком. Её больше нет.']]},
  b:{u:'Компьютер, почта, 1С, пропуск. И он ещё ЭЦП получал.',o:[['Отключаю AD и 1С, почту руководителю, сертификат отзываю, пропуск блокирую в СКУД','#ok',1,'СКУД: пропуск №0457 заблокирован','Все хвосты подчищены. Кадры довольны.']]}}},

{who:'Валентина Ивановна',dept:'Приёмная',pc:'REC-PC01',pr:'low',cat:'Оборудование',subj:'Мышка не работает',
 first:'Мышка не работает. Курсор стоит и ни в какую.',
 n:{a:{o:[['Батарейку в мышке меняли?','b',1],['Пришлите ID AnyDesk','a2',-1]]},
  a2:{u:'Как я вам его пришлю, если мышка не работает?',o:[['Логично. Батарейку в мышке меняли?','b',0]]},
  b:{u:'А там есть батарейка?',o:[['Есть, снизу под крышкой. Сейчас занесу новую','#ok',1,0,'Мышка ожила. Валентина Ивановна угостила конфетой.'],['Есть. Разберётесь','#ok',-1,0,'Разобралась через час по видео в интернете.']]}}},

{who:'Дмитрий Олегович',dept:'Коммерческий директор',pc:'COM-PC01',pr:'high',cat:'Сеть',vip:1,subj:'Интернет еле грузит',
 first:'Интернет еле грузит. У соседей всё летает. Что происходит?',
 n:{a:{o:[['Гляну по графикам в Zabbix, кто грузит канал','b',1,'Zabbix: WAN загружен на 98% уже 40 минут'],['Это провайдер','#bad',-2,0,'Провайдер прислал график: у них всё хорошо. Директор переслал его тебе.'],['У вас 47 вкладок открыто','a2',-1]]},
  a2:{u:'Закрыл. Всё равно тормозит. Вы серьёзно?',o:[['Гляну графики в Zabbix','b',0,'Zabbix: WAN загружен на 98% уже 40 минут']]},
  b:{u:'И кто виноват?',o:[['Один ПК качает торрент на весь канал. Ограничил ему скорость','#ok',1,'MikroTik: queue simple add target=192.168.10.77 max-limit=5M/5M','Интернет летает. С владельцем торрента проведена беседа.'],['Не знаю, само пройдёт','#ok',-2,0,'Прошло к вечеру, когда закачка кончилась.']]}}},
];

const PR={crit:{l:'Критичный',sla:90,c:'bad'},high:{l:'Высокий',sla:150,c:'warn'},normal:{l:'Обычный',sla:210,c:'acc2'},low:{l:'Низкий',sla:300,c:'mut'}};
const BUMP={low:'normal',normal:'high',high:'crit',crit:'crit'};
const PER_SHIFT=8;
let G=null, sel=null, visible=false;

/* звук: уважает переключатель «звук» в шапке */
let AC=null;
function ding(f1=880,f2=1320){if(!store.get('nefor-sound',false))return;try{AC=AC||new (window.AudioContext||window.webkitAudioContext)();[f1,f2].forEach((f,i)=>{const o=AC.createOscillator(),g=AC.createGain();o.type='sine';o.frequency.value=f;const t=AC.currentTime+i*.12;g.gain.setValueAtTime(.06,t);g.gain.exponentialRampToValueAtTime(.0001,t+.25);o.connect(g).connect(AC.destination);o.start(t);o.stop(t+.3)})}catch(e){}}

const mmss=s=>{const a=Math.max(0,Math.ceil(s));return String(Math.floor(a/60)).padStart(2,'0')+':'+String(a%60).padStart(2,'0')};
const left=tk=>tk.sla-(( tk.closedAt ?? G.t)-tk.created);
const closed=tk=>['ok','bad','esc'].includes(tk.st);
const stars=n=>'★'.repeat(n)+'☆'.repeat(5-n);

function start(){
  const pool=[...S].sort(()=>Math.random()-.5).slice(0,PER_SHIFT);
  let at=1;G={t:0,num:1040+Math.floor(Math.random()*400),tickets:[],pend:[],over:false,
    queue:pool.map((s,i)=>{const o={s,at};at+=i===0?6:14+Math.random()*16;return o})};
  sel=null;$('#dk-start').textContent='Начать заново';render();
}
function spawn(q){
  const s=q.s,x=q.extra||{},pr=x.pr||s.pr;
  const tk={id:++G.num,s,pr,subj:x.subj||s.subj,created:G.t,sla:PR[pr].sla,node:'a',msgs:[{f:'u',t:x.first||s.first,at:G.t}],st:'open',unread:true,d:0,reopened:!!q.extra};
  G.tickets.push(tk);ding();if(!sel){sel=tk;renderChat()}
  if(typeof toast==='function'&&!visible)toast(`Новая заявка #${tk.id}: ${tk.subj}`);
}
function choose(i){
  const tk=sel;if(!tk||tk.st!=='open')return;const o=tk.s.n[tk.node].o[i];
  tk.msgs.push({f:'me',t:o[0],at:G.t});tk.d+=o[2];if(o[3])tk.msgs.push({f:'sys',t:o[3],at:G.t});
  tk.st='wait';G.pend.push({at:G.t+1.2+Math.random()*2,tk,go:o[1],end:o[4]});renderChat();renderQueue();
}
function finish(tk,go,end){
  tk.closedAt=G.t;const over=left(tk)<0;tk.overdue=over;
  let st=Math.max(1,Math.min(5,4+tk.d-(over?1:0)));
  if(go==='#bad')st=1;if(go==='#esc')st=Math.min(st,3);tk.stars=st;tk.st=go.slice(1);
  tk.msgs.push({f:'res',t:end||'Заявка закрыта.',at:G.t});
  if(go==='#bad'&&!tk.reopened){G.queue.push({s:tk.s,at:G.t+18,extra:{subj:'Повторно: '+tk.s.subj,pr:BUMP[tk.pr],first:`Заявку #${tk.id} закрыли, а проблема осталась. ${tk.s.first}`}});G.queue.sort((a,b)=>a.at-b.at)}
  ding(go==='#bad'?300:660,go==='#bad'?220:990);
}
function tick(){
  if(!G||G.over)return;
  if(document.hidden||!visible){$('#dk-clock').textContent=G.t?mmss(G.t)+' · пауза':'00:00';return}
  G.t+=.25;
  while(G.queue.length&&G.queue[0].at<=G.t)spawn(G.queue.shift());
  for(const p of [...G.pend])if(p.at<=G.t){G.pend.splice(G.pend.indexOf(p),1);const tk=p.tk;
    if(p.go.startsWith('#'))finish(tk,p.go,p.end);
    else{tk.node=p.go;tk.msgs.push({f:'u',t:tk.s.n[p.go].u,at:G.t});tk.st='open';if(sel!==tk){tk.unread=true;ding(1200,1200)}}
    if(sel===tk)renderChat()}
  if(!G.queue.length&&G.tickets.length&&G.tickets.every(closed)){G.over=true;const b=score();if(b.points>store.get('nefor-desk',0))store.set('nefor-desk',b.points);if(!b.bad&&b.closed>=8)window.ach?.('desk');if(b.avg>=4.5&&!b.over)window.ach?.('legend');sel=null;renderChat()}
  renderQueue();renderHud();
  if(sel&&!closed(sel)){const e=$('#dk-sla');if(e){const l=left(sel);e.textContent=l<0?'просрочено на '+mmss(-l):'SLA '+mmss(l);e.className='dk-sla'+(l<0?' over':l<30?' soon':'')}}
}
function score(){const c=G.tickets.filter(closed),avg=c.length?c.reduce((a,t)=>a+t.stars,0)/c.length:0;
  return{closed:c.length,avg,over:c.filter(t=>t.overdue).length,bad:c.filter(t=>t.st==='bad').length,points:c.reduce((a,t)=>a+t.stars*10-(t.overdue?5:0),0)}}
function renderHud(){
  if(!G){$('#dk-hud').innerHTML=`<span>Рекорд: <b>${store.get('nefor-desk',0)}</b></span>`;return}
  const s=score(),act=G.tickets.filter(t=>!closed(t)).length;
  $('#dk-clock').textContent=mmss(G.t);
  $('#dk-hud').innerHTML=`<span>В работе: <b>${act}</b></span><span>Закрыто: <b>${s.closed}</b></span><span>Оценка: <b>${s.closed?s.avg.toFixed(1)+' ★':'—'}</b></span><span>Просрочено: <b class="${s.over?'bad':''}">${s.over}</b></span><span>Жалобы: <b class="${s.bad?'bad':''}">${s.bad}</b></span><span>Очки: <b>${s.points}</b></span>`;
}
function renderQueue(){
  const box=$('#dk-queue');
  if(!G){box.innerHTML='<p class="dk-empty">Очередь пуста. Смена не начата.</p>';return}
  const list=[...G.tickets].sort((a,b)=>closed(a)-closed(b)||(closed(a)?b.closedAt-a.closedAt:left(a)-left(b)));
  if(!list.length){box.innerHTML='<p class="dk-empty">Тишина... Подозрительная.</p>';return}
  box.innerHTML=list.map(tk=>{const p=PR[tk.pr],l=left(tk),c=closed(tk);
    const stat=c?`<span class="dk-st ${tk.st}">${tk.st==='ok'?'решено':tk.st==='esc'?'эскалация':'жалоба'} · ${stars(tk.stars)}</span>`
      :tk.st==='wait'?'<span class="dk-st wait">ждём ответа…</span>':'<span class="dk-st open">ваш ход</span>';
    return `<button class="dk-item${tk===sel?' on':''}${tk.unread?' unread':''}${c?' done':''}" data-id="${tk.id}">
      <div class="dk-row"><span class="pill ${p.c}">${p.l}</span><span class="dk-id">#${tk.id}</span>${c?'':`<span class="dk-time${l<0?' over':l<30?' soon':''}">${l<0?'−'+mmss(-l):mmss(l)}</span>`}</div>
      <div class="dk-subj">${h(tk.subj)}</div><div class="dk-who">${h(tk.s.who)} · ${h(tk.s.dept)}</div>${stat}
      ${c?'':`<div class="dk-bar"><i style="width:${Math.max(0,Math.min(100,l/tk.sla*100))}%"></i></div>`}</button>`}).join('');
  box.querySelectorAll('.dk-item').forEach(b=>b.onclick=()=>{sel=G.tickets.find(t=>t.id===+b.dataset.id);sel.unread=false;renderQueue();renderChat()});
}
function renderChat(){
  const box=$('#dk-chat');
  if(!G||(!sel&&!G.over)){box.innerHTML=`<div class="dk-intro"><h3>Первая линия поддержки</h3>
    <p>За смену придёт ${PER_SHIFT} заявок: бухгалтерия, склад, директор и не только. У каждой свой SLA, и таймер тикает.</p>
    <p>Открывай заявку, выбирай ответ, уточняй детали, проси ID AnyDesk и подключайся. Пока пользователь печатает, переключайся на другие заявки.</p>
    <p>Кривое решение вернётся жалобой с повышенным приоритетом. В конце смены пользователи поставят оценки.</p>
    ${G?'':'<button class="btn" id="dk-go">Начать смену</button>'}</div>`;const g=$('#dk-go');if(g)g.onclick=start;return}
  if(G.over&&!sel){const s=score(),r=s.avg>=4.5&&!s.over?'Легенда первой линии':s.avg>=4?'Надёжный саппорт':s.avg>=3?'Нормально, живём':'Пользователи точат вилы';
    box.innerHTML=`<div class="dk-intro"><h3>Смена окончена</h3><p class="dk-rank">${r}</p>
    <dl class="kv"><dt>Закрыто заявок</dt><dd>${s.closed}</dd><dt>Средняя оценка</dt><dd>${s.avg.toFixed(1)} ★</dd><dt>Просрочено по SLA</dt><dd>${s.over}</dd><dt>Жалоб</dt><dd>${s.bad}</dd><dt>Очки</dt><dd>${s.points} (рекорд ${store.get('nefor-desk',0)})</dd></dl>
    <button class="btn" id="dk-go">Ещё смену</button></div>`;$('#dk-go').onclick=start;return}
  const tk=sel,p=PR[tk.pr],c=closed(tk),l=left(tk);tk.unread=false;
  const msgs=tk.msgs.map(m=>m.f==='sys'?`<div class="dk-msg sys">${h(m.t)}</div>`
    :m.f==='res'?`<div class="dk-res ${tk.st}"><b>${tk.st==='ok'?'Решено':tk.st==='esc'?'Эскалировано':'Закрыто с жалобой'}</b> · оценка ${stars(tk.stars)}${tk.overdue?' · SLA просрочен':''}<p>${h(m.t)}</p></div>`
    :`<div class="dk-msg ${m.f}"><span class="dk-from">${m.f==='me'?'Вы':h(tk.s.who)} · ${mmss(m.at)}</span>${h(m.t).replace(/\n/g,'<br>')}</div>`).join('');
  const opts=tk.st==='open'?tk.s.n[tk.node].o.map((o,i)=>`<button class="dk-opt" data-i="${i}">${h(o[0])}</button>`).join('')
    :tk.st==='wait'?`<div class="dk-typing">${h(tk.s.who)} печатает<i></i><i></i><i></i></div>`:'';
  box.innerHTML=`<div class="dk-head"><div><div class="dk-title">#${tk.id} · ${h(tk.subj)}</div>
    <div class="dk-meta"><span class="pill ${p.c}">${p.l}</span>${tk.s.vip?'<span class="pill vip">VIP</span>':''}<span>${h(tk.s.who)}</span><span>${h(tk.s.dept)}</span><span>ПК: ${h(tk.s.pc)}</span><span>${h(tk.s.cat)}</span></div></div>
    ${c?'':`<span id="dk-sla" class="dk-sla${l<0?' over':l<30?' soon':''}">${l<0?'просрочено на '+mmss(-l):'SLA '+mmss(l)}</span>`}</div>
    <div class="dk-thread" id="dk-thread">${msgs}</div><div class="dk-opts">${opts}</div>`;
  const th=$('#dk-thread');th.scrollTop=th.scrollHeight;
  box.querySelectorAll('.dk-opt').forEach(b=>b.onclick=()=>choose(+b.dataset.i));
}
function render(){renderHud();renderQueue();renderChat()}
$('#dk-start').onclick=start;
new IntersectionObserver(es=>es.forEach(e=>visible=e.isIntersecting),{threshold:.15}).observe($('#desk'));
setInterval(tick,250);render();
if(typeof CMDS!=='undefined')CMDS.desk=()=>{location.hash='desk';return 'На первую линию →'};
if(typeof CMDS!=='undefined')CMDS.anydesk=()=>'AnyDesk ID: 000 000 000. Шучу. Сначала заявку создай.';
})();
