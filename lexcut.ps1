# Start or stop the LexCut server on Windows. Used by the LexCut and Stop LexCut shortcuts that install.ps1 creates.
#   powershell -ExecutionPolicy Bypass -File lexcut.ps1 start [port]
#   powershell -ExecutionPolicy Bypass -File lexcut.ps1 stop [port]
param([string]$Action = 'start', [string]$Port = '8765')
Add-Type -AssemblyName System.Windows.Forms
$Root = $PSScriptRoot
$Url = "http://localhost:$Port/"

function Test-Running {
  try { Invoke-WebRequest -UseBasicParsing -TimeoutSec 2 -Uri $Url | Out-Null; return $true } catch { return $false }
}
function Get-ServerPids {
  @(Get-NetTCPConnection -LocalPort ([int]$Port) -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique)
}

if ($Action -eq 'stop') {
  $pids = Get-ServerPids
  if (-not $pids) {
    [System.Windows.Forms.MessageBox]::Show('The LexCut server is not running.', 'LexCut') | Out-Null
    exit
  }
  $answer = [System.Windows.Forms.MessageBox]::Show("Stop the LexCut server?`n`nAnything still being generated will be lost. Your project stays saved in your browser.", 'LexCut', 'OKCancel', 'Warning')
  if ($answer -ne 'OK') { exit }
  foreach ($p in $pids) { Stop-Process -Id $p -Force -ErrorAction SilentlyContinue }
  [System.Windows.Forms.MessageBox]::Show('LexCut server stopped.', 'LexCut') | Out-Null
  exit
}

if (-not (Test-Running)) {
  $py = Join-Path $Root '.venv\Scripts\python.exe'
  if (-not (Test-Path $py)) { $py = (Get-Command python -ErrorAction SilentlyContinue).Source }
  if (-not $py) {
    [System.Windows.Forms.MessageBox]::Show("Python was not found. Run install.cmd in $Root first.", 'LexCut', 'OK', 'Error') | Out-Null
    exit 1
  }
  $log = Join-Path $env:TEMP 'lexcut.log'
  Start-Process -FilePath $py -ArgumentList @('server.py', $Port) -WorkingDirectory $Root -WindowStyle Hidden `
    -RedirectStandardOutput $log -RedirectStandardError "$log.err"
  for ($i = 0; $i -lt 30 -and -not (Test-Running); $i++) { Start-Sleep -Milliseconds 500 }
  if (-not (Test-Running)) {
    [System.Windows.Forms.MessageBox]::Show("LexCut did not start. See $log.err", 'LexCut', 'OK', 'Error') | Out-Null
    exit 1
  }
}
Start-Process $Url
