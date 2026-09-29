/* ne-for.ru — v3: конфигуратор MikroTik, серверная, cron/regex/diff/json/хэши, темы, звук, хакер-режим */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const store = { get(k,d){try{const v=localStorage.getItem(k);return v===null?d:JSON.parse(v)}catch(e){return d}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}} };
const css = (v) => getComputedStyle(document.body).getPropertyValue(v).trim();
const rndPass = (n=14) => { const a='ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; const r=new Uint32Array(n); crypto.getRandomValues(r); return [...r].map(x=>a[x%a.length]).join(''); };

/* ================= ЗВУК ================= */
let hum=null, AC=null, soundOn=store.get('nefor-sound',false);
const ac=()=>{if(!AC){try{AC=new (window.AudioContext||window.webkitAudioContext)()}catch(e){return null}}if(AC.state==='suspended')AC.resume();return AC};
function tone(freq=880,dur=.08,type='square',vol=.04){if(!soundOn)return;const a=ac();if(!a)return;const o=a.createOscillator(),g=a.createGain();o.type=type;o.frequency.value=freq;g.gain.setValueAtTime(vol,a.currentTime);g.gain.exponentialRampToValueAtTime(.0001,a.currentTime+dur);o.connect(g).connect(a.destination);o.start();o.stop(a.currentTime+dur)}
function click(){if(!soundOn)return;const a=ac();if(!a)return;const len=Math.floor(a.sampleRate*.015),b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=(Math.random()*2-1)*Math.pow(1-i/len,3);const s=a.createBufferSource(),f=a.createBiquadFilter(),g=a.createGain();f.type='highpass';f.frequency.value=1800+Math.random()*900;g.gain.value=.25;s.buffer=b;s.connect(f).connect(g).connect(a.destination);s.start()}
const chime=()=>{[523,659,784,1047].forEach((f,i)=>setTimeout(()=>tone(f,.18,'triangle',.06),i*110))};
const postBeep=()=>tone(1000,.25,'square',.05);
function setSound(on){soundOn=on;store.set('nefor-sound',on);const b=$('#soundBtn');b.textContent='звук: '+(on?'вкл':'выкл');b.setAttribute('aria-pressed',on);if(on){ac();tone(660,.06)}else humStop()}
$('#soundBtn').onclick=()=>setSound(!soundOn);setSound(soundOn);
$('#cmd').addEventListener('keydown',click);

/* гул серверной */
function humStart(){const a=ac();if(!a)return;const len=a.sampleRate*2,b=a.createBuffer(1,len,a.sampleRate),d=b.getChannelData(0);let last=0;for(let i=0;i<len;i++){const w=Math.random()*2-1;last=(last+.02*w)/1.02;d[i]=last*3.5}
  const n=a.createBufferSource();n.buffer=b;n.loop=true;const lp=a.createBiquadFilter();lp.type='lowpass';lp.frequency.value=420;
  const o=a.createOscillator();o.type='sine';o.frequency.value=100;const og=a.createGain();og.gain.value=.025;
  const fan=a.createOscillator();fan.type='sawtooth';fan.frequency.value=187;const fg=a.createGain();fg.gain.value=.004;
  const g=a.createGain();g.gain.value=0;g.gain.linearRampToValueAtTime(.35,a.currentTime+1.2);
  n.connect(lp).connect(g);o.connect(og).connect(g);fan.connect(fg).connect(g);g.connect(a.destination);n.start();o.start();fan.start();hum={n,o,fan,g}}
function humStop(){if(!hum||!AC)return;const {n,o,fan,g}=hum;g.gain.linearRampToValueAtTime(0,AC.currentTime+.5);setTimeout(()=>{try{n.stop();o.stop();fan.stop()}catch(e){}},600);hum=null;const b=$('#humBtn');b.textContent='гул серверной: выкл';b.setAttribute('aria-pressed','false')}
$('#humBtn').onclick=()=>{if(hum){humStop();return}if(!soundOn)setSound(true);humStart();const b=$('#humBtn');b.textContent='гул серверной: вкл';b.setAttribute('aria-pressed','true')};

/* ================= ТЕМЫ ================= */
const THEMES=[['','зелёная'],['t-amber','янтарь'],['t-ice','лёд'],['t-light','офис']];
let ti=Math.max(0,THEMES.findIndex(t=>t[0]===store.get('nefor-theme','')));
function applyTheme(i){THEMES.forEach(t=>t[0]&&document.body.classList.remove(t[0]));ti=(i+THEMES.length)%THEMES.length;if(THEMES[ti][0])document.body.classList.add(THEMES[ti][0]);store.set('nefor-theme',THEMES[ti][0]);$('#themeBtn').textContent='тема: '+THEMES[ti][1];rackDraw&&rackDraw();unDraw&&unDraw()}
$('#themeBtn').onclick=()=>{applyTheme(ti+1);tone(440+ti*110,.05)};

/* ================= КОНФИГУРАТОР MIKROTIK ================= */
const F=id=>document.getElementById('mt-'+id);
F('wpass').value=rndPass(14);F('gpass').value=rndPass(10);
const q=s=>'"'+String(s).replace(/\\/g,'\\\\').replace(/"/g,'\\"').replace(/\$/g,'\\$')+'"';
function cidr(s){const [ip,pf]=String(s).trim().split('/');const n=ip2n(ip||'');const p=+pf;if(n===null||!(p>=1&&p<=30))return null;const m=(0xffffffff<<(32-p))>>>0,net=(n&m)>>>0,bc=(net|(~m>>>0))>>>0;return {ip:n2ip(n),n,p,net,bc,netS:n2ip(net)+'/'+p}}
function ports(s){const out=[];String(s).split(/[,\s]+/).filter(Boolean).forEach(t=>{const m=t.match(/^([a-z-]*?)(\d+)-(?:\1)?(\d+)$/i);if(m){for(let i=+m[2];i<=+m[3]&&out.length<64;i++)out.push(m[1]+i)}else out.push(t)});return out}
function genMT(){
  const v=k=>F(k).value.trim(),on=k=>F(k).checked,W=[],L=[];
  const cm=t=>L.push('# '+t),a=t=>L.push(t),bl=()=>L.push('');
  const wanType=v('wantype'),wan=v('wan')||'ether1',lan=cidr(v('lanip')),lanPorts=ports(v('lanports')),wifi=on('wifi'),drv=v('wdrv'),guest=wifi&&on('guest'),g=cidr(v('gnet')),lte=on('lte'),beacon=v('beacon'),dns=v('dns').split(/[,\s]+/).filter(Boolean);
  F('static').hidden=wanType!=='static';F('pppoe').hidden=wanType!=='pppoe';F('gbox').hidden=!guest;F('bbox').hidden=!lte;
  ['wdrv','ssid','wpass','guest'].forEach(k=>F(k).closest('label').style.opacity=wifi?1:.45);
  if(!lan)W.push('Адрес LAN не похож на IP/маску (пример: 192.168.10.1/24).');
  if(lanPorts.includes(wan))W.push(`Порт ${wan} указан и в WAN, и в LAN.`);
  if(wifi&&v('wpass').length<8)W.push('Пароль Wi-Fi короче 8 символов: WPA2 его не примет.');
  if(guest&&!g)W.push('Подсеть гостей не похожа на IP/маску.');
  if(guest&&g&&lan&&(g.net<=lan.bc&&lan.net<=g.bc))W.push('Гостевая подсеть пересекается с LAN.');
  if(guest&&v('gpass').length<8)W.push('Пароль гостевой сети короче 8 символов.');
  if(wanType==='pppoe'&&!v('pu'))W.push('Не указан логин PPPoE.');
  const sw=cidr(v('wanip'));if(wanType==='static'&&(!sw||ip2n(v('wangw'))===null))W.push('Проверь статический IP и шлюз WAN.');
  if(lte&&dns.includes(beacon))W.push('Маяк совпадает с DNS-сервером: при падении основного канала DNS тоже отвалится.');
  if(lte&&ip2n(beacon)===null)W.push('Маяк должен быть IP-адресом.');
  if(v('user')&&v('upass').length<8)W.push('Пароль нового админа короче 8 символов.');
  const wanIf=wanType==='pppoe'?'pppoe-out1':wan;

  cm(`ne-for.ru · конфигуратор MikroTik · RouterOS 7.x · ${new Date().toLocaleDateString('ru')}`);
  cm('Чистый роутер: /system reset-configuration no-defaults=yes skip-backup=yes');
  cm('Импорт: закинь файл в Files и выполни /import file-name=office-gw.rsc verbose=yes');
  bl();cm('--- Система');
  a(`/system identity set name=${q(v('id')||'MikroTik')}`);
  a(`/system clock set time-zone-autodetect=no time-zone-name=${v('tz')}`);
  a('/system ntp client set enabled=yes');
  a('/system ntp client servers add address=0.ru.pool.ntp.org');
  a('/system ntp client servers add address=1.ru.pool.ntp.org');

  bl();cm('--- Бриджи и списки интерфейсов');
  a('/interface bridge add name=bridge-lan comment="LAN"');
  if(guest)a('/interface bridge add name=bridge-guest comment="Guest"');
  lanPorts.forEach(p=>a(`/interface bridge port add bridge=bridge-lan interface=${p}`));
  a('/interface list add name=WAN');a('/interface list add name=LAN');if(guest)a('/interface list add name=GUEST');
  a('/interface list member add list=LAN interface=bridge-lan');
  if(guest)a('/interface list member add list=GUEST interface=bridge-guest');

  if(wifi){bl();cm('--- Wi-Fi: настраиваются все физические радио (2.4 и 5 ГГц)');
    if(drv==='wifi'){
      a(':foreach i in=[/interface wifi find where default-name~"wifi"] do={');
      a('  :local n [/interface wifi get $i name]');
      a(`  /interface wifi set $i configuration.ssid=${q(v('ssid'))} security.authentication-types=wpa2-psk,wpa3-psk security.passphrase=${q(v('wpass'))} disabled=no`);
      a('  /interface bridge port add bridge=bridge-lan interface=$n');
      if(guest){a(`  /interface wifi add master-interface=$n name=("guest-".$n) configuration.ssid=${q(v('gssid'))} security.authentication-types=wpa2-psk,wpa3-psk security.passphrase=${q(v('gpass'))} disabled=no`);
        a('  /interface bridge port add bridge=bridge-guest interface=("guest-".$n)')}
      a('}');
    }else{
      a(`/interface wireless security-profiles add name=sp-lan mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=${q(v('wpass'))}`);
      if(guest)a(`/interface wireless security-profiles add name=sp-guest mode=dynamic-keys authentication-types=wpa2-psk wpa2-pre-shared-key=${q(v('gpass'))}`);
      a(':foreach i in=[/interface wireless find where default-name~"wlan"] do={');
      a('  :local n [/interface wireless get $i name]');
      a(`  /interface wireless set $i mode=ap-bridge ssid=${q(v('ssid'))} security-profile=sp-lan frequency=auto disabled=no`);
      a('  /interface bridge port add bridge=bridge-lan interface=$n');
      if(guest){a(`  /interface wireless add master-interface=$n name=("guest-".$n) ssid=${q(v('gssid'))} security-profile=sp-guest disabled=no`);
        a('  /interface bridge port add bridge=bridge-guest interface=("guest-".$n)')}
      a('}');
    }}

  if(lan){const lo=lan.p<=24?lan.net+10:lan.net+2,hi=lan.bc-1;
    bl();cm('--- LAN: адрес, DHCP, DNS');
    a(`/ip address add address=${lan.ip}/${lan.p} interface=bridge-lan`);
    a(`/ip pool add name=pool-lan ranges=${n2ip(lo)}-${n2ip(hi)}`);
    a('/ip dhcp-server add name=dhcp-lan interface=bridge-lan address-pool=pool-lan lease-time=1d disabled=no');
    a(`/ip dhcp-server network add address=${lan.netS} gateway=${lan.ip} dns-server=${lan.ip}`);}
  if(guest&&g){bl();cm('--- Гостевая сеть');
    a(`/ip address add address=${g.ip}/${g.p} interface=bridge-guest`);
    a(`/ip pool add name=pool-guest ranges=${n2ip(g.p<=24?g.net+10:g.net+2)}-${n2ip(g.bc-1)}`);
    a('/ip dhcp-server add name=dhcp-guest interface=bridge-guest address-pool=pool-guest lease-time=2h disabled=no');
    a(`/ip dhcp-server network add address=${g.netS} gateway=${g.ip} dns-server=${g.ip}`);}
  a(`/ip dns set servers=${dns.join(',')||'77.88.8.8'} allow-remote-requests=yes`);

  bl();cm('--- WAN');
  if(wanType==='dhcp'){
    if(lte){a(`/ip dhcp-client add interface=${wan} use-peer-dns=no add-default-route=no disabled=no script={`);
      a('  :if ($bound=1) do={');
      a('    /ip route remove [find comment="beacon ISP1"]');
      a(`    /ip route add dst-address=${beacon}/32 gateway=$"gateway-address" scope=10 comment="beacon ISP1"`);
      a('  }');a('}');}
    else a(`/ip dhcp-client add interface=${wan} use-peer-dns=no add-default-route=yes disabled=no`);
  }else if(wanType==='static'&&sw){
    a(`/ip address add address=${v('wanip')} interface=${wan}`);
    if(lte)a(`/ip route add dst-address=${beacon}/32 gateway=${v('wangw')} scope=10 comment="beacon ISP1"`);
    else a(`/ip route add dst-address=0.0.0.0/0 gateway=${v('wangw')} comment="WAN"`);
  }else if(wanType==='pppoe'){
    a(`/interface pppoe-client add name=pppoe-out1 interface=${wan} user=${q(v('pu'))} password=${q(v('pp'))} add-default-route=${lte?'no':'yes'} use-peer-dns=no disabled=no`);
    if(lte)a(`/ip route add dst-address=${beacon}/32 gateway=pppoe-out1 scope=10 comment="beacon ISP1"`);
  }
  a(`/interface list member add list=WAN interface=${wanIf}`);
  if(lte){bl();cm('--- Резерв LTE: основной маршрут живёт, пока пингуется маяк через ISP1');
    a(`/ip route add dst-address=0.0.0.0/0 gateway=${beacon} target-scope=11 check-gateway=ping distance=1 comment="WAN1 recursive"`);
    a('/interface lte apn set [find default=yes] default-route-distance=2');
    cm('APN оператора при необходимости: /interface lte apn set [find default=yes] apn=internet');
    a('/interface list member add list=WAN interface=lte1');}
  a('/ip firewall nat add chain=srcnat out-interface-list=WAN action=masquerade comment="NAT"');

  if(on('fw')){bl();cm('--- Firewall');
    a('/ip firewall filter');
    a('add chain=input action=accept connection-state=established,related,untracked comment="input: established"');
    a('add chain=input action=drop connection-state=invalid comment="input: invalid"');
    a('add chain=input action=accept protocol=icmp comment="input: icmp"');
    a('add chain=input action=accept dst-address=127.0.0.1 comment="input: loopback"');
    if(guest){a('add chain=input action=accept in-interface-list=GUEST protocol=udp dst-port=53,67 comment="guest: dns, dhcp"');
      a('add chain=input action=accept in-interface-list=GUEST protocol=tcp dst-port=53 comment="guest: dns tcp"')}
    a('add chain=input action=drop in-interface-list=!LAN comment="input: drop all not from LAN"');
    a('add chain=forward action=fasttrack-connection connection-state=established,related hw-offload=yes comment="fasttrack"');
    a('add chain=forward action=accept connection-state=established,related,untracked comment="forward: established"');
    a('add chain=forward action=drop connection-state=invalid comment="forward: invalid"');
    if(guest)a('add chain=forward action=drop in-interface-list=GUEST out-interface-list=!WAN comment="guest: only internet"');
    a('add chain=forward action=drop connection-state=new connection-nat-state=!dstnat in-interface-list=WAN comment="forward: drop WAN not DSTNATed"');}

  if(on('harden')){bl();cm('--- Закрываем лишнее');
    a('/ip service disable telnet,ftp,www,api,api-ssl');
    if(lan){a(`/ip service set winbox address=${lan.netS}`);a(`/ip service set ssh address=${lan.netS}`)}
    a('/ip ssh set strong-crypto=yes');
    a('/tool mac-server set allowed-interface-list=LAN');
    a('/tool mac-server mac-winbox set allowed-interface-list=LAN');
    a('/ip neighbor discovery-settings set discover-interface-list=LAN');
    a('/tool bandwidth-server set enabled=no');}

  bl();cm('--- Пользователи');
  if(v('user')){a(`/user add name=${q(v('user'))} group=full password=${q(v('upass'))}`);cm('Зайди под новым пользователем и только потом: /user disable admin')}
  else cm('Не забудь пароль: /user set admin password="..."');

  const code=L.join('\n');
  $('#mt-code').innerHTML=L.map(l=>{const e=h(l);if(/^\s*#/.test(l))return `<span class="cm">${e}</span>`;const m=e.match(/^(\s*)(\/[a-z\- ]+?)(?=\s(?:add|set|remove|disable|enable)\b|$)/);return m?m[1]+`<span class="pa">${m[2]}</span>`+e.slice(m[0].length):e.replace(/^(\s*)(add|:foreach|:local|:if)/,'$1<span class="kw">$2</span>')}).join('\n');
  $('#mt-warn').innerHTML=W.map(w=>`<div class="warnbox">⚠ ${h(w)}</div>`).join('');
  genMT.last=code;return code;
}
$('#mtform').addEventListener('input',genMT);$('#mtform').addEventListener('change',genMT);$('#mtform').onsubmit=e=>e.preventDefault();
$('#mt-copy').onclick=()=>copy(genMT.last);
$('#mt-dl').onclick=()=>{const b=new Blob([genMT.last.replace(/\n/g,'\r\n')],{type:'text/plain'});const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(F('id').value.trim()||'mikrotik')+'.rsc';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),2000)};
genMT();

/* ================= СЕРВЕРНАЯ ================= */
const RK=$('#rackcv'),rx=RK.getContext('2d'),U=11,Y0=8;
const DEV=[
 {u:1,h:1,id:'patch',name:'Патч-панель 24p',role:'Cat.6, всё подписано (почти всё)',logs:['порт 17 подписан как «???»','кто-то вынул патч-корд из 12 порта','найден кабель, ведущий в никуда','маркировка обновлена маркером']},
 {u:2,h:1,id:'sw',name:'Коммутатор 24×1G',role:'Ядро LAN · VLAN 10, 20, 99',boot:1,logs:['port 7 link up 1000Mbps','port 7 link down','STP: topology change on port 14','MAC flapping 3c:52:82:aa:10:fe port 3 ↔ 9','port 22 link up 100Mbps (кабель-то старый)','LLDP: neighbor office-gw on port 1']},
 {u:3,h:1,id:'gw',name:'Роутер MikroTik',role:'NAT, SSTP в хаб, резерв LTE',boot:1,logs:['firewall: drop 185.220.101.7 -> :22','sstp-hub: connected','dhcp-lan: assigned 192.168.10.54','lte1: RSRP -97 dBm, SINR 12 dB','netwatch: 8.8.4.4 up','firewall: drop 45.95.147.x -> :8291 (опять Winbox ищут)']},
 {u:4,h:1,id:'cm',name:'Кабельный органайзер',role:'Здесь кабели. Много кабелей.',logs:['кабель выбрался из органайзера','стяжки закончились','обнаружен кабель без второго конца']},
 {u:5,h:2,id:'dc',name:'srv-dc01',role:'Контроллер домена, DNS, DHCP',boot:1,logs:['4624 успешный вход: buh01','4625 неудачный вход: admin (3 раза)','DNS: zone corp.local refreshed','GPO применены на 42 ПК','4740 учётка заблокирована: ivanov','NTDS: репликация OK']},
 {u:7,h:2,id:'app',name:'srv-app01',role:'1С и терминальный сервер',boot:1,logs:['rphost.exe: память 11.2 ГБ','RDP: подключился sklad02','1С: блокировка таблицы Документ.Реализация','сеансов: 23','rphost.exe перезапущен','RDP: отключился buh03 (обед)']},
 {u:9,h:2,id:'nas',name:'nas01',role:'Бэкапы. Проверены? Наверное.',boot:1,logs:['backup srv-app01: OK, 184 ГБ','RAID5: все 4 диска в норме','диск 3: SMART reallocated 8','snapshot создан','backup srv-dc01: OK','корзина SMB очищена']},
 {u:11,h:2,id:'ups',name:'ИБП 3 кВА',role:'Держит 12 минут. В теории.',boot:0,logs:['вход 228 В, выход 220 В','нагрузка стабильна','переход на батарею 0.4 с (моргнул свет)','возврат на сеть','самотест пройден']},
];
DEV.forEach(d=>{d.on=true;d.load=20+Math.random()*40;d.up=Math.floor(Math.random()*90*86400);d.lines=[];d.boot0=0});
let sel=DEV[2],tick=0,env={t:23.4,hm:41,db:61};
const C={frame:'#2b302e',rail:'#3a403d',hole:'#161918',dev:'#1c211f',dev2:'#262c29',edge:'#353c38',port:'#0b0d0c',label:'#8a948f'};
const px=(x,y,w,hh,c)=>{rx.fillStyle=c;rx.fillRect(x,y,w,hh)};
function rackDraw(){
  const acc=css('--acc')||'#39ff88',warn=css('--warn')||'#ffb020',bad=css('--bad')||'#ff4d6d';
  rx.clearRect(0,0,100,148);px(0,0,100,148,'#0b0d0c');
  px(4,2,92,144,C.frame);px(6,4,88,140,'#101312');
  for(let i=0;i<12;i++){const y=Y0+i*U;[7,90].forEach(x=>{px(x,y+2,3,2,C.hole);px(x,y+7,3,2,C.hole)})}
  DEV.forEach(d=>{const y=Y0+(d.u-1)*U,H=d.h*U-1,x=11,w=78,on=d.on,blink=()=>on&&Math.random()>.45;
    px(x,y,w,H,C.dev);px(x,y,w,1,C.edge);px(x,y+H-1,w,1,'#121514');
    if(d.id==='patch'){for(let i=0;i<24;i++){const px_=x+4+i*3+(i>11?3:0);px(px_,y+4,2,3,C.port);px(px_,y+2,2,1,'#2d3531')}}
    if(d.id==='sw'){for(let i=0;i<24;i++){const px_=x+4+i*3+(i>11?2:0);px(px_,y+5,2,3,C.port);px(px_,y+2,2,1,blink()?(i%7===3?warn:acc):'#1d2622')}px(x+w-5,y+4,2,2,on?acc:'#222')}
    if(d.id==='gw'){px(x+3,y+3,10,5,C.dev2);px(x+4,y+4,2,1,on?'#5ad7ff':'#222');for(let i=0;i<10;i++){px(x+18+i*4,y+5,3,3,C.port);px(x+18+i*4,y+2,1,1,blink()?acc:'#1d2622');px(x+20+i*4,y+2,1,1,blink()?acc:'#1d2622')}px(x+60,y+4,5,4,'#2c3430');px(x+68,y+4,6,4,C.port)}
    if(d.id==='cm'){for(let i=0;i<9;i++){px(x+3+i*8,y+2,6,6,'#101312');const cc=['#3d7bd9','#d9c33d','#3dd97b','#888','#d97b3d'][i%5];px(x+4+i*8,y+5,4,4,cc)}}
    if(d.id==='dc'||d.id==='app'){px(x+2,y+2,w-4,H-4,C.dev2);for(let i=0;i<4;i++){px(x+5+i*11,y+5,9,11,'#141816');px(x+6+i*11,y+6,7,1,'#39403c');px(x+12+i*11,y+14,1,1,blink()?acc:'#1d2622')}
      for(let r=0;r<4;r++)for(let c=0;c<6;c++)px(x+52+c*3,y+5+r*3,2,1,'#0e110f');px(x+w-7,y+5,3,3,on?acc:'#2a2a2a');px(x+w-7,y+11,3,2,on&&Math.random()>.3?warn:'#2a2a2a')}
    if(d.id==='nas'){px(x+2,y+2,w-4,H-4,C.dev2);for(let i=0;i<4;i++){px(x+6+i*15,y+4,13,14,'#131715');px(x+8+i*15,y+15,2,1,on?acc:'#222');px(x+12+i*15,y+15,2,1,blink()?(i===2?warn:'#5ad7ff'):'#1d2622')}px(x+w-8,y+5,4,4,on?'#5ad7ff':'#222')}
    if(d.id==='ups'){px(x+2,y+2,w-4,H-4,'#1a1d1c');px(x+6,y+5,26,11,on?'#0f2a1a':'#111');if(on){const lv=Math.round(d.load/100*22);px(x+8,y+12,lv,2,d.load>80?bad:acc);px(x+8,y+7,3,3,acc);px(x+13,y+7,3,3,acc)}
      for(let r=0;r<3;r++)for(let c=0;c<10;c++)px(x+40+c*3,y+5+r*4,2,2,'#101312');px(x+w-8,y+7,4,4,on?acc:'#222')}
    if(!on){rx.fillStyle='rgba(0,0,0,.55)';rx.fillRect(x,y,w,H)}
    if(d===sel){rx.strokeStyle=acc;rx.lineWidth=1;rx.strokeRect(x-.5,y-.5,w+1,H+1)}
  });
}
function fmtUp(s){const d=Math.floor(s/86400),hh=Math.floor(s%86400/3600),m=Math.floor(s%3600/60);return `${d} д ${hh} ч ${m} мин`}
function rlog(d,msg,cls=''){const t=new Date().toLocaleTimeString('ru');d.lines.push(`<span class="t">${t}</span> <span class="${cls}">${h(msg)}</span>`);if(d.lines.length>14)d.lines.shift();if(d===sel){const b=$('#rlog');if(b)b.innerHTML=d.lines.map(l=>'<div>'+l+'</div>').join('')}}
function info(){const d=sel;$('#rackinfo').innerHTML=`<div><h3>${h(d.name)}</h3><div class="role">${h(d.role)}</div></div>
  <dl class="kv" style="margin:0"><dt>Статус</dt><dd id="rst">${d.on?'<span style="color:var(--acc)">● работает</span>':'<span style="color:var(--warn)">◐ загружается…</span>'}</dd>
  <dt>Аптайм</dt><dd id="rup">${d.on?fmtUp(d.up):'—'}</dd><dt>${d.id==='ups'?'Нагрузка':'CPU'}</dt><dd><div class="meter"><i id="rld" style="width:${d.load}%"></i></div></dd></dl>
  <div class="rlog" id="rlog">${d.lines.map(l=>'<div>'+l+'</div>').join('')}</div>
  <div class="row">${d.boot?`<button class="btn ghost" id="rboot" style="flex:0 0 auto">Перезагрузить</button>`:''}${d.id==='ups'?'<button class="btn ghost" id="rtest" style="flex:0 0 auto">Тест батареи</button>':''}${!d.boot&&d.id!=='ups'?'<span style="color:var(--mut);font-size:13px">Пассивное железо. Перезагружать нечего, но можно поправить кабели ниже.</span>':''}</div>`;
  const rb=$('#rboot');if(rb)rb.onclick=()=>reboot(d);const rt=$('#rtest');if(rt)rt.onclick=()=>{rlog(d,'самотест: переход на батарею…','w');tone(2000,.4,'square',.03);setTimeout(()=>{rlog(d,'батарея: 97%, расчётное время 12 мин');rlog(d,'самотест пройден')},2200)}}
function reboot(d){if(!d.on)return;d.on=false;rlog(d,'получена команда reboot','w');info();rackDraw();
  setTimeout(()=>{postBeep();rlog(d,'POST… OK')},1400);setTimeout(()=>{rlog(d,'загрузка ОС…')},2300);
  setTimeout(()=>{d.on=true;d.up=0;d.load=65;rlog(d,'сервис запущен. Пользователи ничего не заметили (почти).');if(d===sel)info();rackDraw()},3800)}
function pickDev(e){const r=RK.getBoundingClientRect(),y=(e.clientY-r.top)/r.height*148;const u=Math.floor((y-Y0)/U)+1;return DEV.find(d=>u>=d.u&&u<d.u+d.h)}
RK.addEventListener('click',e=>{const d=pickDev(e);if(d){sel=d;tone(1200,.03);info();rackDraw()}});
RK.addEventListener('mousemove',e=>{const d=pickDev(e);RK.title=d?d.name:''});
function rackTick(){tick++;DEV.forEach(d=>{if(d.on){d.up+=1;d.load=Math.max(3,Math.min(97,d.load+(Math.random()-.5)*8));if(Math.random()<.035)rlog(d,d.logs[Math.floor(Math.random()*d.logs.length)],/drop|неудач|заблок|SMART|flapping|батарею/.test(d.logs[0])&&Math.random()<.3?'w':'')}});
  env.t=Math.max(19,Math.min(28,env.t+(Math.random()-.5)*.2));env.hm=Math.max(30,Math.min(60,env.hm+(Math.random()-.5)));env.db=58+Math.random()*6;
  $('#rackenv').innerHTML=`<span>Темп.: <b>${env.t.toFixed(1)}°C</b></span><span>Влажн.: <b>${Math.round(env.hm)}%</b></span><span>Шум: <b>${Math.round(env.db)} дБ</b></span>`;
  if(sel.on){const up=$('#rup');if(up)up.textContent=fmtUp(sel.up);const ld=$('#rld');if(ld)ld.style.width=sel.load+'%'}rackDraw()}
DEV.forEach(d=>{for(let i=0;i<5;i++)rlog(d,d.logs[i%d.logs.length])});info();rackDraw();
let rackTimer=null;new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting&&!rackTimer)rackTimer=setInterval(rackTick,1000/3);else if(!e.isIntersecting&&rackTimer){clearInterval(rackTimer);rackTimer=null}})).observe(RK);

