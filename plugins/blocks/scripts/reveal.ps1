# Shows a folder or file in File Explorer and brings the window to the front.
# Windows does not let a background process take the foreground: without this, the window opens behind the editor.
# A folder that is already open is not duplicated; its window is raised instead.
# The path comes in BLOCKS_PATH; the file is selected when BLOCKS_SELECT=1.
$ErrorActionPreference = 'SilentlyContinue'
Add-Type -Namespace BlocksWin -Name U -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c);
[DllImport("user32.dll")] public static extern bool IsIconic(IntPtr h);
[DllImport("user32.dll")] public static extern void keybd_event(byte v, byte s, uint f, UIntPtr e);
'@

$path = $env:BLOCKS_PATH
$select = $env:BLOCKS_SELECT -eq '1'
$norm = { param($p) ([string]$p).Replace('/', '\').TrimEnd('\') }
$target = & $norm $path
# What it really is gets decided by the disk, not by the button's label.
if (Test-Path -LiteralPath $target -PathType Container) { $select = $false }
elseif (Test-Path -LiteralPath $target -PathType Leaf) { $select = $true }
$folder = if ($select) { & $norm (Split-Path -Parent $target) } else { $target }

function Find-Window([string]$dir) {
  foreach ($x in (New-Object -ComObject Shell.Application).Windows()) {
    try {
      if (-not $x.LocationURL.StartsWith('file:')) { continue }
      if (([uri]$x.LocationURL).LocalPath.TrimEnd('\') -ieq $dir) { return [IntPtr][int64]$x.HWND }
    } catch {}
  }
  return [IntPtr]::Zero
}

$h = Find-Window $folder
if ($h -eq [IntPtr]::Zero) {
  if ($select) { Start-Process 'C:\Windows\explorer.exe' -ArgumentList ('/select,"' + $target + '"') }
  else { Start-Process 'C:\Windows\explorer.exe' -ArgumentList ('"' + $target + '"') }
} elseif ($select) {
  # The folder is already open: select the file in that window (1 select + 4 deselect others + 8 show + 16 focus).
  foreach ($x in (New-Object -ComObject Shell.Application).Windows()) {
    try {
      if ([IntPtr][int64]$x.HWND -ne $h) { continue }
      $x.Document.SelectItem($x.Document.Folder.ParseName((Split-Path -Leaf $target)), 29)
    } catch {}
  }
}
for ($i = 0; $i -lt 40 -and $h -eq [IntPtr]::Zero; $i++) {
  Start-Sleep -Milliseconds 100
  $h = Find-Window $folder
}
if ($h -eq [IntPtr]::Zero) { Write-Output 'no-window'; exit 2 }

if ([BlocksWin.U]::IsIconic($h)) { [BlocksWin.U]::ShowWindow($h, 9) | Out-Null }
for ($try = 0; $try -lt 5; $try++) {
  # Pressing the unused F24 key gives this process the right to raise a window.
  [BlocksWin.U]::keybd_event(0x87, 0, 0, [UIntPtr]::Zero)
  [BlocksWin.U]::keybd_event(0x87, 0, 2, [UIntPtr]::Zero)
  [BlocksWin.U]::SetForegroundWindow($h) | Out-Null
  Start-Sleep -Milliseconds 120
  if ([BlocksWin.U]::GetForegroundWindow() -eq $h) { Write-Output 'front'; exit 0 }
}
Write-Output 'behind'
exit 3
