# Copies the hub template into a project in one step (Windows).
# It never deletes and never overwrites: a file that already exists is kept and reported.
# No network, no admin rights, nothing outside the project folder is changed.
#
# Run: powershell -NoProfile -ExecutionPolicy Bypass -File copy_template.ps1 -Project "<project folder>"

param(
    [Parameter(Mandatory = $true)][string]$Project
)

$ErrorActionPreference = 'Stop'
$template = Join-Path $PSScriptRoot '..\template'
$template = (Resolve-Path -LiteralPath $template).Path.TrimEnd('\', '/')

if (-not (Test-Path -LiteralPath $Project -PathType Container)) {
    Write-Output "STOP: no such folder: $Project"
    exit 2
}
$target = (Resolve-Path -LiteralPath $Project).Path.TrimEnd('\', '/')

$copied = 0
$kept = 0
Get-ChildItem -LiteralPath $template -Recurse -File -Force | Sort-Object FullName | ForEach-Object {
    $relative = $_.FullName.Substring($template.Length + 1)
    $destination = Join-Path $target $relative
    if (Test-Path -LiteralPath $destination) {
        Write-Output "kept (already there): $($relative -replace '\\', '/')"
        $kept++
        return
    }
    $folder = Split-Path -Parent $destination
    if (-not (Test-Path -LiteralPath $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
    }
    # The last argument $false means: fail rather than overwrite.
    [System.IO.File]::Copy($_.FullName, $destination, $false)
    Write-Output "copied: $($relative -replace '\\', '/')"
    $copied++
}

Write-Output "DONE: $copied copied, $kept kept as they were"
