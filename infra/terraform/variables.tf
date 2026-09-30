variable "aws_region" {
  type    = string
  default = "eu-central-1"
}

variable "project_name" {
  type    = string
  default = "sofiasummit"
}

variable "public_api_url" {
  type        = string
  description = "The deployed Lambda Function URL, used in QR codes."
  default     = ""
}

variable "frontend_origin" {
  type    = string
  default = "https://sofiasummit.bg"
}

variable "email_from" {
  type        = string
  description = "Verified SES sender email address or domain."
  default     = ""
}

variable "admin_token" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_webhook_secret" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_espresso_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_doppio_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_lungo_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_parking_url" {
  type      = string
  sensitive = true
  default   = ""
}
