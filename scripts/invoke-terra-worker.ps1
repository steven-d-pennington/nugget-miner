[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)]
    [ValidateNotNullOrEmpty()]
    [string]$Prompt,

    [ValidateSet("read-only", "workspace-write")]
    [string]$Sandbox = "workspace-write"
)

$codex = Join-Path $env:LOCALAPPDATA "Programs\OpenAI\Codex\bin\codex.exe"

if (-not (Test-Path -LiteralPath $codex)) {
    throw "The current standalone Codex CLI is required at '$codex'. Install or update it with the official OpenAI Windows installer before delegating to Terra."
}

$repoRoot = Split-Path -Parent $PSScriptRoot
$arguments = @(
    "exec"
    "--model", "gpt-5.6-terra"
    "--sandbox", $Sandbox
    "--cd", $repoRoot
    "--strict-config"
    "--json"
    $Prompt
)

& $codex @arguments
exit $LASTEXITCODE
