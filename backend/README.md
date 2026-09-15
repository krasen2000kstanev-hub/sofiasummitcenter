# Sofia Summit Events API

Минимален Cloudflare Worker + D1 backend за NAIL BUSINESS RE:START и бъдещи събития.

## Стартиране

1. Създайте D1 база в Cloudflare и запишете нейния ID в `wrangler.toml`.
2. Приложете `schema.sql` към нова база или `migrations/0002_individual_tickets.sql` към съществуваща база.
3. Добавете secrets: `ADMIN_USER`, `ADMIN_PASSWORD`, `DSK_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
4. Добавете реалните DSK payment links към `ticket_types.dsk_url`.
5. Настройте DSK webhook към `/api/payments/dsk/webhook` според формата от договора на търговеца.

## API

- `GET /api/health`
- `GET /api/events/:slug`
- `POST /api/orders`
- `POST /api/payments/dsk/webhook`
- `GET /api/tickets/:token` — публична проверка на индивидуален билет
- `POST /api/admin/tickets/:token/check-in` — маркиране на билет като използван (Basic Auth)
- `GET /api/admin/orders` — Basic Auth
- `GET /api/admin/export.csv` — Basic Auth

Worker-ът не приема и не съхранява картови данни. Формата създава временна поръчка за 30 минути, а потвърденият DSK статус я превръща в платена регистрация и изпраща отделен PDF билет на всеки участник. PDF-ът използва вградения `assets/arial.ttf` за коректна кирилица и следва одобрения Canva-inspired визуален стил, без QR код. Автоматичното изпращане е идемпотентно; повторно изпращане се извършва само чрез изрично действие в админ панела.

## Безопасно тестване

Тестовете се изпълняват само с локална D1 база и не трябва да се насочват към продукционния Worker:

```powershell
npx wrangler d1 execute DB --local --file=schema.sql --config wrangler.test.toml
npx wrangler dev --local --config wrangler.test.toml
```

Тестовата конфигурация използва отделната база `sofiasummit-events-test`, `localhost` и тестов подател. За нова локална база се прилага `schema.sql`; migration файлът е само за вече съществуваща база. Локалното състояние се записва в `backend/.wrangler/`, което е изключено от Git. Проверки на live системата се ограничават до GET заявки и вече съществуващи платени поръчки.
