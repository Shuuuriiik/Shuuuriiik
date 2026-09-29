/* ne-for.ru — симуляторы: инцидент в 3 ночи, firewall-тренажёр, собери сеть, сервер-тамагочи */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const pad = n => String(n).padStart(2,'0');
const shuffle = a => a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);
const ach = id => window.ach?.(id);

/* вкладки симуляторов */
document.querySelectorAll('#stabs .tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#stabs .tab').forEach(x=>x.classList.toggle('on',x===t));
  document.querySelectorAll('.spane').forEach(p=>p.classList.toggle('on',p.id==='s-'+t.dataset.s));
  if(t.dataset.s==='tama')tamaRender();
});

/* ================= ИНЦИДЕНТ В 3 НОЧИ ================= */
const ACT=[
 ['pinggw','ping шлюз 192.168.10.1',2],['pingnet','ping 8.8.8.8',2],['pingdc','ping srv-dc01',2],
 ['zbx','Zabbix: активные проблемы',3],['rlog','Роутер: /log print',4],['sw','Коммутаторы: порты и CPU',5],
 ['disk','Серверы: место на дисках',4],['evt','srv-app01: журнал событий',5],['cert','Проверить сертификаты',4],
 ['ups','ИБП: статус и журнал',3],['cfg','Роутер: история изменений',4],['guard','Позвонить охраннику',6],
];
const DEF={
 pinggw:'Ответ от 192.168.10.1: время<1 мс\nПотеряно: 0 из 4 (0%)',
 pingnet:'Ответ от 8.8.8.8: время=18 мс\nПотеряно: 0 из 4 (0%)',
 pingdc:'Ответ от 192.168.10.5: время<1 мс\nПотеряно: 0 из 4 (0%)',
 zbx:'Активных проблем нет',
 rlog:'Ничего необычного: аренды DHCP, пара дропов на input.',
 sw:'Все порты в норме, CPU 6–9%, штормов нет.',
 disk:'srv-dc01 C: 61% свободно\nsrv-app01 C: 34% свободно\nnas01: 38% свободно',
 evt:'Ошибок за последний час нет.',
 cert:'Все сертификаты действуют больше 30 дней.',
 ups:'Питание от сети, заряд 100%, нагрузка 41%.',
 cfg:'Последнее изменение: 5 дней назад (admin, добавлен address-list).',
 guard:'«Всё спокойно, никто не заходил, свет горит.»',
};
const DIAG=[['loop','Петля в локальной сети'],['disk','Кончилось место на сервере'],['cert','Истёк сертификат VPN'],['power','Пропало питание, сели батареи ИБП'],['route','Кривое изменение конфига роутера'],['isp','Авария у провайдера']];
const INC=[
 {id:'loop',alert:'sw-core: потери ICMP 80%, 34 хоста недоступны',
  o:{pinggw:'Ответ от 192.168.10.1: время=1 мс\nПревышен интервал ожидания\nПревышен интервал ожидания\nОтвет от 192.168.10.1: время=870 мс\nПотеряно: 2 из 4 (50%)',
     pingnet:'Превышен интервал ожидания\nОтвет от 8.8.8.8: время=640 мс\nПотеряно: 3 из 4 (75%)',pingdc:'Потеряно: 3 из 4 (75%)',
     zbx:'sw-core: CPU 100% уже 15 минут\nsw-2floor: 940 Мбит/с широковещательного трафика\n34 хоста: ICMP недоступен',
     sw:'sw-2floor: CPU 99%\nport 7: 45 000 пакетов/с, broadcast 97%\nport 9: 45 000 пакетов/с, broadcast 97%\nMAC 3c:52:82:aa:10:fe прыгает между портами 7 и 9\nSTP: выключен',
     rlog:'bridge-lan: MAC flapping detected (x1200)\ndhcp-lan: offering lease без ответа (x300)',
     disk:'Нет данных: серверы отвечают с потерями',evt:'Не удалось подключиться: таймаут'},
  fix:[['Отключить порт 9 на sw-2floor и включить RSTP',1,'Шторм стих за секунду. Утром выяснилось: уборщица воткнула висящий патч-корд «на место».'],['Перезагрузить sw-core',0,'Через 3 минуты после загрузки шторм вернулся. Петля-то на месте.'],['Позвонить провайдеру',0,'Провайдер 20 минут объяснял, что у них всё хорошо. И был прав.']]},
 {id:'disk',alert:'srv-app01: служба «Агент сервера 1С» остановлена',
  o:{zbx:'srv-app01: свободно на C: 0,3%\nsrv-app01: служба 1C:Enterprise Server Agent остановлена',
     disk:'srv-dc01 C: 61% свободно\nsrv-app01 C: 0,3% свободно (182 МБ)\nsrv-app01 D: 44% свободно\nnas01: 38% свободно',
     evt:'1С: не удалось записать файл журнала регистрации\nMSSQL: Could not allocate space for object in database tempdb: PRIMARY filegroup is full\nService Control Manager: служба 1C:Enterprise остановлена'},
  fix:[['Перенести журналы 1С и tempdb на диск D, почистить C, запустить службу',1,'1С поднялась к 04:00. В Zabbix добавлен триггер на 10% свободного места.'],['Перезагрузить srv-app01',0,'Сервер перезагрузился, служба упала снова через 2 минуты. Места больше не стало.'],['Удалить папку C:\\Windows\\WinSxS',0,'Сервер больше не загружается. Утро будет долгим.']]},
 {id:'cert',alert:'sstp-hub: активных туннелей 0 (было 6)',
  o:{zbx:'sstp-hub: 0 активных туннелей\nФилиалы: 6 из 6 недоступны по VPN\nИнтернет в офисе: в норме',
     rlog:'sstp,error: TLS handshake failed: certificate expired (x214)\nsstp,info: filial-3 connecting...',
     cert:'hub.example.ru (SSTP): истёк сегодня в 03:00\nsrv-mail01 (SMTP/IMAP): действует ещё 212 дней\nЭП бухгалтерии: действует ещё 41 день',
     cfg:'Последнее изменение: 12 дней назад (admin, добавлен address-list).'},
  fix:[['Выпустить новый сертификат, импортировать на хаб и назначить в SSTP-сервер',1,'Филиалы подключились за 5 минут. В календаре напоминание за 30 дней до истечения.'],['Отключить проверку сертификата на филиалах',0,'Туннели поднялись, но теперь любой может выдать себя за хаб. Утром это заметит безопасник, и ты всё равно выпустишь сертификат.'],['Перезагрузить хаб',0,'После перезагрузки сертификат всё ещё истёкший. Внезапно.']]},
 {id:'power',alert:'srv-dc01, srv-app01, nas01 недоступны',
  o:{pingdc:'Превышен интервал ожидания\nПотеряно: 4 из 4 (100%)',
     zbx:'srv-dc01: недоступен с 02:58\nsrv-app01: недоступен с 02:58\nnas01: недоступен с 02:58\nups-305: связь потеряна в 02:57',
     ups:'02:41 переход на батарею: пропало питание на вводе\n02:56 заряд 5%, команда серверам на выключение\n02:57 батарея разряжена, выход отключён\n03:02 питание на вводе восстановлено\nСостояние батарей: требуется замена (возраст 4 года)',
     guard:'«Свет моргнул где-то без двадцати три и минут двадцать не было. Сейчас всё горит.»',
     disk:'srv-dc01, srv-app01, nas01: нет данных',evt:'srv-app01 недоступен'},
  fix:[['Включить по порядку: nas01, srv-dc01, srv-app01. Утром заказать батареи',1,'К 03:40 всё поднялось в правильном порядке. Батареи заказаны, ИБП переведён на плановую замену раз в 3 года.'],['Включить всё одновременно',0,'srv-app01 загрузился раньше контроллера домена, 1С не видит пользователей. Пришлось перезагружать ещё раз.'],['Разбудить серверы по Wake-on-LAN и лечь спать',0,'Wake-on-LAN был выключен в BIOS. Серверы так и не проснулись.']]},
 {id:'route',alert:'office-gw: нет доступа в интернет',
  o:{pingnet:'Общий сбой. Заданный узел недоступен.\nПотеряно: 4 из 4 (100%)',
     zbx:'office-gw: нет доступа в интернет с 03:00\npppoe-out1: подключён, аптайм 14 дней',
     rlog:'03:00 script,info: запущен scheduler «cleanup-routes»\n03:00 route,info: маршрут 0.0.0.0/0 удалён скриптом\n03:00 netwatch: 8.8.4.4 down',
     cfg:'03:00 /ip route remove [find comment~"WAN"]\nИсточник: scheduler «cleanup-routes», создан вчера в 18:40'},
  fix:[['Вернуть маршрут по умолчанию и отключить скрипт в scheduler',1,'Интернет вернулся. Скрипт, который «чистил старые маршруты», отправлен на доработку.'],['Позвонить провайдеру',0,'Провайдер проверил линию: всё в порядке. Время идёт.'],['Перезагрузить роутер',0,'После перезагрузки маршрута всё равно нет: скрипт удалил его из конфига.']]},
 {id:'isp',alert:'office-gw: pppoe-out1 отключён',
  o:{pingnet:'Общий сбой. Заданный узел недоступен.\nПотеряно: 4 из 4 (100%)',
     zbx:'office-gw: pppoe-out1 не в сети с 02:52\nlte1: доступен, сигнал -95 dBm\nПроблем в локальной сети нет',
     rlog:'02:52 pppoe,info: pppoe-out1: peer is not responding\n02:52 pppoe,info: pppoe-out1: disconnected\n02:53–03:07 pppoe-out1: initializing... (x40)',
     sw:'office-gw ether1: линк есть, 1 Гбит/с, трафика нет\nОстальные порты в норме',
     cfg:'Последнее изменение: 5 дней назад.'},
  fix:[['Переключить трафик на LTE и открыть заявку провайдеру',1,'Офис утром даже не заметил. Провайдер нашёл обрыв на магистрали к 10:00.'],['Перезагрузить роутер',0,'Роутер перезагрузился, провайдер нет.'],['Заменить патч-корд в ether1',0,'Линк и так был. Минус 20 минут.']]},
];
let I=null;
const incEl=$('#s-inc');
function incClock(){const t=7+I.min;return pad(3+Math.floor(t/60))+':'+pad(t%60)}
function incNew(){const pool=INC.filter(x=>x.id!==I?.s.id);I={s:pool[Math.floor(Math.random()*pool.length)],min:0,used:new Set(),stage:'look',log:[],tried:new Set()};
  I.log.push(['e',`03:07 Звонит мониторинг. ${I.s.alert}`]);I.fixes=shuffle(I.s.fix);incRender()}
