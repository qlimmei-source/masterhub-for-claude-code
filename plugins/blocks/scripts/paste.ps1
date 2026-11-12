# "Paste" for an answer in a badge. What the clipboard holds:
#   a screenshot (Win+Shift+S, PrintScreen): saved as PNG into the project folder, its path goes out;
#   files copied in File Explorer (Ctrl+C): their paths go out, the files themselves are not touched;
#   a text path to a file ("Copy as path", Ctrl+Shift+C in File Explorer): that path goes out if the file exists.
# Sends nothing and does not read the files' contents. Paths go out one per line, UTF-8; nothing found: exit code 2.
# BLOCKS_ROOT is the project root; screenshots go to <root>/08_AGENTS/answer-files/ if the project has 08_AGENTS,
# otherwise to <root>/.claude/answer-files/. BLOCKS_NAME is the start of the screenshot's name (q1).
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

if ([System.Windows.Forms.Clipboard]::ContainsFileDropList()) {
  $found = 0
  foreach ($path in [System.Windows.Forms.Clipboard]::GetFileDropList()) {
    if (Test-Path -LiteralPath $path -PathType Leaf) { [Console]::Out.WriteLine($path); $found++ }
  }
  if ($found -gt 0) { exit 0 }
}

if ([System.Windows.Forms.Clipboard]::ContainsImage()) {
  $root = $env:BLOCKS_ROOT
  if (-not $root -or -not (Test-Path -LiteralPath $root -PathType Container)) { exit 3 }
  $agents = Join-Path $root '08_AGENTS'
  $dir = if (Test-Path -LiteralPath $agents -PathType Container) { Join-Path $agents 'answer-files' } else { Join-Path (Join-Path $root '.claude') 'answer-files' }
  New-Item -ItemType Directory -Force -Path $dir | Out-Null
  $prefix = if ($env:BLOCKS_NAME -match '^[\w-]{1,20}$') { $env:BLOCKS_NAME } else { 'answer' }
  $stamp = Get-Date -Format 'yyyy-MM-dd_HHmmss'
  $file = Join-Path $dir "${stamp}_${prefix}.png"
  for ($k = 2; Test-Path -LiteralPath $file; $k++) { $file = Join-Path $dir "${stamp}_${prefix}_$k.png" }
  $image = [System.Windows.Forms.Clipboard]::GetImage()
  $image.Save($file, [System.Drawing.Imaging.ImageFormat]::Png)
  $image.Dispose()
  [Console]::Out.WriteLine($file)
  exit 0
}

if ([System.Windows.Forms.Clipboard]::ContainsText()) {
  $text = [System.Windows.Forms.Clipboard]::GetText().Trim()
  $found = 0
  foreach ($line in ($text -split "`r?`n")) {
    $path = $line.Trim().Trim('"')
    if ($path -and $path.Length -lt 1024 -and (Test-Path -LiteralPath $path -PathType Leaf)) { [Console]::Out.WriteLine($path); $found++ }
  }
  if ($found -gt 0) { exit 0 }
}

exit 2
