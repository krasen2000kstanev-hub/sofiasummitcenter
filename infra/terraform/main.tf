locals {
  name_prefix = "${var.project_name}-career-cafe"
}

data "archive_file" "registration_lambda" {
  type        = "zip"
  source_dir  = "${path.module}/lambda"
  output_path = "${path.module}/lambda.zip"
  excludes    = ["handler.zip", "test"]
}

resource "aws_dynamodb_table" "registrations" {
  name         = local.name_prefix
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "id"

  attribute {
    name = "id"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
}

resource "aws_dynamodb_table_item" "config" {
  table_name = aws_dynamodb_table.registrations.name
  hash_key   = aws_dynamodb_table.registrations.hash_key
  item = jsonencode({
    id            = { S = "CONFIG#career-cafe" }
    type          = { S = "config" }
    discountNames = { L = [] }
  })
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
        Action   = ["dynamodb:GetItem", "dynamodb:PutItem", "dynamodb:Scan", "dynamodb:UpdateItem"]
        Resource = aws_dynamodb_table.registrations.arn
      },
      { Effect = "Allow", Action = ["ses:SendEmail", "ses:SendRawEmail"], Resource = "*" },
      { Effect = "Allow", Action = ["logs:CreateLogGroup"], Resource = "*" },
      {
        Effect   = "Allow"
        Action   = ["logs:CreateLogStream", "logs:PutLogEvents"]
        Resource = "arn:aws:logs:${var.aws_region}:*:log-group:/aws/lambda/${local.name_prefix}:*"
      }
    ]
  })
}

resource "aws_lambda_function" "registration" {
  function_name    = local.name_prefix
  role             = aws_iam_role.lambda.arn
  runtime          = "nodejs22.x"
  handler          = "handler.handler"
  filename         = data.archive_file.registration_lambda.output_path
  source_code_hash = data.archive_file.registration_lambda.output_base64sha256
  timeout          = 20
  memory_size      = 512

  environment {
    variables = {
      TABLE_NAME         = aws_dynamodb_table.registrations.name
      PUBLIC_API_URL     = var.public_api_url
      FRONTEND_ORIGIN    = var.frontend_origin
      EMAIL_FROM         = var.email_from
      ADMIN_TOKEN        = var.admin_token
      DSK_WEBHOOK_SECRET = var.dsk_webhook_secret
      DSK_ESPRESSO_URL   = var.dsk_espresso_url
      DSK_DOPPIO_URL     = var.dsk_doppio_url
      DSK_LUNGO_URL      = var.dsk_lungo_url
      DSK_PARKING_URL    = var.dsk_parking_url
    }
  }
}

resource "aws_lambda_function_url" "registration" {
  function_name      = aws_lambda_function.registration.function_name
  authorization_type = "NONE"
  cors {
    allow_credentials = false
    allow_origins     = [var.frontend_origin]
    allow_methods     = ["GET", "POST"]
    allow_headers     = ["content-type", "authorization", "x-dsk-signature"]
    max_age           = 86400
  }
}

resource "aws_lambda_permission" "public_url" {
  statement_id           = "AllowPublicFunctionUrl"
  action                 = "lambda:InvokeFunctionUrl"
  function_name          = aws_lambda_function.registration.function_name
  principal              = "*"
  function_url_auth_type = "NONE"
}

resource "aws_lambda_permission" "public_invoke" {
  statement_id             = "AllowPublicInvokeViaFunctionUrl"
  action                   = "lambda:InvokeFunction"
  function_name            = aws_lambda_function.registration.function_name
  principal                = "*"
  invoked_via_function_url = true
}

resource "aws_apigatewayv2_api" "career_cafe" {
  name          = "${local.name_prefix}-http"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.frontend_origin]
    allow_methods = ["GET", "POST", "OPTIONS"]
    allow_headers = ["content-type", "authorization", "x-dsk-signature"]
  }
}

resource "aws_apigatewayv2_integration" "career_cafe" {
  api_id                 = aws_apigatewayv2_api.career_cafe.id
  integration_type       = "AWS_PROXY"
  integration_uri        = aws_lambda_function.registration.invoke_arn
  integration_method     = "POST"
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "default" {
  api_id    = aws_apigatewayv2_api.career_cafe.id
  route_key = "$default"
  target    = "integrations/${aws_apigatewayv2_integration.career_cafe.id}"
}

resource "aws_apigatewayv2_stage" "default" {
  api_id      = aws_apigatewayv2_api.career_cafe.id
  name        = "$default"
  auto_deploy = true
}

resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowHttpApiInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.registration.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.career_cafe.execution_arn}/*/*"
}