function incRender(){
  const done=I.stage==='done';
  incEl.innerHTML=`<div class="inc-top"><div class="inc-alert"><b>PROBLEM</b> ${h(I.s.alert)}</div><div class="inc-clock">${incClock()}</div></div>
  <div class="inc-grid"><div class="inc-acts">${ACT.map(a=>`<button class="dk-opt${I.used.has(a[0])?' used':''}" data-a="${a[0]}" ${done?'disabled':''}>${h(a[1])}<small>+${a[2]} мин</small></button>`).join('')}</div>
  <div class="inc-log" id="inc-log">${I.log.map(l=>`<div class="${l[0]}">${h(l[1]).replace(/\n/g,'<br>')}</div>`).join('')}</div></div>
  <div class="inc-decide">${I.stage==='look'?`<button class="btn" id="inc-diag" ${I.used.size?'':'disabled'}>Поставить диагноз</button><span class="muted">${I.used.size?'':'Сначала собери улики'}</span>`
    :I.stage==='diag'?`<p class="muted">Что случилось? Неверный диагноз: плюс 15 минут.</p><div class="chips">${DIAG.map(d=>`<button class="chip" data-d="${d[0]}" ${I.tried.has(d[0])?'disabled':''}>${h(d[1])}</button>`).join('')}</div><button class="btn ghost" id="inc-back">Ещё посмотреть</button>`
    :I.stage==='fix'?`<p class="muted">Причина найдена. Как чиним? Неудачная попытка: плюс 20 минут.</p><div class="inc-fixes">${I.fixes.map((f,i)=>`<button class="dk-opt" data-f="${i}" ${f.bad?'disabled':''}>${h(f[0])}</button>`).join('')}</div>`
    :`<div class="dk-res ok"><b>Инцидент закрыт в ${incClock()}</b> · ${I.min} минут<p>${h(I.result)}</p><p class="muted">${I.min<=30?'Утром никто ничего не заметил.':I.min<=60?'Нормально, ещё успеешь поспать.':'Рассвет встретил в серверной.'}</p></div>`}
  <button class="btn ghost" id="inc-new">${done?'Следующий инцидент':'Другой инцидент'}</button></div>`;
  const lg=$('#inc-log');lg.scrollTop=lg.scrollHeight;
  incEl.querySelectorAll('[data-a]').forEach(b=>b.onclick=()=>{const a=ACT.find(x=>x[0]===b.dataset.a);I.min+=a[2];I.used.add(a[0]);I.log.push(['c','> '+a[1]]);I.log.push(['',I.s.o[a[0]]||DEF[a[0]]]);incRender()});
  const dg=$('#inc-diag');if(dg)dg.onclick=()=>{I.stage='diag';incRender()};
  const bk=$('#inc-back');if(bk)bk.onclick=()=>{I.stage='look';incRender()};
  incEl.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const d=b.dataset.d;
    if(d===I.s.id){I.stage='fix';I.log.push(['ok','Диагноз подтверждается: '+DIAG.find(x=>x[0]===d)[1]])}
    else{I.min+=15;I.tried.add(d);I.log.push(['e','Версия «'+DIAG.find(x=>x[0]===d)[1]+'» не подтвердилась. Минус 15 минут.'])}incRender()});
  incEl.querySelectorAll('[data-f]').forEach(b=>b.onclick=()=>{const f=I.fixes[+b.dataset.f];I.log.push(['c','> '+f[0]]);
    if(f[1]){I.stage='done';I.result=f[2];I.log.push(['ok',f[2]]);ach('night');window.achSet?.('inc',I.s.id,4,'sherlock')}
    else{I.min+=20;f.bad=1;I.log.push(['e',f[2]])}incRender()});
  $('#inc-new').onclick=incNew;
}
incNew();