/* ================= КАБЕЛЬ-МЕНЕДЖМЕНТ (untangle) ================= */
const UC=$('#uncv'),ux=UC.getContext('2d'),UW=900,UH=480,NR=15;
let uN=[],uE=[],uLvl=store.get('nefor-untangle',1),uMoves=0,uDrag=null,uDone=false;
const CAB=['#3d7bd9','#e0c030','#35c46e','#9aa3a0','#e07b35','#a970e0','#e05aa0','#3dc4d9'];
const cross=(a,b,c,d)=>{const o=(p,q,r)=>Math.sign((q.x-p.x)*(r.y-p.y)-(q.y-p.y)*(r.x-p.x));return o(a,b,c)*o(a,b,d)<0&&o(c,d,a)*o(c,d,b)<0};
function crossings(){const bad=new Set();let n=0;for(let i=0;i<uE.length;i++)for(let j=i+1;j<uE.length;j++){const[a,b]=uE[i],[c,d]=uE[j];if(a===c||a===d||b===c||b===d)continue;if(cross(uN[a],uN[b],uN[c],uN[d])){n++;bad.add(i);bad.add(j)}}return{n,bad}}
function unNew(){const n=Math.min(6+(uLvl-1)*2,18);uE=[];for(let i=0;i<n;i++)uE.push([i,(i+1)%n]);
  const between=(x,a,b)=>{const lo=Math.min(a,b),hi=Math.max(a,b);return x>lo&&x<hi};
  for(let t=0;t<n*6;t++){const a=Math.floor(Math.random()*n),b=Math.floor(Math.random()*n);if(Math.abs(a-b)<2||Math.abs(a-b)===n-1)continue;if(uE.some(([c,d])=>(c===a&&d===b)||(c===b&&d===a)))continue;
    if(uE.some(([c,d])=>c!==a&&c!==b&&d!==a&&d!==b&&between(c,a,b)!==between(d,a,b)))continue;uE.push([a,b]);if(uE.length>=n*1.7)break}
  do{uN=Array.from({length:n},()=>({x:60+Math.random()*(UW-120),y:50+Math.random()*(UH-100)}))}while(crossings().n<Math.max(2,n/2));
  uMoves=0;uDone=false;$('#unl').textContent=uLvl;$('#unm').textContent=0;$('#unnext').hidden=true;unDraw()}
