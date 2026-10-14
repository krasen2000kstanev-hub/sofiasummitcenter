param(
  [ValidateSet('plan', 'apply')]
  [string]$Action = 'plan'
)

$ErrorActionPreference = 'Stop'
$backend = $PSScriptRoot
$terraform = Join-Path $backend 'terraform'
$lambda = Join-Path $backend '.lambda'

if (-not (Test-Path $lambda)) { New-Item -ItemType Directory -Path $lambda | Out-Null }
Copy-Item (Join-Path $backend 'src\*') $lambda -Recurse -Force
Copy-Item (Join-Path $backend 'package.json') $lambda -Force
Push-Location $lambda
try { npm install --omit=dev } finally { Pop-Location }

Push-Location $terraform
try {
  terraform init
  terraform validate
  terraform $Action -var-file='terraform.tfvars'
} finally {
  Pop-Location
}