/* ================= FIREWALL-ТРЕНАЖЁР ================= */
const WAN_IP=['45.95.147.12','185.220.101.7','91.240.118.9','194.26.29.4'];
const P=(d,chain,iface,proto,dport,src,state,want)=>({d,chain,iface,proto,dport,src,state,want});
const FW=[
 {t:'Закрыть Winbox из интернета',task:'Боты круглосуточно стучатся в Winbox (порт 8291) снаружи. Закрой его для WAN, но не сломай доступ из офиса и ответы DNS.',
  hint:'Одного правила хватит: input, tcp, порт 8291, из WAN, drop.',
  pk:[P('Бот сканирует Winbox','input','WAN','tcp','8291','45.95.147.12','new','drop'),P('Ты заходишь в Winbox из офиса','input','LAN','tcp','8291','192.168.10.20','new','accept'),
      P('Ответ DNS-сервера роутеру','input','WAN','udp','51234','77.88.8.8','established','accept'),P('Мониторинг пингует роутер','input','WAN','icmp','','8.8.8.8','new','accept'),
      P('Второй бот на Winbox','input','WAN','tcp','8291','185.220.101.7','new','drop')]},
 {t:'Не быть открытым DNS',task:'Роутер отвечает на DNS-запросы из интернета, и его используют для DDoS-атак. Запрети DNS снаружи, но офис должен резолвить имена, а ответы от вышестоящих DNS доходить.',
  hint:'DNS работает и по udp, и по tcp. Ответы вышестоящего сервера приходят на случайный порт, поэтому правило на порт 53 их не заденет.',
  pk:[P('Чужой DNS-запрос (атака)','input','WAN','udp','53','185.220.101.7','new','drop'),P('Чужой DNS-запрос по TCP','input','WAN','tcp','53','91.240.118.9','new','drop'),
      P('ПК офиса резолвит имя','input','LAN','udp','53','192.168.10.31','new','accept'),P('Ответ от 77.88.8.8','input','WAN','udp','50871','77.88.8.8','established','accept'),
      P('SSH из офиса','input','LAN','tcp','22','192.168.10.20','new','accept')]},
 {t:'Базовая защита input',task:'Классика: пропускаем установленные соединения, режем мусор, разрешаем ping и всё из LAN, остальное из интернета дропаем.',
  hint:'accept established,related → drop invalid → accept icmp → accept из LAN → drop всё остальное.',
  pk:[P('Бот ищет веб-интерфейс','input','WAN','tcp','80','45.95.147.12','new','drop'),P('Сканер API RouterOS','input','WAN','tcp','8728','194.26.29.4','new','drop'),
      P('Опрос SNMP снаружи','input','WAN','udp','161','91.240.118.9','new','drop'),P('Telnet из интернета','input','WAN','tcp','23','185.220.101.7','new','drop'),
      P('Ответ сервера обновлений','input','WAN','tcp','50112','159.148.147.201','established','accept'),P('Мониторинг пингует роутер','input','WAN','icmp','','8.8.8.8','new','accept'),
      P('Winbox из офиса','input','LAN','tcp','8291','192.168.10.20','new','accept'),P('DNS из офиса','input','LAN','udp','53','192.168.10.44','new','accept'),
      P('Битый пакет','input','WAN','tcp','22','45.95.147.12','invalid','drop')]},
 {t:'RDP только для филиала',task:'Терминальный сервер проброшен наружу по RDP (3389). Пускать нужно только филиал 203.0.113.50. Офис ходит в интернет, ответы сайтов доходят, SMB снаружи закрыт.',
  hint:'Цепочка forward: accept established,related → accept из LAN → accept tcp 3389 от 203.0.113.50 → drop всё из WAN.',
  pk:[P('Филиал подключается по RDP','forward','WAN','tcp','3389','203.0.113.50','new','accept'),P('Брутфорс RDP','forward','WAN','tcp','3389','91.240.118.9','new','drop'),
      P('Ещё один брутфорс RDP','forward','WAN','tcp','3389','45.95.147.12','new','drop'),P('Сотрудник открывает сайт','forward','LAN','tcp','443','192.168.10.20','new','accept'),
      P('Ответ сайта сотруднику','forward','WAN','tcp','51722','93.186.225.194','established','accept'),P('SMB из интернета','forward','WAN','tcp','445','194.26.29.4','new','drop')]},
];
const FS=store.get('nefor-fw',{done:[],rules:{}});let fl=0;
const fwEl=$('#s-fw');
const RULE0=()=>({chain:FW[fl].pk[0].chain,proto:'tcp',dport:'',src:'',iface:'WAN',state:'any',action:'drop'});
const rules=()=>FS.rules[fl]||(FS.rules[fl]=[]);
const ipIn=(ip,c)=>{if(!c)return true;const[a,b]=c.split('/');const n=x=>x.split('.').reduce((s,o)=>s*256+(+o),0);if(!b)return ip===a;const m=b==='0'?0:(0xffffffff<<(32-b))>>>0;return((n(ip)&m)>>>0)===((n(a)&m)>>>0)};
const portIn=(p,r)=>{if(!r)return true;return r.split(',').some(x=>{const[a,b]=x.split('-');return b?(+p>=+a&&+p<=+b):p===a.trim()})};
function match(r,p){if(r.chain!==p.chain)return false;if(r.proto!=='any'&&r.proto!==p.proto)return false;if(r.dport&&(!['tcp','udp'].includes(r.proto)||!portIn(p.dport,r.dport)))return false;
  if(r.iface!=='any'&&r.iface!==p.iface)return false;if(r.state!=='any'&&!r.state.split(',').includes(p.state==='related'?'related':p.state))return false;if(r.src&&!ipIn(p.src,r.src))return false;return true}