function unDraw(){if(!uN.length)return;const {n,bad}=crossings();$('#unx').textContent=n;
  const bg=css('--inset'),badc=css('--bad'),acc=css('--acc'),card=css('--card'),txt=css('--mut');
  ux.fillStyle=bg;ux.fillRect(0,0,UW,UH);ux.lineCap='round';
  uE.forEach(([a,b],i)=>{const p=uN[a],q=uN[b],mx=(p.x+q.x)/2,my=(p.y+q.y)/2;ux.strokeStyle=bad.has(i)?badc:CAB[i%CAB.length];ux.lineWidth=bad.has(i)?6:5;ux.globalAlpha=bad.has(i)?1:.9;ux.beginPath();ux.moveTo(p.x,p.y);ux.lineTo(q.x,q.y);ux.stroke();ux.globalAlpha=1});
  uN.forEach((p,i)=>{ux.fillStyle=card;ux.strokeStyle=uDrag===i?acc:(uDone?acc:txt);ux.lineWidth=uDrag===i?3:2;ux.beginPath();ux.roundRect(p.x-NR,p.y-NR*.8,NR*2,NR*1.6,4);ux.fill();ux.stroke();
    ux.fillStyle=uDone?acc:txt;for(let k=0;k<4;k++)ux.fillRect(p.x-8+k*4.5,p.y-5,2,6);ux.fillRect(p.x-5,p.y+4,10,3)});
  if(n===0&&!uDone&&uMoves>0){uDone=true;chime();toast(`Уровень ${uLvl} распутан за ${uMoves} ходов`);$('#unnext').hidden=false;store.set('nefor-untangle',uLvl+1);unDraw()}}
