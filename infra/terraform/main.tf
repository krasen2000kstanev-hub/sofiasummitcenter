locals {
  name_prefix = "${var.project_name}-events"
}

data "archive_file" "registration_lambda" {
  type        = "zip"
  source_file = "${path.module}/lambda/handler.js"
  output_path = "${path.module}/lambda/handler.zip"
}

resource "aws_dynamodb_table" "events" {
  name         = local.name_prefix
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }
}

resource "aws_sesv2_email_identity" "site_domain" {
  email_identity = var.site_domain
}

resource "aws_iam_role" "lambda" {
  name = "${local.name_prefix}-lambda"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect    = "Allow"
      Principal = { Service = "lambda.amazonaws.com" }
      Action    = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy" "lambda" {
  name = "${local.name_prefix}-lambda-policy"
  role = aws_iam_role.lambda.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = ["dynamodb:PutItem", "dynamodb:GetItem", "dynamodb:UpdateItem", "dynamodb:TransactWriteItems", "dynamodb:Scan"]
        Resource = aws_dynamodb_table.events.arn
      },
      {
        Effect   = "Allow"
        Action   = ["ses:SendEmail", "ses:SendRawEmail"]
        Resource = "*"
      }
    ]
  })
}

resource "aws_lambda_function" "registration" {
  function_name    = "${local.name_prefix}-registration"
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "handler.handler"
  filename         = data.archive_file.registration_lambda.output_path
  source_code_hash = data.archive_file.registration_lambda.output_base64sha256

  environment {
    variables = {
      TABLE_NAME   = aws_dynamodb_table.events.name
      PUBLIC_SITE  = "https://sofiasummit.bg"
      API_BASE_URL = var.api_base_url
      EMAIL_FROM   = "noreply@sofiasummit.bg"
      INQUIRY_NOTIFY_EMAIL = var.inquiry_notify_email
    }
  }
}

resource "aws_apigatewayv2_api" "events" {
  name          = local.name_prefix
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = ["https://sofiasummit.bg"]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type"]
  }
}

resource "aws_apigatewayv2_integration" "registration" {
  api_id                 = aws_apigatewayv2_api.events.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.registration.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "registration" {
  api_id    = aws_apigatewayv2_api.events.id
  route_key = "POST /registrations"
  target    = "integrations/${aws_apigatewayv2_integration.registration.id}"
}

resource "aws_apigatewayv2_route" "inquiries" {
  api_id    = aws_apigatewayv2_api.events.id
  route_key = "POST /inquiries"
  target    = "integrations/${aws_apigatewayv2_integration.registration.id}"
}

resource "aws_apigatewayv2_route" "availability" {
  api_id    = aws_apigatewayv2_api.events.id
  route_key = "GET /availability"
  target    = "integrations/${aws_apigatewayv2_integration.registration.id}"
}

resource "aws_apigatewayv2_route" "dsk_webhook" {
  api_id    = aws_apigatewayv2_api.events.id
  route_key = "POST /payments/dsk/webhook"
  target    = "integrations/${aws_apigatewayv2_integration.registration.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.events.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowHttpApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.registration.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.events.execution_arn}/*/*"
}