const rsc=r=>`/ip firewall filter add chain=${r.chain}${r.proto!=='any'?' protocol='+r.proto:''}${r.dport?' dst-port='+r.dport:''}${r.src?' src-address='+r.src:''}${r.iface!=='any'?' in-interface-list='+r.iface:''}${r.state!=='any'?' connection-state='+r.state:''} action=${r.action}`;
const sel=(k,v,opts,i)=>`<select data-k="${k}" data-i="${i}" aria-label="${k}">${opts.map(o=>`<option${o===v?' selected':''}>${o}</option>`).join('')}</select>`;
function fwRender(res){
  const L=FW[fl],R=rules();
  fwEl.innerHTML=`<div class="chips">${FW.map((l,i)=>`<button class="chip${i===fl?' on':''}" data-l="${i}">${FS.done.includes(i)?'✓ ':''}${i+1}. ${h(l.t)}</button>`).join('')}</div>
  <div class="fw-task"><b>Уровень ${fl+1}. ${h(L.t)}</b><p>${h(L.task)}</p><p class="muted">Политика по умолчанию в MikroTik: всё, что не попало ни под одно правило, разрешено. Правила проверяются сверху вниз, срабатывает первое подходящее.</p></div>
  <div class="fw-rules">${R.length?R.map((r,i)=>`<div class="fw-rule"><span class="fw-n">${i+1}</span>
    ${sel('chain',r.chain,['input','forward'],i)}${sel('proto',r.proto,['any','tcp','udp','icmp'],i)}
    <input type="text" data-k="dport" data-i="${i}" value="${h(r.dport)}" placeholder="порт" aria-label="порт">
    <input type="text" data-k="src" data-i="${i}" value="${h(r.src)}" placeholder="src-address" aria-label="адрес источника">
    ${sel('iface',r.iface,['any','WAN','LAN'],i)}${sel('state',r.state,['any','established,related','new','invalid'],i)}${sel('action',r.action,['accept','drop'],i)}
    <span class="fw-btns"><button data-m="up" data-i="${i}" aria-label="выше">↑</button><button data-m="dn" data-i="${i}" aria-label="ниже">↓</button><button data-m="rm" data-i="${i}" aria-label="удалить">✕</button></span></div>`).join('')
    :'<p class="muted">Правил пока нет: весь трафик проходит. Добавь первое правило.</p>'}</div>
  <div class="row" style="margin-top:10px"><button class="btn ghost" id="fw-add" style="flex:0 0 auto">+ Правило</button><button class="btn" id="fw-run" style="flex:0 0 auto">Пустить трафик</button><button class="btn ghost" id="fw-hint" style="flex:0 0 auto">Подсказка</button></div>
  <p class="muted" id="fw-hinttext" hidden>${h(L.hint)}</p>
  <pre class="code" style="margin-top:12px;max-height:200px">${R.length?R.map(r=>h(rsc(r))).join('\n'):'<span class="cm"># здесь появится конфиг</span>'}</pre>
  <div id="fw-res">${res||''}</div>`;
  fwEl.querySelectorAll('[data-l]').forEach(b=>b.onclick=()=>{fl=+b.dataset.l;fwRender()});
  fwEl.querySelectorAll('select[data-k],input[data-k]').forEach(e=>e.onchange=()=>{R[+e.dataset.i][e.dataset.k]=e.value.trim();store.set('nefor-fw',FS);fwRender()});
  fwEl.querySelectorAll('[data-m]').forEach(b=>b.onclick=()=>{const i=+b.dataset.i,m=b.dataset.m;if(m==='rm')R.splice(i,1);else{const j=m==='up'?i-1:i+1;if(j<0||j>=R.length)return;[R[i],R[j]]=[R[j],R[i]]}store.set('nefor-fw',FS);fwRender()});
  $('#fw-add').onclick=()=>{R.push(RULE0());store.set('nefor-fw',FS);fwRender()};
  $('#fw-hint').onclick=()=>{$('#fw-hinttext').hidden=false};
  $('#fw-run').onclick=fwRun;
}
function fwRun(){const L=FW[fl],R=rules();let ok=0;
  const warn=R.some(r=>r.dport&&!['tcp','udp'].includes(r.proto))?'<div class="warnbox">В правиле с портом должен быть протокол tcp или udp, иначе RouterOS его не примет. Такие правила пропущены.</div>':'';
  const rows=L.pk.map(p=>{const i=R.findIndex(r=>!(r.dport&&!['tcp','udp'].includes(r.proto))&&match(r,p));const act=i<0?'accept':R[i].action;const good=act===p.want;if(good)ok++;
    return `<tr class="${good?'ok':'bad'}"><td>${good?'✓':'✗'}</td><td>${h(p.d)}<small>${p.iface} · ${p.proto}${p.dport?':'+p.dport:''} · ${p.src} · ${p.state}</small></td><td>${p.want==='accept'?'пропустить':'заблокировать'}</td><td>${act==='accept'?'пропущен':'заблокирован'}<small>${i<0?'ни одно правило, по умолчанию':'правило '+(i+1)}</small></td></tr>`}).join('');
  const win=ok===L.pk.length;if(win&&!FS.done.includes(fl)){FS.done.push(fl);store.set('nefor-fw',FS)}if(FS.done.length===FW.length)ach('firewall');
  fwRender(`${warn}<div class="tblwrap"><table class="fw-tbl"><thead><tr><th></th><th>Пакет</th><th>Нужно</th><th>Результат</th></tr></thead><tbody>${rows}</tbody></table></div>
    <div class="dk-res ${win?'ok':'bad'}" style="margin-top:12px"><b>${win?'Уровень пройден':'Пока не то'}</b> · верно ${ok} из ${L.pk.length}${win&&fl<FW.length-1?'<p>Жми следующий уровень сверху.</p>':''}</div>`);
}
fwRender();

