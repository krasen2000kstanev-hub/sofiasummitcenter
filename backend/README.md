# Sofia Summit Events API

Минимален Cloudflare Worker + D1 backend за NAIL BUSINESS RE:START и бъдещи събития.

## Стартиране

1. Създайте D1 база в Cloudflare и запишете нейния ID в `wrangler.toml`.
2. Приложете `schema.sql` към базата.
3. Добавете secrets: `ADMIN_USER`, `ADMIN_PASSWORD`, `DSK_WEBHOOK_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`.
4. Добавете реалните DSK payment links към `ticket_types.dsk_url`.
5. Настройте DSK webhook към `/api/payments/dsk/webhook` според формата от договора на търговеца.

## API

- `GET /api/health`
- `GET /api/events/:slug`
- `POST /api/orders`
- `POST /api/payments/dsk/webhook`
- `GET /api/tickets/:token`
- `GET /api/admin/orders` — Basic Auth
- `GET /api/admin/export.csv` — Basic Auth

Worker-ът не приема и не съхранява картови данни. Формата създава временна поръчка за 30 минути, а потвърденият DSK статус я превръща в платена регистрация и задейства имейл с билет.
