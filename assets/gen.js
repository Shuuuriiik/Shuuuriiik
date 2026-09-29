/* ne-for.ru — генератор PowerShell, инструкции для пользователей, калькулятор ИБП/PoE, проверка сайта */
(() => {
const h = (s) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const ach = id => window.ach?.(id);
const q1 = s => "'" + String(s).replace(/'/g,"''") + "'";
const dl = (name, text, type='text/plain') => { const a=document.createElement('a'); a.href=URL.createObjectURL(new Blob([text],{type})); a.download=name; a.click(); setTimeout(()=>URL.revokeObjectURL(a.href),2000); };

/* вкладки генераторов */
document.querySelectorAll('#gtabs .tab').forEach(t=>t.onclick=()=>{
  document.querySelectorAll('#gtabs .tab').forEach(x=>x.classList.toggle('on',x===t));
  document.querySelectorAll('.gpane').forEach(p=>p.classList.toggle('on',p.id==='g-'+t.dataset.g));
});

/* ================= PowerShell ================= */
const PS={
 users:{t:'Пользователи AD из CSV',
  f:[['csv','Путь к CSV','C:\\Scripts\\users.csv'],['ou','OU для новых учёток','OU=Users,OU=Office,DC=corp,DC=local'],['upn','UPN-суффикс','corp.local'],
     ['groups','Группы (через запятую)','Office-Users'],['pw','Пароли',['random','Случайный для каждого'],['one','Один временный']],['temp','Временный пароль','Welcome2026!'],
     ['out','Куда выгрузить пароли','C:\\Scripts\\created-users.csv'],['dry','Пробный запуск (-WhatIf)',true]],
  sample:'LastName;FirstName;MiddleName;Login;Department;Title\nИванов;Иван;Иванович;i.ivanov;Бухгалтерия;Бухгалтер\nПетрова;Анна;Сергеевна;a.petrova;Отдел продаж;Менеджер\n',
  g:v=>`#Requires -Modules ActiveDirectory
# Создание пользователей AD из CSV · ne-for.ru
# CSV в UTF-8, разделитель «;», колонки: LastName;FirstName;MiddleName;Login;Department;Title

$Csv    = ${q1(v.csv)}
$OU     = ${q1(v.ou)}
$Upn    = ${q1(v.upn)}
$Groups = @(${v.groups.split(',').map(s=>s.trim()).filter(Boolean).map(q1).join(', ')})
$Out    = ${q1(v.out)}
$DryRun = $${v.dry}   # $true — только показать, что будет сделано

${v.pw==='random'?`function New-RandomPassword([int]$Length = 14) {
    $chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#%'
    -join (1..$Length | ForEach-Object { $chars[(Get-Random -Maximum $chars.Length)] })
}
`:`$TempPassword = ${q1(v.temp)}
`}
$created = foreach ($u in Import-Csv $Csv -Delimiter ';' -Encoding UTF8) {
    if (Get-ADUser -Filter "SamAccountName -eq '$($u.Login)'" -ErrorAction SilentlyContinue) {
        Write-Warning "$($u.Login) уже существует, пропускаю"
        continue
    }
    $pass = ${v.pw==='random'?'New-RandomPassword':'$TempPassword'}
    $params = @{
        Name                  = "$($u.LastName) $($u.FirstName)"
        GivenName             = $u.FirstName
        Surname               = $u.LastName
        DisplayName           = "$($u.LastName) $($u.FirstName) $($u.MiddleName)".Trim()
        SamAccountName        = $u.Login
        UserPrincipalName     = "$($u.Login)@$Upn"
        Department            = $u.Department
        Title                 = $u.Title
        Path                  = $OU
        AccountPassword       = (ConvertTo-SecureString $pass -AsPlainText -Force)
        Enabled               = $true
        ChangePasswordAtLogon = $true
    }
    New-ADUser @params -WhatIf:$DryRun
    if (-not $DryRun) {
        foreach ($g in $Groups) { Add-ADGroupMember -Identity $g -Members $u.Login }
    }
    [pscustomobject]@{ Login = $u.Login; Name = $params.DisplayName; Password = $pass }
}

if (-not $DryRun -and $created) {
    $created | Export-Csv $Out -NoTypeInformation -Encoding UTF8 -Delimiter ';'
    Write-Host "Создано: $(@($created).Count). Пароли в $Out — передай пользователям и удали файл." -ForegroundColor Green
} else {
    Write-Host 'Пробный запуск: проверь вывод и поставь $DryRun = $false' -ForegroundColor Yellow
}`},
 stale:{t:'Неактивные учётки',
  f:[['kind','Что ищем',['users','Пользователей'],['computers','Компьютеры']],['days','Не заходили дней',90],['base','Где искать (OU)','DC=corp,DC=local'],
     ['act','Действие',['report','Только отчёт'],['disable','Отключить'],['move','Отключить и перенести']],['target','OU для отключённых','OU=Disabled,DC=corp,DC=local'],
     ['report','Файл отчёта','C:\\Reports\\stale.csv'],['svc','Не трогать svc_*',true],['dry','Пробный запуск (-WhatIf)',true]],
  g:v=>{const U=v.kind==='users';return `#Requires -Modules ActiveDirectory
# Поиск неактивных ${U?'пользователей':'компьютеров'} · ne-for.ru

$Days       = ${+v.days||90}
$SearchBase = ${q1(v.base)}
$Report     = ${q1(v.report)}
${v.act==='move'?`$TargetOU   = ${q1(v.target)}\n`:''}$DryRun     = $${v.dry}
$since      = (Get-Date).AddDays(-$Days)

$stale = Search-ADAccount -AccountInactive -TimeSpan ([timespan]::FromDays($Days)) -${U?'UsersOnly':'ComputersOnly'} -SearchBase $SearchBase |
    Where-Object Enabled |
    Get-AD${U?'User':'Computer'} -Properties LastLogonDate, whenCreated, Description |
    Where-Object { $_.whenCreated -lt $since${U&&v.svc?" -and $_.SamAccountName -notlike 'svc_*'":''} }

$stale |
    Select-Object Name, SamAccountName, LastLogonDate, whenCreated, Description, DistinguishedName |
    Sort-Object LastLogonDate |
    Export-Csv $Report -NoTypeInformation -Encoding UTF8 -Delimiter ';'
Write-Host "Найдено: $(@($stale).Count). Отчёт: $Report" -ForegroundColor Cyan
${v.act==='report'?'':`
$stamp = Get-Date -Format 'yyyy-MM-dd'
foreach ($a in $stale) {
    Set-AD${U?'User':'Computer'} $a -Description "Отключён $stamp (неактивен $Days дн.) | $($a.Description)" -WhatIf:$DryRun
    Disable-ADAccount $a -WhatIf:$DryRun
${v.act==='move'?'    Move-ADObject $a.DistinguishedName -TargetPath $TargetOU -WhatIf:$DryRun\n':''}}
# Совет: не удаляй сразу. Отключить → подождать 30 дней → удалить.`}`}},
 clean:{t:'Очистка диска',
  f:[['days','Удалять файлы старше, дней',7],['utemp','Temp всех пользователей',true],['wtemp','C:\\Windows\\Temp',true],['wu','Кэш Windows Update',true],
     ['iis','Логи IIS',false],['custom','Своя папка (необязательно)',''],['bin','Очистить корзину',true],['pcs','Компьютеры (пусто = этот)',''],['dry','Пробный запуск (-WhatIf)',true]],
  g:v=>{const paths=[v.utemp&&"'C:\\Users\\*\\AppData\\Local\\Temp'",v.wtemp&&"'C:\\Windows\\Temp'",v.wu&&"'C:\\Windows\\SoftwareDistribution\\Download'",v.iis&&"'C:\\inetpub\\logs\\LogFiles'",v.custom&&q1(v.custom)].filter(Boolean);
   const pcs=v.pcs.split(/[,\s]+/).filter(Boolean);return `# Очистка диска · ne-for.ru
# Запускать от администратора${pcs.length?'. Для удалённых ПК нужен WinRM (Enable-PSRemoting).':''}

$Days   = ${+v.days||7}
$DryRun = $${v.dry}
${pcs.length?`$Computers = @(${pcs.map(q1).join(', ')})\n`:''}
$Cleanup = {
    param($Days, $DryRun)
    $limit  = (Get-Date).AddDays(-$Days)
    $before = (Get-PSDrive C).Free
    $Paths  = @(${paths.join(', ')})
${v.wu?"    if (-not $DryRun) { Stop-Service wuauserv -Force -ErrorAction SilentlyContinue }\n":''}    foreach ($p in $Paths) {
        if (-not (Test-Path $p)) { continue }
        $files = Get-ChildItem $p -Recurse -File -Force -ErrorAction SilentlyContinue |
                 Where-Object LastWriteTime -lt $limit
        $mb = ($files | Measure-Object Length -Sum).Sum / 1MB
        '{0} | {1,-45} {2,9:N1} МБ  ({3} файлов)' -f $env:COMPUTERNAME, $p, $mb, @($files).Count
        $files | Remove-Item -Force -ErrorAction SilentlyContinue -WhatIf:$DryRun
    }
${v.wu?"    if (-not $DryRun) { Start-Service wuauserv -ErrorAction SilentlyContinue }\n":''}${v.bin?"    if (-not $DryRun) { Clear-RecycleBin -DriveLetter C -Force -ErrorAction SilentlyContinue }\n":''}    $freed = ((Get-PSDrive C).Free - $before) / 1GB
    '{0} | освобождено {1:N2} ГБ' -f $env:COMPUTERNAME, $freed
}

${pcs.length?'Invoke-Command -ComputerName $Computers -ScriptBlock $Cleanup -ArgumentList $Days, $DryRun':'& $Cleanup $Days $DryRun'}`}},
 inv:{t:'Инвентаризация ПК',
  f:[['src','Откуда брать ПК',['ad','Из AD (OU)'],['list','Список вручную']],['base','OU с компьютерами','OU=Computers,DC=corp,DC=local'],['list','Список ПК (через запятую)','BUH-PC01, BUH-PC02'],
     ['hw','CPU, RAM, модель, серийник',true],['disk','Диск C',true],['net','IP и MAC',true],['user','Кто залогинен',true],['fmt','Формат отчёта',['csv','CSV для Excel'],['html','HTML-страница']],['out','Файл отчёта','C:\\Reports\\inventory']],
  g:v=>`# Инвентаризация компьютеров · ne-for.ru
# Нужны права администратора на ПК и открытый WinRM/WMI

${v.src==='ad'?`Import-Module ActiveDirectory
$Computers = Get-ADComputer -SearchBase ${q1(v.base)} -Filter 'Enabled -eq $true' |
    Select-Object -ExpandProperty Name`:`$Computers = @(${v.list.split(/[,\s]+/).filter(Boolean).map(q1).join(', ')})`}
$Out = ${q1(v.out+'.'+v.fmt)}

$Report = foreach ($c in $Computers) {
    if (-not (Test-Connection $c -Count 1 -Quiet)) {
        [pscustomobject]@{ Computer = $c; Status = 'Не в сети' }
        continue
    }
    try {
        $s    = New-CimSession -ComputerName $c -ErrorAction Stop
        $os   = Get-CimInstance Win32_OperatingSystem -CimSession $s
${v.hw||v.user?`        $cs   = Get-CimInstance Win32_ComputerSystem -CimSession $s\n`:''}${v.hw?`        $cpu  = Get-CimInstance Win32_Processor -CimSession $s | Select-Object -First 1
        $bios = Get-CimInstance Win32_BIOS -CimSession $s\n`:''}${v.disk?`        $d    = Get-CimInstance Win32_LogicalDisk -CimSession $s -Filter "DeviceID='C:'"\n`:''}${v.net?`        $nic  = Get-CimInstance Win32_NetworkAdapterConfiguration -CimSession $s -Filter 'IPEnabled=True' | Select-Object -First 1\n`:''}        [pscustomobject]@{
            Computer  = $c
            Status    = 'OK'
            OS        = $os.Caption
            Build     = $os.BuildNumber
            LastBoot  = $os.LastBootUpTime
${v.hw?`            Model     = "$($cs.Manufacturer) $($cs.Model)"
            Serial    = $bios.SerialNumber
            CPU       = $cpu.Name.Trim()
            RAM_GB    = [math]::Round($cs.TotalPhysicalMemory / 1GB, 1)\n`:''}${v.disk?`            C_Size_GB = [math]::Round($d.Size / 1GB)
            C_Free_GB = [math]::Round($d.FreeSpace / 1GB, 1)\n`:''}${v.net?`            IP        = ($nic.IPAddress | Where-Object { $_ -like '*.*' }) -join ', '
            MAC       = $nic.MACAddress\n`:''}${v.user?`            User      = $cs.UserName\n`:''}        }
        Remove-CimSession $s
    } catch {
        [pscustomobject]@{ Computer = $c; Status = "Ошибка: $($_.Exception.Message)" }
    }
}

${v.fmt==='csv'?`$Report | Export-Csv $Out -NoTypeInformation -Encoding UTF8 -Delimiter ';'`:`$css = '<style>body{font-family:Segoe UI,sans-serif}table{border-collapse:collapse}td,th{border:1px solid #ccc;padding:4px 8px;font-size:13px}th{background:#eee}</style>'
$Report | ConvertTo-Html -Head $css -Title 'Инвентаризация' -PreContent "<h2>Инвентаризация ПК, $(Get-Date -Format 'dd.MM.yyyy')</h2>" |
    Out-File $Out -Encoding UTF8`}
Write-Host "Готово: $(@($Report).Count) ПК → $Out" -ForegroundColor Green`},
 certs:{t:'Истекающие сертификаты',
  f:[['days','Истекают в ближайшие, дней',30],['pcs','Серверы (пусто = этот)','srv-dc01, srv-app01, srv-mail01'],['report','Файл отчёта','C:\\Reports\\certs.csv']],
  g:v=>{const pcs=v.pcs.split(/[,\s]+/).filter(Boolean);return `# Сертификаты, которые скоро истекут · ne-for.ru

$Days   = ${+v.days||30}
$Report = ${q1(v.report)}
${pcs.length?`$Computers = @(${pcs.map(q1).join(', ')})\n`:''}
$Check = {
    param($Days)
    Get-ChildItem Cert:\\LocalMachine\\My |
        Where-Object { $_.NotAfter -lt (Get-Date).AddDays($Days) } |
        Select-Object @{ n = 'Computer'; e = { $env:COMPUTERNAME } },
                      @{ n = 'DaysLeft'; e = { [int]($_.NotAfter - (Get-Date)).TotalDays } },
                      Subject, NotAfter, Thumbprint
}

$certs = ${pcs.length?'Invoke-Command -ComputerName $Computers -ScriptBlock $Check -ArgumentList $Days':'& $Check $Days'}
$certs | Sort-Object DaysLeft | Format-Table Computer, DaysLeft, NotAfter, Subject -AutoSize
$certs | Select-Object Computer, DaysLeft, NotAfter, Subject, Thumbprint |
    Export-Csv $Report -NoTypeInformation -Encoding UTF8 -Delimiter ';'
# Отрицательный DaysLeft — сертификат уже истёк`}},
};
let psK='users';const psV={};
Object.entries(PS).forEach(([k,t])=>{psV[k]={};t.f.forEach(f=>psV[k][f[0]]=Array.isArray(f[2])?f[2][0]:f[2])});
function psHL(code){return code.split('\n').map(l=>{const e=h(l);if(/^\s*#/.test(l))return `<span class="cm">${e}</span>`;
  return e.replace(/(\$[A-Za-z_][\w]*)/g,'<span class="pa">$1</span>').replace(/\b(foreach|if|else|continue|param|function|try|catch|in)\b/g,'<span class="kw">$1</span>')}).join('\n')}
function psRender(){const T=PS[psK],v=psV[psK],el=$('#g-ps');
  el.innerHTML=`<div class="chips">${Object.entries(PS).map(([k,t])=>`<button class="chip${k===psK?' on':''}" data-ps="${k}">${h(t.t)}</button>`).join('')}</div>
  <div class="mtgen" style="margin-top:14px"><form class="card mtform" id="ps-form" autocomplete="off"><fieldset><legend>${h(T.t)}</legend>
   ${T.f.map(f=>{const id='ps-'+f[0],val=v[f[0]];
     if(typeof f[2]==='boolean')return `<label class="tgl"><input type="checkbox" id="${id}" data-f="${f[0]}"${val?' checked':''}> ${h(f[1])}</label>`;
     if(Array.isArray(f[2]))return `<label class="fld w2">${h(f[1])}<select id="${id}" data-f="${f[0]}">${f.slice(2).map(o=>`<option value="${o[0]}"${o[0]===val?' selected':''}>${h(o[1])}</option>`).join('')}</select></label>`;
     return `<label class="fld w2">${h(f[1])}<input type="text" id="${id}" data-f="${f[0]}" value="${h(val)}"></label>`}).join('')}
   </fieldset>${T.sample?'<button type="button" class="btn ghost" id="ps-sample" style="justify-self:start">Скачать пример CSV</button>':''}</form>
   <div class="mtout card"><div class="game-top" style="margin-bottom:10px"><b>${psK}.ps1</b><div class="row" style="flex:0 0 auto"><button class="btn ghost" id="ps-copy" style="flex:0 0 auto">Скопировать</button><button class="btn" id="ps-dl" style="flex:0 0 auto">Скачать .ps1</button></div></div>
   <pre class="code" id="ps-code"></pre><p class="muted" style="font-size:12px;margin-top:8px">Файл сохраняется в UTF-8 с BOM, чтобы кириллица не ломалась в Windows PowerShell 5.1. Сначала запускай с пробным режимом.</p></div></div>`;
  const upd=()=>{const code=T.g(v);$('#ps-code').innerHTML=psHL(code);psRender.code=code};
  el.querySelectorAll('[data-ps]').forEach(b=>b.onclick=()=>{psK=b.dataset.ps;psRender()});
  el.querySelectorAll('[data-f]').forEach(i=>i.oninput=i.onchange=()=>{v[i.dataset.f]=i.type==='checkbox'?i.checked:i.value;upd()});
  $('#ps-copy').onclick=()=>{copy(psRender.code);ach('ps')};
  $('#ps-dl').onclick=()=>{dl(psK+'.ps1','\ufeff'+psRender.code.replace(/\n/g,'\r\n'));ach('ps')};
  const sm=$('#ps-sample');if(sm)sm.onclick=()=>dl('users.csv','\ufeff'+T.sample.replace(/\n/g,'\r\n'),'text/csv');
  upd()}
psRender();

/* ================= ИНСТРУКЦИИ ДЛЯ ПОЛЬЗОВАТЕЛЕЙ ================= */
const GD={
 vpn:{t:'Подключение к VPN',f:[['server','Адрес сервера','vpn.example.ru'],['type','Тип',['sstp','SSTP'],['l2tp','L2TP/IPsec'],['ikev2','IKEv2']],['psk','Общий ключ (для L2TP)',''],['login','Логин','как для входа в компьютер']],
  b:v=>({intro:'Инструкция для Windows 10 и 11. Займёт 3 минуты.',steps:[
   ['Откройте настройки VPN','Пуск → «Параметры» → «Сеть и Интернет» → «VPN» → «Добавить VPN».'],
   ['Заполните подключение',`Поставщик: «Windows (встроенные)». Имя подключения: «${v.company} VPN». Имя или адрес сервера:`,v.server],
   ['Выберите тип VPN',v.type==='sstp'?'Тип VPN: «SSTP».':v.type==='l2tp'?`Тип VPN: «L2TP/IPsec с общим ключом». Общий ключ: ${v.psk||'уточните в поддержке'}.`:'Тип VPN: «IKEv2».'],
   ['Логин и пароль',`Тип данных для входа: «Имя пользователя и пароль». Логин: ${v.login}. Нажмите «Сохранить».`],
   ['Подключитесь','Нажмите на созданное подключение → «Подключиться». Когда появится статус «Подключено», можно работать.']],
   note:'Не подключается из гостиницы или кафе? Раздайте интернет с телефона и попробуйте снова: публичный Wi-Fi часто блокирует VPN.'})},
 pass:{t:'Как сменить пароль',f:[['min','Минимальная длина',10],['days','Срок действия пароля, дней',90]],
  b:v=>({intro:`Пароль нужно менять раз в ${v.days} дней. Windows предупредит заранее.`,steps:[
   ['Откройте меню смены пароля','Нажмите Ctrl + Alt + Delete и выберите «Изменить пароль».'],
   ['Введите пароли','Сначала старый пароль, затем новый два раза. Нажмите Enter.'],
   ['Требования к паролю',`Не короче ${v.min} символов, заглавные и строчные буквы, цифры. Нельзя повторять последние пароли и использовать своё имя.`],
   ['Если вы работаете из дома','Сначала подключите VPN, и только потом меняйте пароль. Иначе компьютер запомнит старый пароль и перестанет пускать в сеть.']],
   note:'Никому не сообщайте пароль, даже сотрудникам IT. Нам он не нужен: если что, мы сбросим его сами.'})},
 anydesk:{t:'Как прислать ID AnyDesk',f:[['url','Где скачать AnyDesk','https://anydesk.com/ru']],
  b:v=>({intro:'AnyDesk позволяет сотруднику IT подключиться к вашему экрану и помочь.',steps:[
   ['Скачайте программу','Установка не нужна, достаточно запустить скачанный файл:',v.url],
   ['Найдите свой номер','В левой части окна, в блоке «Это рабочее место», есть номер из 9–10 цифр.'],
   ['Отправьте номер в поддержку',`Напишите номер в заявке или сообщите: ${v.support}.`],
   ['Подтвердите подключение','Когда появится окно с запросом, убедитесь, что подключается сотрудник IT, с которым вы договорились, и нажмите «Принять».']],
   note:'Никогда не сообщайте номер AnyDesk тем, кто позвонил сам и представился банком, Microsoft или «службой безопасности». Это мошенники.'})},
 wifi:{t:'Гостевой Wi-Fi',f:[['ssid','Имя сети','Office-Guest'],['pw','Пароль','guest2026'],['sec','Шифрование',['WPA','WPA2/WPA3'],['nopass','Без пароля']]],
  b:v=>({intro:'Интернет для гостей и личных телефонов.',qr:`WIFI:T:${v.sec};S:${v.ssid.replace(/([\\;,:"])/g,'\\$1')};${v.sec!=='nopass'?'P:'+v.pw.replace(/([\\;,:"])/g,'\\$1')+';':''};`,steps:[
   ['Наведите камеру телефона на QR-код','Телефон предложит подключиться к сети. Нажмите «Подключиться».'],
   ['Или подключитесь вручную',`Сеть: ${v.ssid}${v.sec!=='nopass'?`, пароль: ${v.pw}`:', без пароля'}.`]],
   note:'Гостевая сеть изолирована от рабочей: принтеры и общие папки из неё не видны.'})},
 printer:{t:'Подключение сетевого принтера',f:[['path','Путь к принтеру','\\\\srv-print01\\HP-2floor']],
  b:v=>({intro:'Принтер ставится сам, драйвер скачается с сервера.',steps:[
   ['Откройте окно «Выполнить»','Нажмите Win + R.'],
   ['Введите путь к принтеру','Скопируйте в поле строку ниже и нажмите Enter:',v.path],
   ['Дождитесь установки','Откроется окно очереди печати. Это значит, что принтер установлен. Окно можно закрыть.'],
   ['Сделайте принтером по умолчанию','«Параметры» → «Bluetooth и устройства» → «Принтеры и сканеры» → выберите принтер → «Использовать по умолчанию».']],
   note:'Если принтер печатает иероглифы или не печатает вообще, напишите в поддержку, не отправляйте документ повторно.'})},
};
let gdK='vpn';const gdV={common:{company:'ООО «Ромашка»',support:'IT, доб. 305, it@example.ru'}};
Object.entries(GD).forEach(([k,t])=>{gdV[k]={};t.f.forEach(f=>gdV[k][f[0]]=Array.isArray(f[2])?f[2][0]:f[2])});
function qrImg(text,dark='#000'){if(typeof qrcode==='undefined')return'';const q=qrcode(0,'M');q.addData(text);q.make();const n=q.getModuleCount(),c=document.createElement('canvas'),s=6,p=4*s;c.width=c.height=n*s+p*2;const x=c.getContext('2d');x.fillStyle='#fff';x.fillRect(0,0,c.width,c.height);x.fillStyle=dark;for(let r=0;r<n;r++)for(let k=0;k<n;k++)if(q.isDark(r,k))x.fillRect(p+k*s,p+r*s,s,s);return c.toDataURL('image/png')}
function guideHTML(k,v){const g=GD[k].b(v);
  return `<article class="guide"><div class="guide-co">${h(v.company)}</div><h2>${h(GD[k].t)}</h2><p class="guide-intro">${h(g.intro)}</p>
   ${g.qr?`<img class="guide-qr" src="${qrImg(g.qr)}" alt="QR-код для подключения к Wi-Fi">`:''}
   <ol>${g.steps.map(s=>`<li><b>${h(s[0])}</b><p>${h(s[1])}</p>${s[2]?`<code>${h(s[2])}</code>`:''}</li>`).join('')}</ol>
   <div class="guide-note">${h(g.note)}</div><div class="guide-foot">Нужна помощь: ${h(v.support)}</div></article>`}
const b64e=s=>btoa(unescape(encodeURIComponent(s))).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
const b64d=s=>decodeURIComponent(escape(atob(s.replace(/-/g,'+').replace(/_/g,'/'))));
function gdRender(){const el=$('#g-guide'),T=GD[gdK],v={...gdV.common,...gdV[gdK]};
  el.innerHTML=`<div class="chips">${Object.entries(GD).map(([k,t])=>`<button class="chip${k===gdK?' on':''}" data-gd="${k}">${h(t.t)}</button>`).join('')}</div>
  <div class="mtgen" style="margin-top:14px"><form class="card mtform" autocomplete="off"><fieldset><legend>Общее</legend>
    <label class="fld w2">Компания<input type="text" id="gd-company" data-c="company" value="${h(gdV.common.company)}"></label>
    <label class="fld w2">Контакты поддержки<input type="text" id="gd-support" data-c="support" value="${h(gdV.common.support)}"></label></fieldset>
   <fieldset><legend>${h(T.t)}</legend>${T.f.map(f=>Array.isArray(f[2])?`<label class="fld w2">${h(f[1])}<select id="gd-${f[0]}" data-f="${f[0]}">${f.slice(2).map(o=>`<option value="${o[0]}"${o[0]===gdV[gdK][f[0]]?' selected':''}>${h(o[1])}</option>`).join('')}</select></label>`
     :`<label class="fld w2">${h(f[1])}<input type="text" id="gd-${f[0]}" data-f="${f[0]}" value="${h(gdV[gdK][f[0]])}"></label>`).join('')}</fieldset>
   <div class="row"><button type="button" class="btn" id="gd-link" style="flex:0 0 auto">Скопировать ссылку</button><button type="button" class="btn ghost" id="gd-html" style="flex:0 0 auto">Скачать HTML</button><button type="button" class="btn ghost" id="gd-txt" style="flex:0 0 auto">Текстом</button></div>
   <p class="muted" style="font-size:12px">Ссылку можно вставить прямо в ответ на заявку: инструкция откроется на ne-for.ru уже заполненной.</p></form>
   <div class="guide-wrap" id="gd-prev">${guideHTML(gdK,v)}</div></div>`;
  el.querySelectorAll('[data-gd]').forEach(b=>b.onclick=()=>{gdK=b.dataset.gd;gdRender()});
  el.querySelectorAll('[data-c]').forEach(i=>i.oninput=()=>{gdV.common[i.dataset.c]=i.value;$('#gd-prev').innerHTML=guideHTML(gdK,{...gdV.common,...gdV[gdK]})});
  el.querySelectorAll('[data-f]').forEach(i=>i.oninput=i.onchange=()=>{gdV[gdK][i.dataset.f]=i.value;$('#gd-prev').innerHTML=guideHTML(gdK,{...gdV.common,...gdV[gdK]})});
  const cur=()=>({...gdV.common,...gdV[gdK]});
  $('#gd-link').onclick=()=>{copy(location.origin+location.pathname+'#guide='+gdK+'.'+b64e(JSON.stringify(cur())));ach('guide')};
  $('#gd-html').onclick=()=>{const doc=`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${h(GD[gdK].t)}</title><style>${GUIDE_CSS}</style></head><body>${guideHTML(gdK,cur())}</body></html>`;dl(gdK+'.html',doc,'text/html');ach('guide')};
  $('#gd-txt').onclick=()=>{const g=GD[gdK].b(cur());copy(`${GD[gdK].t}\n\n${g.intro}\n\n${g.steps.map((s,i)=>`${i+1}. ${s[0]}. ${s[1]}${s[2]?' '+s[2]:''}`).join('\n')}\n\n${g.note}\nНужна помощь: ${cur().support}`)}}
const GUIDE_CSS='body{margin:0;padding:24px 16px;background:#f3f5f4;font-family:system-ui,Segoe UI,Roboto,sans-serif;color:#17211b}.guide{max-width:640px;margin:0 auto;background:#fff;border:1px solid #d7ded9;border-radius:14px;padding:28px}.guide-co{font-size:13px;color:#5b6a61;text-transform:uppercase;letter-spacing:.06em}.guide h2{font-size:26px;margin:6px 0 8px}.guide-intro{color:#44534a}.guide ol{padding-left:22px}.guide li{margin:14px 0}.guide li p{margin:4px 0}.guide code{display:inline-block;background:#eef2ef;border:1px solid #d7ded9;border-radius:6px;padding:3px 8px;font-family:Consolas,monospace}.guide-note{margin-top:18px;padding:12px 14px;border-left:3px solid #c77700;background:#fff7e8;border-radius:6px}.guide-foot{margin-top:18px;font-size:13px;color:#5b6a61}.guide-qr{width:180px;height:180px;display:block;margin:10px 0;image-rendering:pixelated}';
gdRender();
function guideRoute(){const m=location.hash.match(/^#guide=(\w+)\.([\w-]+)$/);if(!m||!GD[m[1]])return;
  try{const v=JSON.parse(b64d(m[2]));$('#reader').hidden=false;document.body.style.overflow='hidden';$('#rbody').innerHTML=`<div class="guide-wrap">${guideHTML(m[1],{...gdV.common,...gdV[m[1]],...v})}</div>`}catch(e){}}
addEventListener('hashchange',guideRoute);guideRoute();

/* ================= ИБП и PoE ================= */
const UPS_PRE=[['Сервер 1U',250],['Сервер 2U',400],['NAS на 4 диска',60],['Свитч 24 порта',30],['PoE-свитч (с нагрузкой)',120],['Роутер',15],['ПК офисный',120],['Монитор',25],['Видеорегистратор',40]];
const POE_PRE=[['IP-камера',6.5,'af'],['Камера с ИК и подогревом',12,'af'],['PTZ-камера',25,'at'],['Точка доступа Wi-Fi 6',13,'af'],['Точка доступа Wi-Fi 6E / 7',22,'at'],['IP-телефон',4,'af'],['Своё устройство',10,'af']];
const U={rows:[[0,2],[2,1],[3,2],[5,1]],va:1500,pf:.9,v:12,n:4,ah:9};
const PO={budget:120,ports:8,std:'at',rows:[[0,4],[3,2],[5,2]]};
function peukert(W,V,Ah){if(W<=0)return Infinity;const I=W/(V*.85);return 20*Math.pow(Ah/(I*20),1.15)*.8}
function upsRender(){const el=$('#p-power');
  const load=U.rows.reduce((a,r)=>a+UPS_PRE[r[0]][1]*r[1],0),cap=U.va*U.pf,pct=load/cap*100,V=U.v*U.n,hrs=peukert(load,V,U.ah),min=hrs*60;
  const rec=Math.ceil(load/0.9/0.7/250)*250;
  const pts=[];for(let w=50;w<=cap;w+=cap/40)pts.push([w,Math.min(240,peukert(w,V,U.ah)*60)]);
  const W=460,H=170,px=w=>40+(w/cap)*(W-56),mx=Math.max(10,...pts.map(p=>p[1])),py=m=>H-24-(m/mx)*(H-40);
  const ticks=[0,.25,.5,.75,1].map(f=>Math.round(mx*f));
  const svg=`<svg viewBox="0 0 ${W} ${H}" class="chart" role="img" aria-label="Время работы от нагрузки">
    ${ticks.map(t=>`<line x1="40" x2="${W-16}" y1="${py(t)}" y2="${py(t)}" class="grid"/><text x="34" y="${py(t)+4}" class="ax" text-anchor="end">${t}</text>`).join('')}
    <path d="${pts.map((p,i)=>(i?'L':'M')+px(p[0]).toFixed(1)+' '+py(p[1]).toFixed(1)).join('')}" class="ln"/>
    ${load>0&&load<=cap?`<line x1="${px(load)}" x2="${px(load)}" y1="${py(mx)}" y2="${H-24}" class="mk"/><circle cx="${px(load)}" cy="${py(Math.min(mx,min))}" r="5" class="pt"/>`:''}
    <text x="40" y="${H-6}" class="ax">0 Вт</text><text x="${W-16}" y="${H-6}" class="ax" text-anchor="end">${Math.round(cap)} Вт</text><text x="${W/2}" y="${H-6}" class="ax" text-anchor="middle">нагрузка</text>
    <text x="40" y="10" class="ax">минуты</text></svg>`;
  const pRows=PO.rows.map(r=>({p:POE_PRE[r[0]],n:r[1]})),poeW=pRows.reduce((a,r)=>a+r.p[1]*r.n,0)*1.1,poeN=pRows.reduce((a,r)=>a+r.n,0),poePct=poeW/PO.budget*100;
  const stdBad=pRows.filter(r=>r.n&&(r.p[2]==='at'&&PO.std==='af'));
  const row=(list,pre,i,kind)=>`<div class="pw-row"><select data-${kind}="${i}" data-x="0" aria-label="устройство">${pre.map((p,j)=>`<option value="${j}"${j===list[i][0]?' selected':''}>${h(p[0])} · ${p[1]} Вт</option>`).join('')}</select>
    <input type="number" min="0" max="99" value="${list[i][1]}" data-${kind}="${i}" data-x="1" aria-label="количество"><button data-${kind}rm="${i}" aria-label="удалить">✕</button></div>`;
  el.innerHTML=`<div class="two">
   <div><h4 class="sub">ИБП: время автономии</h4>${U.rows.map((r,i)=>row(U.rows,UPS_PRE,i,'u')).join('')}<button class="chip" id="u-add">+ устройство</button>
    <div class="sub2" style="margin-top:12px"><label class="fld">Мощность ИБП, ВА<input type="number" id="u-va" value="${U.va}"></label><label class="fld">Коэффициент мощности<select id="u-pf">${[.6,.7,.8,.9,1].map(v=>`<option${v===U.pf?' selected':''}>${v}</option>`).join('')}</select></label>
    <label class="fld">Батарей, шт × 12 В<input type="number" id="u-n" value="${U.n}" min="1"></label><label class="fld">Ёмкость батареи, А·ч<input type="number" id="u-ah" value="${U.ah}" min="1"></label></div>
    <dl class="kv"><dt>Нагрузка</dt><dd>${load} Вт из ${Math.round(cap)} Вт <b style="color:var(--${pct>100?'bad':pct>80?'warn':'acc'})">(${pct.toFixed(0)}%)</b></dd>
     <dt>Время работы</dt><dd>${pct>100?'<span style="color:var(--bad)">ИБП перегружен</span>':'≈ '+(min>240?'больше 4 ч':Math.round(min)+' мин')}</dd><dt>Рекомендуемый ИБП</dt><dd>от ${rec} ВА (запас 30%)</dd></dl>
    ${svg}<p class="muted" style="font-size:12px">Оценка по формуле Пекерта с поправкой на КПД и старение батарей. Точное время смотри в паспорте ИБП.</p></div>
   <div><h4 class="sub">PoE: хватит ли свитча</h4>${PO.rows.map((r,i)=>row(PO.rows,POE_PRE,i,'p')).join('')}<button class="chip" id="p-add">+ устройство</button>
    <div class="sub2" style="margin-top:12px"><label class="fld">Бюджет PoE свитча, Вт<input type="number" id="p-b" value="${PO.budget}"></label><label class="fld">PoE-портов<input type="number" id="p-ports" value="${PO.ports}"></label>
    <label class="fld">Стандарт портов<select id="p-std">${[['af','802.3af (до 15,4 Вт)'],['at','802.3at (до 30 Вт)'],['bt','802.3bt (до 60–90 Вт)']].map(o=>`<option value="${o[0]}"${o[0]===PO.std?' selected':''}>${o[1]}</option>`).join('')}</select></label></div>
    <dl class="kv"><dt>Потребление</dt><dd>${poeW.toFixed(1)} Вт с запасом 10% на кабель</dd><dt>Бюджет</dt><dd>${PO.budget} Вт</dd><dt>Портов</dt><dd>${poeN} из ${PO.ports}</dd></dl>
    <div class="meter" style="margin:10px 0"><i style="width:${Math.min(100,poePct)}%;background:var(--${poePct>100?'bad':poePct>80?'warn':'acc'})"></i></div>
    ${poePct>100?'<div class="warnbox">Бюджета PoE не хватит: часть устройств не включится или будет перезагружаться.</div>':poePct>80?'<div class="warnbox">Впритык: больше 80% бюджета. Зимой камеры с подогревом едят больше.</div>':''}
    ${poeN>PO.ports?'<div class="warnbox">PoE-портов меньше, чем устройств.</div>':''}
    ${stdBad.length?`<div class="warnbox">${stdBad.map(r=>h(r.p[0])).join(', ')}: нужен 802.3at, а порты только 802.3af.</div>`:''}
    ${poePct<=80&&poeN<=PO.ports&&!stdBad.length?'<div class="dk-res ok"><b>Свитч справится</b></div>':''}</div></div>`;
  const bind=(list,kind,pre)=>{el.querySelectorAll(`[data-${kind}]`).forEach(i=>i.onchange=()=>{list[+i.getAttribute('data-'+kind)][+i.dataset.x]=Math.max(0,+i.value||0);upsRender()});
    el.querySelectorAll(`[data-${kind}rm]`).forEach(b=>b.onclick=()=>{list.splice(+b.getAttribute(`data-${kind}rm`),1);upsRender()})};
  bind(U.rows,'u');bind(PO.rows,'p');
  $('#u-add').onclick=()=>{U.rows.push([6,1]);upsRender()};$('#p-add').onclick=()=>{PO.rows.push([0,1]);upsRender()};
  [['u-va','va'],['u-n','n'],['u-ah','ah']].forEach(([id,k])=>$('#'+id).onchange=e=>{U[k]=Math.max(1,+e.target.value||1);upsRender()});
  $('#u-pf').onchange=e=>{U.pf=+e.target.value;upsRender()};
  $('#p-b').onchange=e=>{PO.budget=Math.max(1,+e.target.value||1);upsRender()};$('#p-ports').onchange=e=>{PO.ports=Math.max(1,+e.target.value||1);upsRender()};$('#p-std').onchange=e=>{PO.std=e.target.value;upsRender()};
}
upsRender();

/* ================= ПРОВЕРКА САЙТА ================= */
async function doh(name,type){for(const u of[`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`,`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`]){
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),6000);const r=await fetch(u,{headers:{accept:'application/dns-json'},signal:c.signal});clearTimeout(t);if(r.ok)return await r.json()}catch(e){}}return null}
const txt=j=>(j?.Answer||[]).map(a=>String(a.data).replace(/^"|"$/g,'').replace(/" "/g,''));
async function siteCheck(){let d=$('#sc-dom').value.trim().toLowerCase().replace(/^https?:\/\//,'').replace(/\/.*$/,'');if(!d)return;const box=$('#sc-res');
  box.innerHTML='<p class="muted">Проверяю DNS, почту, HTTPS и сертификат…</p>';
  const [A,AAAA,NS,MX,TX,DM,CAA,WWW]=await Promise.all([doh(d,'A'),doh(d,'AAAA'),doh(d,'NS'),doh(d,'MX'),doh(d,'TXT'),doh('_dmarc.'+d,'TXT'),doh(d,'CAA'),doh('www.'+d,'A')]);
  if(!A){box.innerHTML='<div class="warnbox">DNS-over-HTTPS недоступен из этого браузера. Проверка работает на ne-for.ru.</div>';return}
  const R=[],add=(lvl,t,d2)=>R.push([lvl,t,d2]);
  const a=(A.Answer||[]).filter(x=>x.type===1).map(x=>x.data);
  if(A.Status===3){box.innerHTML='<div class="warnbox">Домен не существует (NXDOMAIN).</div>';return}
  add(a.length?'ok':'bad','A-записи',a.join(', ')||'нет');
  const a6=(AAAA?.Answer||[]).filter(x=>x.type===28).map(x=>x.data);add(a6.length?'ok':'warn','IPv6 (AAAA)',a6.join(', ')||'нет, сайт доступен только по IPv4');
  add((WWW?.Answer||[]).length?'ok':'warn','www-поддомен',(WWW?.Answer||[]).map(x=>x.data).join(', ')||'не настроен: www.'+d+' не откроется');
  add('ok','NS-серверы',(NS?.Answer||[]).map(x=>x.data).join(', ')||'—');
  add(A.AD?'ok':'warn','DNSSEC',A.AD?'подписан и проверен':'не включён');
  const mx=(MX?.Answer||[]).map(x=>x.data);add(mx.length?'ok':'warn','Почта (MX)',mx.join(', ')||'MX нет: почта на домене не принимается');
  const spf=txt(TX).find(t=>t.startsWith('v=spf1'));
  add(!spf?(mx.length?'bad':'warn'):/[-]all$/.test(spf)?'ok':/~all$/.test(spf)?'ok':'warn','SPF',spf?spf+(/\+all|\?all/.test(spf)?' (слишком мягкий: +all/?all разрешает всем)':/~all/.test(spf)?' (мягкий режим ~all, это нормально)':''):'нет записи: письма с домена легко подделать');
  const dm=txt(DM).find(t=>t.startsWith('v=DMARC1'));const pol=dm?.match(/p=(\w+)/)?.[1];
  add(!dm?(mx.length?'bad':'warn'):pol==='none'?'warn':'ok','DMARC',dm?`политика p=${pol}${pol==='none'?' (только мониторинг)':''}`:'нет записи');
  add((CAA?.Answer||[]).length?'ok':'warn','CAA',(CAA?.Answer||[]).map(x=>x.data).join(', ')||'не задано: сертификат может выпустить любой УЦ');
  const t0=performance.now();let https=false;try{const c=new AbortController(),t=setTimeout(()=>c.abort(),8000);await fetch('https://'+d+'/',{mode:'no-cors',cache:'no-store',signal:c.signal});clearTimeout(t);https=true}catch(e){}
  add(https?'ok':'bad','HTTPS',https?`отвечает за ${Math.round(performance.now()-t0)} мс`:'не отвечает по HTTPS или сертификат недействителен');
  try{const c=new AbortController(),t=setTimeout(()=>c.abort(),12000);const r=await fetch(`https://crt.sh/?q=${encodeURIComponent(d)}&output=json&exclude=expired`,{signal:c.signal});clearTimeout(t);const L=await r.json();
    const now=Date.now(),cur=L.filter(x=>new Date(x.not_before+'Z')<=now&&(x.name_value||'').split('\n').some(n=>n===d||n==='*.'+d.split('.').slice(1).join('.'))).sort((x,y)=>new Date(y.not_before)-new Date(x.not_before))[0];
    if(cur){const left=Math.floor((new Date(cur.not_after+'Z')-now)/864e5);add(left>30?'ok':left>=0?'warn':'bad','Сертификат',`истекает ${new Date(cur.not_after+'Z').toLocaleDateString('ru')} (через ${left} дн.), выдал ${(cur.issuer_name.match(/O=([^,]+)/)||[])[1]||cur.issuer_name}`)}
    else add('warn','Сертификат','в журналах Certificate Transparency не найден')}
  catch(e){add('warn','Сертификат','crt.sh не ответил, попробуй позже')}
  const score=R.filter(r=>r[0]==='ok').length;
  box.innerHTML=`<div class="sc-sum"><b>${score}</b> из ${R.length} проверок в порядке</div><ul class="checks">${R.map(r=>`<li class="${r[0]}">${r[0]==='ok'?'✓':r[0]==='warn'?'!':'✗'} <b>${h(r[1])}</b><small>${h(r[2])}</small></li>`).join('')}</ul>
   <p class="muted" style="font-size:12px">Заголовки безопасности (HSTS, CSP) браузер прочитать не даёт: для них нужен серверный сканер.</p>`;ach('sitecheck')}
$('#sc-go').onclick=siteCheck;$('#sc-dom').onkeydown=e=>{if(e.key==='Enter')siteCheck()};

if(typeof CMDS!=='undefined'){CMDS.ps=()=>{document.querySelector('#gtabs .tab[data-g="ps"]').click();location.hash='mtconf';return 'Генератор PowerShell →'}}
})();