const upos=e=>{const r=UC.getBoundingClientRect();return{x:(e.clientX-r.left)/r.width*UW,y:(e.clientY-r.top)/r.height*UH}};
UC.addEventListener('pointerdown',e=>{const p=upos(e);let best=-1,bd=30*30;uN.forEach((n,i)=>{const d=(n.x-p.x)**2+(n.y-p.y)**2;if(d<bd){bd=d;best=i}});if(best>=0){uDrag=best;UC.setPointerCapture(e.pointerId);UC.style.cursor='grabbing';click();unDraw()}});
UC.addEventListener('pointermove',e=>{if(uDrag===null)return;const p=upos(e);uN[uDrag].x=Math.max(NR,Math.min(UW-NR,p.x));uN[uDrag].y=Math.max(NR,Math.min(UH-NR,p.y));unDraw()});
const uUp=()=>{if(uDrag===null)return;uDrag=null;uMoves++;$('#unm').textContent=uMoves;UC.style.cursor='grab';unDraw()};
UC.addEventListener('pointerup',uUp);UC.addEventListener('pointercancel',uUp);
$('#unreset').onclick=unNew;$('#unnext').onclick=()=>{uLvl++;unNew()};
if(!CanvasRenderingContext2D.prototype.roundRect)CanvasRenderingContext2D.prototype.roundRect=function(x,y,w,hh){this.rect(x,y,w,hh)};
unNew();