/* ================= СОБЕРИ СЕТЬ ОФИСА ================= */
const CAT=[
 {id:'r1',t:'Роутер 5×1G',p:7000,type:'router',lan:4},{id:'r2',t:'Роутер 5×1G + LTE',p:16000,type:'router',lan:4,lte:1},{id:'r3',t:'Роутер 10×1G + SFP+',p:24000,type:'router',lan:9},
 {id:'s8',t:'Свитч 8×1G',p:3500,type:'sw',ports:8},{id:'s24',t:'Свитч 24×1G',p:11000,type:'sw',ports:24},
 {id:'p8',t:'PoE-свитч 8×1G, 65 Вт',p:8000,type:'sw',ports:8,poe:65},{id:'p24',t:'PoE-свитч 24×1G, 190 Вт',p:27000,type:'sw',ports:24,poe:190},
 {id:'ap',t:'Точка доступа Wi-Fi (PoE, 12 Вт)',p:6500,type:'ap'},{id:'ups',t:'ИБП 1,5 кВА для стойки',p:14000,type:'ups'},
];
const NL=[
 {t:'Маленький офис',budget:45000,pc:8,pr:1,cam:2,ap:1,need:{guest:1},text:['8 ПК и 1 сетевой принтер','2 IP-камеры с питанием по PoE (6,5 Вт)','Wi-Fi на весь офис: 1 точка доступа','Гостевой Wi-Fi, изолированный от рабочей сети']},
 {t:'Офис со складом',budget:115000,pc:18,pr:3,cam:6,ap:3,need:{guest:1,buh:1,camv:1,lte:1,ups:1},text:['18 ПК и 3 принтера','6 IP-камер по PoE (6,5 Вт), камеры в своей VLAN','3 точки доступа Wi-Fi','Бухгалтерия в отдельной VLAN','Гостевой Wi-Fi, изолированный от рабочей сети','Резервный интернет через LTE','ИБП для стойки']},
 {t:'Два этажа и видеонаблюдение',budget:150000,pc:30,pr:4,cam:12,ap:4,need:{guest:1,buh:1,camv:1,lte:1,ups:1},text:['30 ПК и 4 принтера','12 IP-камер по PoE (6,5 Вт) в своей VLAN','4 точки доступа Wi-Fi','Бухгалтерия в отдельной VLAN','Изолированный гостевой Wi-Fi','Резервный интернет через LTE','ИБП для стойки']},
];
const NS=store.get('nefor-net',{lvl:0,done:[]});let nq={},ncfg={},nres='';
const netEl=$('#s-net');
function netReset(){nq={router:null};CAT.forEach(c=>{if(c.type!=='router')nq[c.id]=0});ncfg={buh:false,guest:false,iso:false,camv:false,lte:false};nres=''}
function netCalc(){const L=NL[NS.lvl],r=CAT.find(c=>c.id===nq.router),sws=CAT.filter(c=>c.type==='sw');
  let cost=r?r.p:0;CAT.forEach(c=>{if(c.type!=='router')cost+=c.p*nq[c.id]});
  const nSw=sws.reduce((a,c)=>a+nq[c.id],0),poePorts=sws.filter(c=>c.poe).reduce((a,c)=>a+nq[c.id]*(c.ports-1),0),poeW=sws.filter(c=>c.poe).reduce((a,c)=>a+nq[c.id]*c.poe,0);
  const swPorts=sws.reduce((a,c)=>a+nq[c.id]*(c.ports-1),0),rFree=r?r.lan-nSw:0;
  const devices=L.pc+L.pr+L.cam+nq.ap,poeDev=L.cam+nq.ap,poeNeed=L.cam*6.5+nq.ap*12;
  return{L,r,cost,nSw,poePorts,poeW,swPorts,rFree,devices,poeDev,poeNeed,free:swPorts+Math.max(0,rFree)}}
