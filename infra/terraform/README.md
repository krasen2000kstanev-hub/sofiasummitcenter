# AWS Terraform mock infrastructure

This is a small, non-production Terraform skeleton for the Sofia Summit Center event backend.

It defines:

- CloudFront in front of the existing GitHub Pages origin
- API Gateway HTTP API
- Lambda mock handler
- DynamoDB on-demand table
- SES domain identity
- Secrets Manager placeholder
- IAM permissions and CloudWatch logs

It does not contain AWS access keys and has not been applied. The example values are placeholders, but `terraform apply` would still create billable cloud resources.

## Preview locally

```powershell
terraform init
terraform fmt -check
terraform validate
terraform plan -var-file=terraform.tfvars.example
```

Before a real apply, replace the mock Lambda logic, configure SES DNS verification, add the DSK integration secrets outside source control, and add ACM/CloudFront custom-domain configuration. Do not commit `terraform.tfvars` or state files.