/* ================= CRON ================= */
const MON={jan:1,feb:2,mar:3,apr:4,may:5,jun:6,jul:7,aug:8,sep:9,oct:10,nov:11,dec:12},DOWN={sun:0,mon:1,tue:2,wed:3,thu:4,fri:5,sat:6};
const DN=['вс','пн','вт','ср','чт','пт','сб'],MN=['','янв','фев','мар','апр','май','июн','июл','авг','сен','окт','ноя','дек'];
function cf(str,min,max,names){const set=new Set();for(const part of str.toLowerCase().split(',')){let[r,st]=part.split('/');const step=st===undefined?1:+st;if(!(step>=1))throw 0;let lo,hi;
  const val=x=>{if(names&&names[x]!==undefined)return names[x];if(!/^\d+$/.test(x))throw 0;return +x};
  if(r==='*'){lo=min;hi=max}else if(r.includes('-')){[lo,hi]=r.split('-').map(val)}else{lo=val(r);hi=st!==undefined?max:lo}
  if(names===DOWN&&hi===7)hi=7;if(lo<min||hi>max+(names===DOWN?1:0)||lo>hi)throw 0;for(let i=lo;i<=hi;i+=step)set.add(names===DOWN?i%7:i)}return set}
const PRE={'@yearly':'0 0 1 1 *','@annually':'0 0 1 1 *','@monthly':'0 0 1 * *','@weekly':'0 0 * * 0','@daily':'0 0 * * *','@midnight':'0 0 * * *','@hourly':'0 * * * *'};
function compress(arr,map=x=>x){const a=[...arr].sort((x,y)=>x-y),out=[];for(let i=0;i<a.length;i++){let j=i;while(j+1<a.length&&a[j+1]===a[j]+1)j++;out.push(j-i>=2?map(a[i])+'–'+map(a[j]):j>i?map(a[i])+', '+map(a[j]):map(a[i]));i=j}return out.join(', ')}
function cronRun(){const raw=$('#cronin').value.trim(),expr=PRE[raw]||raw,f=expr.split(/\s+/);
  if(f.length!==5){$('#crontxt').innerHTML='<span style="color:var(--bad)">Нужно 5 полей: минута час день месяц день_недели</span>';$('#cronnext').innerHTML='';return}
  let m,hh,dom,mon,dow;try{m=cf(f[0],0,59);hh=cf(f[1],0,23);dom=cf(f[2],1,31);mon=cf(f[3],1,12,MON);dow=cf(f[4],0,6,DOWN)}catch(e){$('#crontxt').innerHTML='<span style="color:var(--bad)">Не разобрал выражение. Пример: */5 * * * *</span>';$('#cronnext').innerHTML='';return}
  const st=s=>{const x=s.match(/^\*\/(\d+)$/);return x?+x[1]:0},pad=x=>String(x).padStart(2,'0');let t=[];
  if(m.size===1&&hh.size===1)t.push(`в ${pad([...hh][0])}:${pad([...m][0])}`);
  else{t.push(f[0]==='*'?'каждую минуту':st(f[0])?`каждые ${st(f[0])} мин`:`в ${compress(m)} мин.`);
    if(f[1]!=='*')t.push(st(f[1])?`каждые ${st(f[1])} ч`:`${hh.size>1?'в часы':'в час'} ${compress(hh,pad)}`);else if(f[0]!=='*'&&!st(f[0]))t.push('каждого часа')}
  if(f[2]!=='*')t.push(`${dom.size>1?'числа':'числа'} ${compress(dom)}`);
  if(f[3]!=='*')t.push(`в ${compress(mon,x=>MN[x])}`);
  if(f[4]!=='*')t.push(`по дням: ${compress(dow,x=>DN[x])}`);
  if(f[2]!=='*'&&f[4]!=='*')t.push('(день месяца ИЛИ день недели)');
  $('#crontxt').innerHTML=h(t.join(', ').replace(/^./,c=>c.toUpperCase()));
  const res=[],d=new Date();d.setSeconds(0,0);d.setMinutes(d.getMinutes()+1);const lim=Date.now()+4*366*864e5;
  const dayOk=x=>{const a=f[2]==='*',b=f[4]==='*',A=dom.has(x.getDate()),B=dow.has(x.getDay());return mon.has(x.getMonth()+1)&&(a&&b?true:a?B:b?A:(A||B))};
  while(res.length<6&&+d<lim){if(!dayOk(d)){d.setDate(d.getDate()+1);d.setHours(0,0,0,0);continue}if(!hh.has(d.getHours())){d.setHours(d.getHours()+1,0,0,0);continue}if(m.has(d.getMinutes()))res.push(new Date(d));d.setMinutes(d.getMinutes()+1)}
  $('#cronnext').innerHTML='<span style="color:var(--mut)">Ближайшие запуски:</span>'+(res.length?res.map(x=>`<span>${x.toLocaleString('ru',{weekday:'short',day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>`).join(''):'<span style="color:var(--warn)">не найдено за 4 года (31 февраля?)</span>')}