function netChecks(c){const L=c.L,n=L.need,out=[];const ck=(ok,t,why)=>out.push([ok,t,why]);
  ck(!!c.r,'Выбран роутер','Без роутера сети нет.');
  if(c.r)ck(c.rFree>=0,'Свитчам хватает портов роутера',`Свитчей ${c.nSw}, а свободных LAN-портов у роутера ${c.r.lan}. Возьми роутер с большим числом портов или меньше свитчей побольше.`);
  ck(c.free>=c.devices,`Портов хватает на всех (${c.devices} устройств)`,`Свободных портов ${c.free}, а подключить нужно ${c.devices}.`);
  ck(c.poePorts>=c.poeDev,`PoE-портов хватает (${c.poeDev} устройств)`,`PoE-портов ${c.poePorts}, а PoE-устройств ${c.poeDev}. Камерам и точкам доступа нужен PoE-свитч.`);
  ck(c.poeW>=c.poeNeed*1.1,`Бюджета PoE хватает (${c.poeNeed.toFixed(0)} Вт + запас 10%)`,`Бюджет PoE ${c.poeW} Вт, нужно около ${(c.poeNeed*1.1).toFixed(0)} Вт с учётом потерь в кабеле.`);
  ck(nq.ap>=L.ap,`Покрытие Wi-Fi (нужно точек: ${L.ap})`,`Точек доступа ${nq.ap}, нужно ${L.ap}.`);
  if(n.guest)ck(ncfg.guest&&ncfg.iso,'Гостевой Wi-Fi изолирован','Нужны отдельная гостевая VLAN и правило firewall, запрещающее гостям ходить в LAN.');
  if(n.buh)ck(ncfg.buh,'Бухгалтерия в отдельной VLAN','Включи VLAN для бухгалтерии.');
  if(n.camv)ck(ncfg.camv,'Камеры в своей VLAN','Камеры лучше держать отдельно: у них слабая защита.');
  if(n.lte)ck(ncfg.lte&&c.r?.lte,'Резервный канал LTE',c.r?.lte?'Роутер умеет LTE, включи резервирование в настройках.':'Нужен роутер с LTE-модемом.');
  if(n.ups)ck(nq.ups>=1,'Стойка на ИБП','Добавь ИБП.');
  ck(c.cost<=L.budget,`Уложились в бюджет (${L.budget.toLocaleString('ru')} ₽)`,`Перерасход ${(c.cost-L.budget).toLocaleString('ru')} ₽.`);
  return out}
function topo(c){const W=640,sw=[];CAT.filter(x=>x.type==='sw').forEach(x=>{for(let i=0;i<nq[x.id];i++)sw.push(x)});
  const n=Math.max(1,sw.length),H=250,gx=W/(n+1);
  let s=`<svg viewBox="0 0 ${W} ${H}" class="topo" role="img" aria-label="Схема сети">`;
  s+=`<rect x="${W/2-70}" y="10" width="140" height="34" rx="6" class="t-node${c.r?'':' t-miss'}"/><text x="${W/2}" y="32" class="t-lbl" text-anchor="middle">${c.r?h(c.r.t.split(' ').slice(0,2).join(' ')):'нет роутера'}</text>`;
  if(ncfg.lte&&c.r?.lte)s+=`<text x="${W/2+80}" y="32" class="t-sub" text-anchor="start">+ LTE</text>`;
  s+=`<line x1="${W/2}" y1="0" x2="${W/2}" y2="10" class="t-link"/><text x="${W/2+6}" y="8" class="t-sub" text-anchor="start">интернет</text>`;
  sw.forEach((x,i)=>{const cx=gx*(i+1);s+=`<line x1="${W/2}" y1="44" x2="${cx}" y2="100" class="t-link"/><rect x="${cx-52}" y="100" width="104" height="30" rx="6" class="t-node${x.poe?' t-poe':''}"/><text x="${cx}" y="119" class="t-lbl" text-anchor="middle">${x.poe?'PoE ':''}${x.ports} портов</text>`});
  const grp=[['ПК',c.L.pc],['Принтеры',c.L.pr],['Камеры',c.L.cam],['Wi-Fi',nq.ap]],gw=W/(grp.length+1);
  s+=`<line x1="40" y1="170" x2="${W-40}" y2="170" class="t-bus"/>`;if(sw.length)sw.forEach((x,i)=>{s+=`<line x1="${gx*(i+1)}" y1="130" x2="${gx*(i+1)}" y2="170" class="t-link"/>`});else s+=`<line x1="${W/2}" y1="44" x2="${W/2}" y2="170" class="t-link"/>`;
  grp.forEach((g,i)=>{const cx=gw*(i+1);s+=`<line x1="${cx}" y1="170" x2="${cx}" y2="195" class="t-link"/><rect x="${cx-50}" y="195" width="100" height="40" rx="6" class="t-dev"/><text x="${cx}" y="213" class="t-lbl" text-anchor="middle">${g[0]}</text><text x="${cx}" y="228" class="t-sub" text-anchor="middle">×${g[1]}</text>`});
  const vl=[ncfg.buh&&'VLAN бухгалтерия',ncfg.guest&&'VLAN гости'+(ncfg.iso?' (изол.)':''),ncfg.camv&&'VLAN камеры'].filter(Boolean);
  if(vl.length)s+=`<text x="12" y="150" class="t-sub" text-anchor="start">${vl.join(' · ')}</text>`;
  return s+'</svg>'}
