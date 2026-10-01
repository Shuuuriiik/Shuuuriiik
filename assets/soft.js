/* ne-for.ru — полезный софт для админа. Иконки грузятся с сайтов самих программ (через сервис фавиконок), при ошибке — буква */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const el = $('#soft-list'); if (!el) return;
/* [название, домен для иконки, ссылка, категория, описание, цена, в стеке автора] */
const SOFT = [
 ['AnyDesk','anydesk.com','https://anydesk.com/ru','Удалённый доступ','Быстрое подключение к ПК пользователя по ID. Классика первой линии.','есть бесплатная',1],
 ['RuDesktop','rudesktop.ru','https://rudesktop.ru','Удалённый доступ','Российский аналог AnyDesk, можно поднять свой сервер.','есть бесплатная',1],
 ['Parsec','parsec.app','https://parsec.app','Удалённый доступ','Удалённый рабочий стол с минимальной задержкой, тянет даже видео.','есть бесплатная',1],
 ['MobaXterm','mobatek.net','https://mobaxterm.mobatek.net','Удалённый доступ','SSH, RDP, SFTP и X11 в одном окне. Незаменим для железа и Linux.','есть бесплатная',0],
 ['WinSCP','winscp.net','https://winscp.net','Удалённый доступ','Файлы по SFTP и SCP: закинуть бэкап на роутер или забрать логи.','бесплатно',0],
 ['Horizon Client','omnissa.com','https://www.omnissa.com','Удалённый доступ','Клиент для VDI: подключение к виртуальным рабочим столам.','бесплатно',1],
 ['Wireshark','wireshark.org','https://www.wireshark.org','Сеть','Сниффер пакетов. Если «сеть тормозит», правда здесь.','бесплатно',1],
 ['Advanced IP Scanner','advanced-ip-scanner.com','https://www.advanced-ip-scanner.com/ru/','Сеть','Найти все устройства в подсети за минуту, с MAC и производителем.','бесплатно',1],
 ['Advanced Port Scanner','advanced-port-scanner.com','https://www.advanced-port-scanner.com/ru/','Сеть','Какие порты открыты на хосте и что за ними слушает.','бесплатно',1],
 ['WinBox','mikrotik.com','https://mikrotik.com/download','Сеть','Родная утилита для MikroTik. Находит роутер даже по MAC.','бесплатно',0],
 ['GNS3','gns3.com','https://www.gns3.com','Сеть','Лаборатория сетей: собрать топологию и потестить конфиг до продакшена.','бесплатно',1],
 ['Zabbix','zabbix.com','https://www.zabbix.com/ru','Мониторинг','Мониторинг всего: серверы, свитчи, ИБП, место на дисках.','бесплатно',0],
 ['Grafana','grafana.com','https://grafana.com','Мониторинг','Красивые дашборды поверх Zabbix и других источников.','есть бесплатная',0],
 ['OpenVPN Connect','openvpn.net','https://openvpn.net/client/','VPN','Клиент OpenVPN для Windows, macOS и телефонов.','бесплатно',1],
 ['AmneziaVPN','amnezia.org','https://amnezia.org','VPN','Свой VPN на своём сервере за пару кликов.','бесплатно',1],
 ['VMware Workstation','vmware.com','https://www.vmware.com/products/desktop-hypervisor/workstation-and-fusion','Виртуализация','Виртуалки на рабочем ПК: тестовые стенды, снапшоты, лаба.','бесплатно для личного',1],
 ['VirtualBox','virtualbox.org','https://www.virtualbox.org','Виртуализация','Бесплатные виртуалки для быстрых тестов.','бесплатно',1],
 ['Acronis Disk Director','acronis.com','https://www.acronis.com','Диски','Разметка, перенос и восстановление разделов.','платно',1],
 ['UltraISO','ezbsystems.com','https://www.ezbsystems.com/ultraiso/','Диски','Работа с ISO: открыть, изменить, записать на флешку.','есть пробная',1],
 ['Rufus','rufus.ie','https://rufus.ie/ru/','Диски','Загрузочная флешка из ISO за минуту.','бесплатно',0],
 ['Ventoy','ventoy.net','https://www.ventoy.net','Диски','Одна флешка, много ISO: просто копируешь образы на неё.','бесплатно',0],
 ['Hex Editor Neo','hhdsoftware.com','https://hhdsoftware.com/free-hex-editor','Диски','Шестнадцатеричный редактор для файлов и дисков.','есть бесплатная',1],
 ['KeePass','keepass.info','https://keepass.info','Безопасность','Менеджер паролей с локальной базой. Лучше стикеров.','бесплатно',1],
 ['КриптоАРМ','cryptoarm.ru','https://cryptoarm.ru','Безопасность','Подписать и проверить файл электронной подписью.','есть бесплатная',1],
 ['GLPI','glpi-project.org','https://glpi-project.org','Учёт и хелпдеск','Учёт техники, заявки, инвентаризация агентами.','бесплатно',0],
 ['Snipe-IT','snipeitapp.com','https://snipeitapp.com','Учёт и хелпдеск','Учёт активов: кто что взял и когда вернёт.','бесплатно',0],
 ['Контур.Диадок','diadoc.ru','https://www.diadoc.ru','ЭДО и учёт','Электронный документооборот с контрагентами.','платно',1],
 ['Saby','saby.ru','https://saby.ru','ЭДО и учёт','ЭДО, отчётность и маркировка в одном кабинете.','платно',1],
 ['Такском','taxcom.ru','https://taxcom.ru','ЭДО и учёт','Отчётность и ЭДО, в том числе для маркировки.','платно',1],
 ['1С:Предприятие','1c.ru','https://v8.1c.ru','ЭДО и учёт','Сами знаете. Обновляется в самый неподходящий момент.','платно',1],
 ['Битрикс24','bitrix24.ru','https://www.bitrix24.ru','ЭДО и учёт','CRM, задачи и чат компании.','есть бесплатная',1],
 ['Trassir','trassir.ru','https://www.trassir.ru','Видеонаблюдение','Клиент видеонаблюдения: архив, камеры, аналитика.','платно',1],
 ['Telegram','telegram.org','https://telegram.org','Связь','Рабочие чаты, боты для алертов мониторинга.','бесплатно',1],
 ['TrueConf','trueconf.ru','https://trueconf.ru','Связь','Видеосвязь на своём сервере, без облака.','есть бесплатная',1],
 ['Zoom','zoom.us','https://zoom.us','Связь','Видеоконференции с внешними компаниями.','есть бесплатная',1],
 ['MAX','max.ru','https://max.ru','Связь','Мессенджер для рабочих звонков и чатов.','бесплатно',1],
 ['Visual Studio Code','code.visualstudio.com','https://code.visualstudio.com','Утилиты','Редактор для скриптов PowerShell, конфигов и всего остального.','бесплатно',1],
 ['Notepad++','notepad-plus-plus.org','https://notepad-plus-plus.org','Утилиты','Лёгкий редактор: открыть лог на 2 ГБ и не упасть.','бесплатно',0],
 ['Everything','voidtools.com','https://www.voidtools.com/ru-ru/','Утилиты','Мгновенный поиск файлов по всему диску.','бесплатно',0],
 ['Sysinternals','sysinternals.com','https://learn.microsoft.com/sysinternals/','Утилиты','Process Explorer, Autoruns, PsExec: швейцарский нож Windows.','бесплатно',0],
 ['OBS Studio','obsproject.com','https://obsproject.com','Утилиты','Записать видеоинструкцию для пользователей.','бесплатно',1],
 ['PDF24','pdf24.org','https://tools.pdf24.org/ru/','Утилиты','Склеить, сжать и конвертировать PDF без интернета.','бесплатно',1],
 ['Xmind','xmind.app','https://xmind.app','Утилиты','Майнд-карты: схема сети или план миграции.','есть бесплатная',1],
 ['Nextcloud','nextcloud.com','https://nextcloud.com','Утилиты','Своё облако для файлов вместо чужого.','бесплатно',1],
 ['VLC','videolan.org','https://www.videolan.org','Утилиты','Откроет любое видео, даже архив с камеры.','бесплатно',1],
];
window.SOFT_LIST=SOFT;
const COL=['#39ff88','#00d1ff','#ffb020','#ff4d6d','#b18cff','#00e5c0'];
const cats=['Все','Стек автора',...new Set(SOFT.map(s=>s[3]))];
let cat='Все',q='';
window.sfFail=img=>{if(!img.dataset.t){img.dataset.t=1;img.src=`https://icons.duckduckgo.com/ip3/${img.dataset.d}.ico`;return}
  const b=document.createElement('span');b.className='sf-ic sf-letter';b.textContent=img.dataset.l;b.style.background=img.dataset.c;img.replaceWith(b)};
