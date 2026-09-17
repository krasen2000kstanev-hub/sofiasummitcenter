output "api_url" {
  value       = aws_apigatewayv2_stage.default.invoke_url
  description = "Temporary API Gateway URL. Add a custom domain later."
}

output "dynamodb_table" {
  value = aws_dynamodb_table.events.name
}

output "ses_identity" {
  value = aws_sesv2_email_identity.site_domain.email_identity
}