$('#cronin').oninput=cronRun;
[['каждые 5 минут','*/5 * * * *'],['бэкап в 3 ночи','0 3 * * *'],['будни 9:00','0 9 * * 1-5'],['1-го числа','0 0 1 * *'],['вс 23:30','30 23 * * 0'],['@hourly','@hourly']].forEach(([l,e])=>{const b=document.createElement('button');b.className='chip';b.textContent=l;b.onclick=()=>{$('#cronin').value=e;cronRun()};$('#cronchips').append(b)});
cronRun();

/* ================= REGEX ================= */
function rxRun(){const pat=$('#rxpat').value,fl=$('#rxflags').value.replace(/[^dgimsuy]/g,''),txt=$('#rxtext').value;let re;
  try{re=new RegExp(pat,fl.includes('g')?fl:fl+'g')}catch(e){$('#rxout').textContent=txt;$('#rxinfo').innerHTML=`<span style="color:var(--bad)">${h(e.message)}</span>`;return}
  if(!pat){$('#rxout').textContent=txt;$('#rxinfo').textContent='';return}
  let out='',last=0,cnt=0,first=null;for(const m of txt.matchAll(re)){if(cnt>2000)break;cnt++;if(!first)first=m;out+=h(txt.slice(last,m.index))+`<mark>${h(m[0])||'∅'}</mark>`;last=m.index+m[0].length}
  out+=h(txt.slice(last));$('#rxout').innerHTML=out;
  $('#rxinfo').innerHTML=cnt?`Совпадений: <b style="color:var(--acc)">${cnt}</b>${first&&first.length>1?' · группы первого: '+first.slice(1).map((g,i)=>`$${i+1}=<code>${h(g??'—')}</code>`).join(' '):''}`:'Совпадений нет'}
