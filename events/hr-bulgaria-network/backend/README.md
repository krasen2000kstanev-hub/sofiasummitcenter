# HR Bulgaria Network AWS backend

Минимален serverless backend за регистрация, DSK плащане и потвърдителен имейл.

## Локална проверка

```powershell
cd backend
npm install
npm test
```

## Deploy

1. Потвърди sender email-а и organizer email-а в SES.
2. Копирай `terraform.tfvars.example` като `terraform/terraform.tfvars`.
3. Попълни `from_email`, `organizer_email`, `budget_email` и DSK webhook secret.
4. Изпълни `./deploy.ps1 -Action plan`.
5. След преглед изпълни `./deploy.ps1 -Action apply`.
6. Копирай output `api_url` като `window.HR_API_BASE` във frontend-а.

DSK трябва да изпраща HMAC SHA-256 подпис в `X-DSK-Signature` и да връща `registrationId` или merchant reference. Статичният платежен линк сам по себе си не може да потвърди автоматично плащане.

SES е pay-as-you-go след приложимите AWS кредити/лимити. Budget ресурсът е настроен на нисък праг за ранно предупреждение.
