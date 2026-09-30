# HR Bulgaria Network

Статичен лендинг за HR Bulgaria Network, предназначен за GitHub Pages и субдомейн на Sofia Summit Center.

## Какво съдържа

- Hero секция с 15 хоризонтални снимки от последното и предишни събития.
- Автоматична смяна на hero снимките през 5 секунди, редуваща двете събития.
- Секции за общността, лекторите, снимките от събитията и регистрацията.
- Форма за регистрация с български полета и достъпни radio/checkbox контроли.
- Подготвен поток към Deska Payment Link след попълване на формата.

## Локален preview

```powershell
node preview-server.cjs
```

След това отвори `http://127.0.0.1:4173/`.

## Публикуване

1. В GitHub включи Pages от branch `main` и папка `/ (root)`.
2. За субдомейн добави `CNAME` файл с точния адрес и DNS CNAME запис към GitHub Pages.
3. Постави реалния Deska Payment Link в `script.js` на `PAYMENT_LINK`.

## Поддръжка

- Hero снимките са в `assets/hero/`.
- Снимките в долните секции са в `assets/events/`.
- Линкът към Pixieset се поддържа в секцията „Снимки от събития“ на `index.html`.
