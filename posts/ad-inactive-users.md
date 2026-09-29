# PowerShell: найти и выключить мёртвые учётки в AD

Уволившиеся, «временные» подрядчики, тестовые `user1` — всё это висит включённым годами и ждёт, пока кто-нибудь подберёт пароль.

## Найти

```powershell
Import-Module ActiveDirectory

$days = 90
$stale = Search-ADAccount -AccountInactive -TimeSpan "$days.00:00:00" -UsersOnly |
    Where-Object Enabled |
    Get-ADUser -Properties LastLogonDate, Description, Department |
    Select-Object Name, SamAccountName, LastLogonDate, Department, Description, DistinguishedName

$stale | Sort-Object LastLogonDate | Format-Table -AutoSize
```

> `LastLogonDate` основан на атрибуте `lastLogonTimestamp`, который реплицируется с задержкой до ~14 дней. Для порога в 90 дней это не важно, для «кто заходил вчера» — используй `lastLogon` с каждого DC.

## Отчёт

```powershell
$stale | Export-Csv "C:\Reports\stale-users-$(Get-Date -f yyyy-MM-dd).csv" `
    -NoTypeInformation -Encoding UTF8 -Delimiter ';'
```

Точка с запятой — чтобы русский Excel открыл по колонкам без танцев.

## Отключить и убрать с глаз

Сначала **всегда** прогоняй с `-WhatIf`:

```powershell
$targetOU = "OU=Disabled Users,DC=corp,DC=local"
$stamp = Get-Date -f yyyy-MM-dd

foreach ($u in $stale) {
    Set-ADUser $u.SamAccountName -Description "Отключён $stamp (неактивен $days дн.) | $($u.Description)" -WhatIf
    Disable-ADAccount $u.SamAccountName -WhatIf
    Move-ADObject $u.DistinguishedName -TargetPath $targetOU -WhatIf
}
```

Убедился, что список правильный — убери `-WhatIf`.

## Исключения

Сервисные учётки тоже часто «не логинятся». Отфильтруй их заранее, например по OU или префиксу:

```powershell
| Where-Object { $_.DistinguishedName -notlike "*OU=Service Accounts*" -and $_.SamAccountName -notlike "svc_*" }
```

## Не удалять сразу

Схема, которая ни разу не подвела: **отключить → подождать 30 дней → удалить**. За месяц обязательно найдётся «а где учётка Иванова, у него там почта нужна была».
