# Career Cafe AWS backend

Minimal AWS backend for the Career Cafe form, DSK payments, paid ticket emails and QR check-in.

## Services

- Lambda + Function URL: JSON API and DSK webhook.
- DynamoDB: registrations and `CONFIG#career-cafe` discount-name list.
- SES: paid-ticket email with an inline QR PNG.
- IAM and CloudWatch Logs: least-privilege access and diagnostics.

## Build and deploy

From `infra/terraform/lambda`, install the Lambda-only dependencies:

```powershell
npm install --omit=dev
```

Copy `terraform.tfvars.example` to `terraform.tfvars`, then fill in the verified SES sender and admin token. DSK values may stay empty until the payment links and webhook secret are available. Apply twice: the first apply creates the Function URL; put that URL into `public_api_url` and apply again so QR codes point to the deployed API.

```powershell
terraform init
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
terraform apply -var-file=terraform.tfvars
```

The real DSK and admin values must never be committed. The Terraform state contains Lambda environment values, so keep the state private.

## API

- `POST /registrations`
- `POST /payments/dsk/webhook` with `X-DSK-Signature` (optional until DSK is configured)
- `GET /tickets/{token}`
- `POST /admin/orders/{id}/mark-paid` with `Authorization: Bearer <ADMIN_TOKEN>`
- `POST /admin/tickets/{token}/check-in` with `Authorization: Bearer <ADMIN_TOKEN>`

The initial `CONFIG#career-cafe` record has an empty `discountNames` list. Add names through DynamoDB Console as a DynamoDB List. The Lambda normalizes case and whitespace before matching.

SES must have a verified sender. New SES accounts are sandboxed until production access is granted, so initial tests can only send to verified recipients. Before DSK is configured, use the protected `mark-paid` endpoint to test the paid-ticket email flow.

## Add DSK later

Set these Lambda environment variables in the AWS Console when the payment links are ready:

- `DSK_ESPRESSO_URL`
- `DSK_DOPPIO_URL`
- `DSK_LUNGO_URL`
- `DSK_PARKING_URL`
- `DSK_WEBHOOK_SECRET`

Configure DSK to call `/payments/dsk/webhook`. Until then, registrations are stored without payment links and can be completed through the protected manual `mark-paid` endpoint.
