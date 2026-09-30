output "api_url" {
  value       = aws_apigatewayv2_api.career_cafe.api_endpoint
  description = "Public API Gateway HTTP API endpoint for the career cafe API."
}

output "lambda_url" {
  value       = aws_lambda_function_url.registration.function_url
  description = "Legacy Lambda Function URL; API Gateway is the public endpoint."
}

output "dynamodb_table" {
  value = aws_dynamodb_table.registrations.name
}

output "ses_identity" {
  value = var.email_from
}
