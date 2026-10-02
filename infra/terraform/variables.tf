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

variable "inquiry_notify_emails" {
  type        = list(string)
  description = "Recipients for new venue inquiries."
  default     = ["tsvetelin@pleggi.com", "krasen.k.stanev@gmail.com"]
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

variable "dsk_espresso_parking_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_doppio_parking_url" {
  type      = string
  sensitive = true
  default   = ""
}

variable "dsk_lungo_parking_url" {
  type      = string
  sensitive = true
  default   = ""
}
