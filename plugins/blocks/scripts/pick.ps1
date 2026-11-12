# The Windows "Choose files" window for an answer in a badge: the user picks the files, the mod gets only their paths.
# Copies nothing, reads nothing, sends nothing. Paths go out one per line, UTF-8.
# BLOCKS_DIR is the folder to start from, BLOCKS_TITLE is the window title.
# The window stays on top of the editor: without this a background process opens it behind.
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding $false
Add-Type -AssemblyName System.Windows.Forms
Add-Type -Namespace BlocksPick -Name U -MemberDefinition @'
[DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
[DllImport("user32.dll")] public static extern void keybd_event(byte v, byte s, uint f, UIntPtr e);
'@

$owner = New-Object System.Windows.Forms.Form
$owner.TopMost = $true
$owner.ShowInTaskbar = $false
$owner.FormBorderStyle = 'None'
$owner.StartPosition = 'CenterScreen'
$owner.Size = New-Object System.Drawing.Size 1, 1
$owner.Opacity = 0
$owner.Show()
# A press of the unused F24 key gives this process the right to bring its window to the front.
[BlocksPick.U]::keybd_event(0x87, 0, 0, [UIntPtr]::Zero)
[BlocksPick.U]::keybd_event(0x87, 0, 2, [UIntPtr]::Zero)
[BlocksPick.U]::SetForegroundWindow($owner.Handle) | Out-Null

$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Multiselect = $true
$dialog.CheckFileExists = $true
$dialog.Filter = 'All files (*.*)|*.*|Images|*.png;*.jpg;*.jpeg;*.webp;*.gif;*.bmp;*.svg|Text, Markdown, HTML|*.md;*.txt;*.html;*.htm'
if ($env:BLOCKS_TITLE) { $dialog.Title = $env:BLOCKS_TITLE }
if ($env:BLOCKS_DIR -and (Test-Path -LiteralPath $env:BLOCKS_DIR -PathType Container)) { $dialog.InitialDirectory = $env:BLOCKS_DIR }

$answer = $dialog.ShowDialog($owner)
$owner.Close()
if ($answer -ne [System.Windows.Forms.DialogResult]::OK) { exit 1 }
foreach ($name in $dialog.FileNames) { [Console]::Out.WriteLine($name) }
exit 0