function netRender(){const c=netCalc(),L=c.L;
  netEl.innerHTML=`<div class="chips">${NL.map((l,i)=>`<button class="chip${i===NS.lvl?' on':''}" data-nl="${i}">${NS.done.includes(i)?'✓ ':''}${i+1}. ${h(l.t)}</button>`).join('')}</div>
  <div class="net">
   <div class="net-col"><div class="fw-task"><b>Требования</b><ul>${L.text.map(t=>`<li>${h(t)}</li>`).join('')}</ul></div>
    <div class="net-budget"><span>Смета: <b>${c.cost.toLocaleString('ru')} ₽</b> из ${L.budget.toLocaleString('ru')} ₽</span><div class="meter"><i style="width:${Math.min(100,c.cost/L.budget*100)}%;background:${c.cost>L.budget?'var(--bad)':'var(--acc)'}"></i></div></div>
    <div class="net-cat">${CAT.map(x=>x.type==='router'?`<label class="net-item"><input type="radio" name="nrouter" value="${x.id}"${nq.router===x.id?' checked':''}><span>${h(x.t)}</span><b>${x.p.toLocaleString('ru')} ₽</b></label>`
      :`<div class="net-item"><span>${h(x.t)}</span><b>${x.p.toLocaleString('ru')} ₽</b><span class="qty"><button data-q="${x.id}" data-v="-1" aria-label="меньше">−</button><em>${nq[x.id]}</em><button data-q="${x.id}" data-v="1" aria-label="больше">+</button></span></div>`).join('')}</div>
    <div class="net-cfg"><b>Настройка</b>${[['buh','VLAN для бухгалтерии'],['guest','Гостевая VLAN и SSID'],['iso','Firewall: гости не ходят в LAN'],['camv','VLAN для камер'],['lte','Резервирование через LTE']].map(([k,t])=>`<label class="tgl"><input type="checkbox" data-c="${k}"${ncfg[k]?' checked':''}> ${t}</label>`).join('')}</div>
   </div>
   <div class="net-col">${topo(c)}<div class="row"><button class="btn" id="net-check" style="flex:0 0 auto">Проверить сеть</button><button class="btn ghost" id="net-reset" style="flex:0 0 auto">Сбросить</button></div><div id="net-res">${nres}</div></div>
  </div>`;
  netEl.querySelectorAll('[data-nl]').forEach(b=>b.onclick=()=>{NS.lvl=+b.dataset.nl;store.set('nefor-net',NS);netReset();netRender()});
  netEl.querySelectorAll('input[name=nrouter]').forEach(r=>r.onchange=()=>{nq.router=r.value;nres='';netRender()});
  netEl.querySelectorAll('[data-q]').forEach(b=>b.onclick=()=>{const k=b.dataset.q;nq[k]=Math.max(0,Math.min(9,nq[k]+ +b.dataset.v));nres='';netRender()});
  netEl.querySelectorAll('[data-c]').forEach(b=>b.onchange=()=>{ncfg[b.dataset.c]=b.checked;nres='';netRender()});
  $('#net-reset').onclick=()=>{netReset();netRender()};
  $('#net-check').onclick=()=>{const cs=netChecks(netCalc()),ok=cs.every(x=>x[0]),left=(L.budget-c.cost)/L.budget;
    const st=ok?(left>=.15?3:left>=.05?2:1):0;
    if(ok&&!NS.done.includes(NS.lvl)){NS.done.push(NS.lvl);store.set('nefor-net',NS)}if(ok)ach('architect');
    nres=`<ul class="checks">${cs.map(x=>`<li class="${x[0]?'ok':'bad'}">${x[0]?'✓':'✗'} ${h(x[1])}${x[0]?'':`<small>${h(x[2])}</small>`}</li>`).join('')}</ul>
      <div class="dk-res ${ok?'ok':'bad'}"><b>${ok?'Сеть работает':'Сеть пока не сдать'}</b>${ok?` · ${'★'.repeat(st)}${'☆'.repeat(3-st)}<p>${st===3?'Ещё и сэкономил. Бухгалтерия довольна.':st===2?'Хорошо, но можно дешевле.':'Работает, но впритык по деньгам.'}</p>`:''}</div>`;netRender()};
}
netReset();netRender();

/* ================= СЕРВЕР-ТАМАГОЧИ ================= */
const tamaEl=$('#s-tama');
let T=store.get('nefor-tama',null);
const now=()=>Date.now();
if(!T)T={name:'srv-pet01',born:now(),last:now(),disk:42,upd:1,bak:3,dust:10,log:[],busy:0};
function tlog(t){T.log.unshift(`${new Date().toLocaleString('ru',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})} ${t}`);T.log=T.log.slice(0,8)}
function decay(hours,silent){if(hours<=0)return;const hh=Math.min(hours,24*21);
  const d0=T.disk,u0=T.upd;T.disk=Math.min(100,T.disk+hh*1.1);T.ua=(T.ua||0)+hh/8;const nu=Math.floor(T.ua);T.upd+=nu;T.ua-=nu;T.bak+=hh;T.dust=Math.min(100,T.dust+hh*.45);
  if(!silent&&hh>=1){const parts=[];if(T.disk-d0>=1)parts.push(`логи выросли на ${Math.round((T.disk-d0)*2)} ГБ`);if(T.upd>u0)parts.push(`пришло обновлений: ${T.upd-u0}`);parts.push(`бэкапу уже ${Math.floor(T.bak)} ч`);tlog('Пока тебя не было: '+parts.join(', ')+'.')}}
