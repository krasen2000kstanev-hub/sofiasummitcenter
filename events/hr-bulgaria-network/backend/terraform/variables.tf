variable "name" {
  type    = string
  default = "hr-bulgaria-network-api"
}

variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "table_name" {
  type    = string
  default = "hr-bulgaria-network-registrations"
}

variable "allowed_origin" {
  type    = string
  default = "https://sofiasummit.bg"
}

variable "payment_link" {
  type    = string
  default = "https://epg.dskbank.bg/sc/YqwigIbIWMnGQnRP"
}

variable "from_email" {
  type = string
}

variable "budget_email" {
  type = string
}

variable "organizer_email" {
  type = string
}

variable "budget_limit_usd" {
  type    = string
  default = "1"
}

variable "dsk_webhook_secret" {
  type      = string
  sensitive = true
}
