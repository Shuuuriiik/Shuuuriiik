# VLAN на MikroTik: bridge VLAN filtering в RouterOS 7

Задача: на одном роутере три сети. Офис (VLAN 10), бухгалтерия (VLAN 20), гости (VLAN 99). Порты `ether2–ether3` — офис, `ether4` — бухгалтерия, `ether5` — транк на управляемый свитч, где едут все три VLAN тегированными.

> Настраивай через MAC-Winbox или консольный порт. Включение `vlan-filtering` — последний шаг, и если ошибиться, можно потерять доступ к роутеру.

## 1. Бридж и порты

```
/interface bridge add name=bridge vlan-filtering=no

# access-порты: нетегированный трафик попадает в свою VLAN
/interface bridge port add bridge=bridge interface=ether2 pvid=10 frame-types=admit-only-untagged-and-priority-tagged
/interface bridge port add bridge=bridge interface=ether3 pvid=10 frame-types=admit-only-untagged-and-priority-tagged
/interface bridge port add bridge=bridge interface=ether4 pvid=20 frame-types=admit-only-untagged-and-priority-tagged

# транк на свитч: только тегированные кадры
/interface bridge port add bridge=bridge interface=ether5 frame-types=admit-only-vlan-tagged
```

## 2. Таблица VLAN бриджа

Сам `bridge` указываем в `tagged`, иначе роутер не увидит трафик VLAN на своих интерфейсах.

```
/interface bridge vlan
add bridge=bridge vlan-ids=10 tagged=bridge,ether5 untagged=ether2,ether3
add bridge=bridge vlan-ids=20 tagged=bridge,ether5 untagged=ether4
add bridge=bridge vlan-ids=99 tagged=bridge,ether5
```

`untagged` при добавлении порта с `pvid` RouterOS подставляет динамически, но явная запись читается проще.

## 3. VLAN-интерфейсы и адреса

```
/interface vlan
add interface=bridge name=vlan10-office vlan-id=10
add interface=bridge name=vlan20-buh    vlan-id=20
add interface=bridge name=vlan99-guest  vlan-id=99

/ip address
add address=192.168.10.1/24 interface=vlan10-office
add address=192.168.20.1/24 interface=vlan20-buh
add address=192.168.99.1/24 interface=vlan99-guest
```

Дальше на каждый VLAN-интерфейс — свой пул и DHCP-сервер, как для обычной сети.

## 4. Изоляция через firewall

VLAN сами по себе ничего не запрещают: роутер маршрутизирует между ними. Изоляцию делает firewall.

```
/interface list add name=GUEST
/interface list member add list=GUEST interface=vlan99-guest

/ip firewall filter
add chain=forward action=drop in-interface-list=GUEST out-interface-list=!WAN comment="гости только в интернет"
add chain=forward action=drop in-interface=vlan10-office out-interface=vlan20-buh connection-state=new comment="офис не ходит в бухгалтерию"
```

## 5. Включаем фильтрацию

```
/interface bridge set bridge vlan-filtering=yes
```

## Проверка

```
/interface bridge vlan print
/interface bridge port print detail
```

У `vlan-ids=10` в `current-untagged` должны быть `ether2,ether3`, в `current-tagged` — `bridge,ether5`.

## Грабли

- **Управление роутером.** Если ты зашёл через `ether2`, а он стал access-портом VLAN 10, доступ останется только если на `vlan10-office` есть адрес. Не вешай адрес управления на сам `bridge` после включения фильтрации.
- **Аппаратная разгрузка.** На свитч-чипах CRS3xx VLAN filtering в бридже работает аппаратно. На старых моделях с другими чипами он может уйти в CPU, и скорость упадёт.
- **Wi-Fi.** Беспроводной интерфейс добавляется в бридж как access-порт со своим `pvid`, так же как `ether`.
