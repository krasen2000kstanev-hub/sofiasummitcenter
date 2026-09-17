variable "aws_region" {
  type        = string
  description = "AWS region for the backend resources."
  default     = "eu-central-1"
}

variable "project_name" {
  type        = string
  description = "Short project name used in resource names."
  default     = "sofiasummit"
}

variable "site_domain" {
  type        = string
  description = "Verified domain used by SES."
  default     = "sofiasummit.bg"
}

variable "github_pages_origin" {
  type        = string
  description = "GitHub Pages hostname used as the CloudFront origin."
  default     = "krasen2000kstanev-hub.github.io"
}

variable "api_base_url" {
  type        = string
  description = "Public API URL passed to the event pages."
  default     = "https://api.sofiasummit.bg"
}

variable "inquiry_notify_email" {
  type        = string
  description = "Inbox that receives new website inquiries."
  default     = ""
}

variable "admin_user" {
  type = string
  description = "Admin username for inquiry review."
  default = ""
}
variable "admin_password" {
  type = string
  sensitive = true
  description = "Admin password for inquiry review."
  default = ""
}