['rxpat','rxflags','rxtext'].forEach(id=>$('#'+id).oninput=rxRun);rxRun();

/* ================= DIFF ================= */
function diffRun(){const ws=$('#dfws').checked,A=$('#dfa').value.split('\n'),B=$('#dfb').value.split('\n'),n=Math.min(A.length,1500),m=Math.min(B.length,1500);
  const k=s=>ws?s.replace(/\s+/g,' ').trim():s;const dp=Array.from({length:n+1},()=>new Uint16Array(m+1));
  for(let i=n-1;i>=0;i--)for(let j=m-1;j>=0;j--)dp[i][j]=k(A[i])===k(B[j])?dp[i+1][j+1]+1:Math.max(dp[i+1][j],dp[i][j+1]);
  const out=[];let i=0,j=0,add=0,del=0;while(i<n||j<m){if(i<n&&j<m&&k(A[i])===k(B[j])){out.push(['s','  '+B[j]]);i++;j++}else if(i<n&&(j>=m||dp[i+1][j]>=dp[i][j+1])){out.push(['d','- '+A[i]]);i++;del++}else{out.push(['a','+ '+B[j]]);j++;add++}}
  $('#dfout').innerHTML=`<div class="s">+${add} / −${del}</div>`+out.map(([c,t])=>`<div class="${c}">${h(t)||' '}</div>`).join('')}
['dfa','dfb'].forEach(id=>$('#'+id).oninput=diffRun);$('#dfws').onchange=diffRun;diffRun();

/* ================= JSON / YAML ================= */
const JOPS={fmt:s=>JSON.stringify(JSON.parse(s),null,2),min:s=>JSON.stringify(JSON.parse(s)),
  toyaml:s=>{if(typeof jsyaml==='undefined')throw new Error('js-yaml не загрузился');return jsyaml.dump(JSON.parse(s),{lineWidth:120})},
  tojson:s=>{if(typeof jsyaml==='undefined')throw new Error('js-yaml не загрузился');return JSON.stringify(jsyaml.load(s),null,2)}};
