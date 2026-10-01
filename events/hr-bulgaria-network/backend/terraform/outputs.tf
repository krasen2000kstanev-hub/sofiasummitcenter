output "api_url" { value = aws_apigatewayv2_stage.default.invoke_url }
output "registrations_table" { value = aws_dynamodb_table.registrations.name }
output "ses_identity" { value = aws_sesv2_email_identity.sender.email_identity }