function icon(s,i){const d=s[1];return `<img class="sf-ic" src="https://www.google.com/s2/favicons?domain=${d}&sz=64" alt="" loading="lazy" data-d="${d}" data-l="${h(s[0][0])}" data-c="${COL[i%COL.length]}" onerror="sfFail(this)">`}
function render(){const L=SOFT.filter(s=>(cat==='Все'||(cat==='Стек автора'?s[6]:s[3]===cat))&&(!q||(s[0]+s[3]+s[4]).toLowerCase().includes(q)));
  $('#soft-cats').innerHTML=cats.map(c=>`<button class="chip${c===cat?' on':''}" data-c="${h(c)}">${h(c)}${c==='Все'?` · ${SOFT.length}`:c==='Стек автора'?` · ${SOFT.filter(s=>s[6]).length}`:''}</button>`).join('');
  document.querySelectorAll('#soft-cats [data-c]').forEach(b=>b.onclick=()=>{cat=b.dataset.c;render()});
  el.innerHTML=L.length?L.map(s=>`<a class="sf" href="${h(s[2])}" target="_blank" rel="noopener"><span class="sf-icw">${icon(s,SOFT.indexOf(s))}</span><span class="sf-body"><b>${h(s[0])}</b><span class="sf-d">${h(s[4])}</span><span class="sf-tags"><em>${h(s[3])}</em><em>${h(s[5])}</em>${s[6]?'<em class="own">стек автора</em>':''}</span></span><span class="sf-go" aria-hidden="true">↗</span></a>`).join('')
    :'<p class="muted">Ничего не нашлось.</p>';
}
$('#soft-q').oninput=e=>{q=e.target.value.trim().toLowerCase();render()};
render();
})();