document.querySelectorAll('#p-json .chip').forEach(b=>b.onclick=()=>{const o=$('#jout');try{o.textContent=JOPS[b.dataset.j]($('#jin').value);o.style.color=''}catch(e){const m=String(e.message).match(/position (\d+)/);let msg='Ошибка: '+e.message;if(m){const s=$('#jin').value,p=+m[1],ln=s.slice(0,p).split('\n').length;msg+=` (строка ${ln})`}o.textContent=msg;o.style.color='var(--bad)'}});
$('#jout').onclick=()=>copy($('#jout').textContent);
document.querySelector('#p-json [data-j="fmt"]').click();

/* ================= ХЭШИ / UUID ================= */
const hex=b=>[...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('');
async function hashAll(buf,text){const rows=[];rows.push(['MD5',text!==null&&typeof md5!=='undefined'?md5(text):'только для текста']);
  for(const alg of ['SHA-1','SHA-256','SHA-512']){try{rows.push([alg,hex(await crypto.subtle.digest(alg,buf))])}catch(e){rows.push([alg,'нужен HTTPS'])}}
  $('#hout').innerHTML=rows.map(r=>`<div title="клик — скопировать"><b>${r[0]}</b><span>${r[1]}</span></div>`).join('');
  document.querySelectorAll('#hout div').forEach(d=>d.onclick=()=>copy(d.querySelector('span').textContent))}
const hashText=()=>{$('#hfname').textContent='';const t=$('#hin').value;hashAll(new TextEncoder().encode(t),t)};
$('#hin').oninput=hashText;hashText();
$('#hfile').onchange=async e=>{const f=e.target.files[0];if(!f)return;$('#hfname').textContent=`${f.name} · ${(f.size/1048576).toFixed(1)} МБ · считаю…`;const buf=await f.arrayBuffer();await hashAll(buf,null);$('#hfname').textContent=`${f.name} · ${(f.size/1048576).toFixed(1)} МБ`};
function uuids(){const list=Array.from({length:5},()=>crypto.randomUUID?crypto.randomUUID():'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g,c=>{const r=crypto.getRandomValues(new Uint8Array(1))[0]%16;return(c==='x'?r:(r&3|8)).toString(16)}));
  $('#uuidout').innerHTML=list.map(u=>`<div title="клик — скопировать"><b>v4</b><span>${u}</span></div>`).join('');document.querySelectorAll('#uuidout div').forEach(d=>d.onclick=()=>copy(d.querySelector('span').textContent));return list[0]}
$('#uuidgo').onclick=uuids;uuids();

/* ================= ХАКЕР-РЕЖИМ ================= */
const HACK=`# ne-for.ru :: operation "НЕ ДЛЯ ВСЕХ"
Import-Module ActiveDirectory
$targets = Get-ADComputer -Filter * -SearchBase "OU=Servers,DC=corp,DC=local"
foreach ($t in $targets) {
    if (Test-Connection $t.DNSHostName -Count 1 -Quiet) {
        Invoke-Command -ComputerName $t.DNSHostName -ScriptBlock {
            Get-Service | Where-Object Status -eq 'Stopped' | Start-Service -WhatIf
        }
    }
}
/ip firewall filter add chain=input src-address-list=bruteforce action=drop
/ip firewall filter add chain=input protocol=tcp dst-port=22 connection-state=new \\
    src-address-list=ssh_stage2 action=add-src-to-address-list address-list=bruteforce address-list-timeout=1w
/tool sniffer quick interface=bridge-lan port=443
#!/bin/bash
for host in $(seq 1 254); do
  ping -c1 -W1 192.168.10.$host &>/dev/null && echo "[+] 192.168.10.$host alive"
done
nmap -sV -p 22,80,443,3389,8291 192.168.10.0/24 --open
[+] 192.168.10.1   8291/tcp open  winbox
[+] 192.168.10.5   3389/tcp open  ms-wbt-server
[+] 192.168.10.12  445/tcp  open  microsoft-ds
decrypting handshake............. OK
bypassing бухгалтерия firewall... OK
injecting кофе в /dev/admin....... OK
SELECT * FROM users WHERE sense_of_humor > 0;
0x7f3a 0x00 0x1c 0x9e 0x44 0xde 0xad 0xbe 0xef
Get-WinEvent -FilterHashtable @{LogName='Security';Id=4625} -MaxEvents 50 |
    Group-Object {$_.Properties[5].Value} | Sort-Object Count -Descending
`;
let hp=0,hk=0;const HO=$('#hack'),HP=$('#hackpre');
function hackOpen(){HO.hidden=false;HP.textContent='';hp=0;hk=0;document.body.style.overflow='hidden'}
function hackClose(){HO.hidden=true;$('#granted').hidden=true;document.body.style.overflow=''}
function hackType(){const n=3+Math.floor(Math.random()*4);HP.textContent+=HACK.slice(hp,hp+n);hp=(hp+n)%HACK.length;if(HP.textContent.length>6000)HP.textContent=HP.textContent.slice(-4000);click();
  if(++hk%70===0){const g=$('#granted'),ok=Math.random()>.3;g.textContent=ok?'ACCESS GRANTED':'ACCESS DENIED';g.classList.toggle('den',!ok);g.hidden=false;ok?chime():tone(120,.4,'sawtooth',.06);setTimeout(()=>g.hidden=true,1600)}}
addEventListener('keydown',e=>{if(HO.hidden)return;e.preventDefault();e.stopPropagation();if(e.key==='Escape')return hackClose();hackType()},true);
HO.addEventListener('pointerdown',()=>{for(let i=0;i<3;i++)hackType()});

/* ================= ТЕРМИНАЛ ================= */
Object.assign(CMDS,{
  hack:()=>{setTimeout(hackOpen,300);return '<span class="p">Инициализация… жми любые клавиши. Esc — выход.</span>'},
  theme:a=>{const i=THEMES.findIndex(t=>t[1]===a.trim());applyTheme(i>=0?i:ti+1);return `Тема: <span class="p">${THEMES[ti][1]}</span>. Доступны: ${THEMES.map(t=>t[1]).join(', ')}`},
  sound:()=>{setSound(!soundOn);return 'Звук '+(soundOn?'включён':'выключен')},
  rack:()=>{location.hash='rack';return 'В серверную →'},
  config:()=>{location.hash='mtconf';return 'Конфигуратор MikroTik →'},
  uuid:()=>uuids(),
});
['hack','theme','rack'].forEach(c=>{const b=document.createElement('button');b.className='chip';b.textContent=c;b.onclick=()=>{run(c);$('#cmd').focus()};$('#chips').append(b)});

applyTheme(ti);
})();
