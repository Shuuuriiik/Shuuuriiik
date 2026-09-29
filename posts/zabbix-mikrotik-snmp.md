# Zabbix + MikroTik по SNMP за 10 минут

## 1. На MikroTik

Не используй дефолтное community `public`. Создай своё и ограничь адресом Zabbix-сервера:

```
/snmp community add name=zbx-ro addresses=10.0.0.5/32 read-access=yes write-access=no
/snmp community set [find name=public] disabled=yes
/snmp set enabled=yes contact="admin@example.ru" location="Серверная 305" trap-version=2
```

Если есть firewall на input (а он должен быть):

```
/ip firewall filter add chain=input protocol=udp dst-port=161 src-address=10.0.0.5 \
    action=accept comment="SNMP from Zabbix" place-before=0
```

Для продакшена лучше SNMPv3 (`authentication-protocol=SHA1 encryption-protocol=AES`), но v2c с ограничением по IP — разумный старт в закрытой сети.

## 2. Проверка с сервера Zabbix

```bash
snmpwalk -v2c -c zbx-ro 10.0.0.1 1.3.6.1.2.1.1
```

Должны прилететь `sysDescr`, `sysName`, `sysUpTime`. Тишина — смотри firewall и `addresses` у community.

## 3. В Zabbix

1. **Data collection → Hosts → Create host**.
2. Interfaces → **SNMP**, IP роутера, версия SNMPv2, community — `{$SNMP_COMMUNITY}`.
3. Templates → ищи **MikroTik** — в Zabbix 6+/7 есть шаблоны под конкретные модели (например, `MikroTik RB4011iGS+RM by SNMP`) и общий `Mikrotik by SNMP`.
4. Macros → `{$SNMP_COMMUNITY}` = `zbx-ro`.

Через пару минут появятся интерфейсы (LLD), CPU, память, температура, напряжение, а для LTE-моделей — уровень сигнала.

## 4. Что стоит добавить руками

- **Триггер на смену uptime** — ловит внезапные перезагрузки.
- **Трафик по WAN** на дашборд — первое, куда смотришь, когда «интернет тормозит».
- **Пороги температуры** под свою серверную: дефолтные бывают слишком оптимистичными.