decay((now()-T.last)/36e5);T.last=now();store.set('nefor-tama',T);
function stat(){const s={disk:T.disk>=92?2:T.disk>=80?1:0,upd:T.upd>=10?2:T.upd>=4?1:0,bak:T.bak>=96?2:T.bak>=36?1:0,dust:T.dust>=85?2:T.dust>=60?1:0};s.max=Math.max(s.disk,s.upd,s.bak,s.dust);return s}
const TA={
 clean:['Почистить диск',()=>{const f=Math.round(Math.min(T.disk-15,25+Math.random()*12));T.disk=Math.max(15,T.disk-f);tlog(`Почистил диск: удалено ${f*2} ГБ старых логов.`)}],
 upd:['Поставить обновления',()=>{if(!T.upd){tlog('Обновлений нет. Сервер смотрит на тебя с подозрением.');return}T.busy=now()+4000;tlog(`Установлено обновлений: ${T.upd}. Перезагрузка…`);T.upd=0}],
 bak:['Сделать бэкап',()=>{T.busy=now()+3000;T.bak=0;tlog('Бэкап сделан и проверен восстановлением. Редкий случай.')}],
 dust:['Продуть от пыли',()=>{T.dust=0;tlog('Продул баллоном. Из сервера вылетел комок пыли размером с кота.')}],
 pat:['Погладить по корпусу',()=>{tlog(['Сервер довольно зашумел кулерами.','Лампочка мигнула в ответ.','Сервер сделал вид, что ему всё равно.'][Math.floor(Math.random()*3)])}],
};
function tamaDraw(){const cv=$('#tama-cv');if(!cv)return;const x=cv.getContext('2d'),s=stat(),busy=T.busy>now(),css=v=>getComputedStyle(document.body).getPropertyValue(v).trim();
  const acc=css('--acc'),warn=css('--warn'),bad=css('--bad'),c=s.max===2?bad:s.max===1?warn:acc,t=performance.now()/1000;
  x.clearRect(0,0,64,64);x.fillStyle='#1c211f';x.fillRect(6,8,52,46);x.fillStyle='#2b312e';x.fillRect(6,8,52,3);x.fillStyle='#121514';x.fillRect(6,51,52,3);
  for(let i=0;i<5;i++){x.fillStyle='#101312';x.fillRect(10+i*9,44,6,4)}
  const blink=!busy&&Math.floor(t*10)%40===0;x.fillStyle=c;
  if(busy){x.fillRect(18,24,8,2);x.fillRect(38,24,8,2);x.fillStyle=css('--mut');x.font='8px monospace';x.fillText('z',48,16+Math.sin(t*3)*2)}
  else if(blink){x.fillRect(18,24,8,2);x.fillRect(38,24,8,2)}
  else{x.fillRect(19,19,6,7);x.fillRect(39,19,6,7);x.fillStyle='#0b0d0c';x.fillRect(21+Math.round(Math.sin(t)),21,2,2);x.fillRect(41+Math.round(Math.sin(t)),21,2,2);x.fillStyle=c}
  if(s.max===0){x.fillRect(24,33,16,2);x.fillRect(22,31,2,2);x.fillRect(40,31,2,2)}else if(s.max===1){x.fillRect(24,33,16,2)}else{x.fillRect(24,33,16,2);x.fillRect(22,35,2,2);x.fillRect(40,35,2,2)}
  if(s.max===2&&Math.floor(t*4)%2){x.fillStyle=bad;x.fillRect(52,12,3,3)}else{x.fillStyle=acc;x.fillRect(52,12,3,3)}
  if(s.dust>0){x.fillStyle='rgba(160,150,120,'+(T.dust/220)+')';x.fillRect(6,8,52,46)}}
function tamaRender(){const s=stat(),busy=T.busy>now(),age=Math.floor((now()-T.born)/864e5);
  const bar=(label,val,lvl,txt)=>`<div class="tm-stat"><span>${label}</span><div class="meter"><i style="width:${Math.min(100,val)}%;background:var(--${lvl===2?'bad':lvl===1?'warn':'acc'})"></i></div><em class="${lvl===2?'bad':lvl===1?'warn':''}">${txt}</em></div>`;
  const mood=busy?'перезагружается…':s.max===2?'болеет':s.max===1?'грустит':'счастлив';
  tamaEl.innerHTML=`<div class="tama"><div class="tama-pet"><canvas id="tama-cv" width="64" height="64" aria-label="Сервер-питомец"></canvas>
    <input type="text" id="tama-name" value="${h(T.name)}" aria-label="Имя сервера"><div class="muted">${mood} · возраст ${age} дн.</div></div>
   <div class="tama-side">${bar('Диск',T.disk,s.disk,Math.round(T.disk)+'% занято')}${bar('Обновления',T.upd*10,s.upd,T.upd?`ждут: ${T.upd}`:'всё стоит')}
    ${bar('Бэкап',Math.min(100,T.bak),s.bak,T.bak<1?'только что':Math.floor(T.bak)+' ч назад')}${bar('Пыль',T.dust,s.dust,Math.round(T.dust)+'%, '+(22+T.dust*.25).toFixed(0)+'°C')}
    <div class="chips">${Object.entries(TA).map(([k,a])=>`<button class="chip" data-t="${k}" ${busy?'disabled':''}>${a[0]}</button>`).join('')}</div>
    <div class="tm-log">${T.log.map(l=>`<div>${h(l)}</div>`).join('')||'<div class="muted">Пока тихо.</div>'}</div>
    <p class="muted" style="font-size:12px">Сервер живёт в твоём браузере. Без ухода логи растут, обновления копятся, пыль оседает. Не заходи пару дней, и он заболеет.</p></div></div>`;
  tamaEl.querySelectorAll('[data-t]').forEach(b=>b.onclick=()=>{TA[b.dataset.t][1]();T.last=now();store.set('nefor-tama',T);
    const s2=stat();if(s2.max===0&&T.upd===0&&T.bak<1&&T.dust<5&&T.disk<50)ach('tama');tamaRender();if(T.busy>now())setTimeout(tamaRender,T.busy-now()+50)});
  $('#tama-name').onchange=e=>{T.name=e.target.value.trim().slice(0,24)||'srv-pet01';store.set('nefor-tama',T)};
  tamaDraw()}
setInterval(()=>{if(!$('#s-tama').classList.contains('on'))return;const dt=(now()-T.last)/36e5;if(dt>.01){decay(dt,true);T.last=now();store.set('nefor-tama',T)}tamaDraw()},120);
tamaRender();

if(typeof CMDS!=='undefined'){
  const open=s=>{document.querySelector(`#stabs .tab[data-s="${s}"]`).click();location.hash='sims'};
  CMDS.incident=()=>{open('inc');return 'Звонит мониторинг. 03:07 →'};
  CMDS.firewall=()=>{open('fw');return 'Firewall-тренажёр →'};
  CMDS.pet=()=>{open('tama');return `${h(T.name)}: ${stat().max===2?'болеет':stat().max===1?'грустит':'счастлив'}`};
}
})();
