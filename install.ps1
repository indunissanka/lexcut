# LexCut installer for Windows 10/11. Safe to run again: it only adds what is missing.
#
#   .\install.ps1                    everything (system tools, transcription, voice, launchers)
#   .\install.ps1 -NoVoice           skip the ~2 GB voice environment (Voice Studio, speaker labels, Sinhala voice and transcription)
#   .\install.ps1 -NoLauncher        do not create the LexCut and Stop LexCut shortcuts
#   .\install.ps1 -DownloadModels    also download the Whisper, Sinhala Whisper and OpenVoice models now instead of on first use
#   .\install.ps1 -Mcp               also register the Claude connector (claude mcp add opencut ...)
#
# If PowerShell blocks the script, run install.cmd instead (or: powershell -ExecutionPolicy Bypass -File install.ps1).
# Environment overrides: LEXCUT_TTS_VENV (voice environment folder, default %USERPROFILE%\.opencut\venv-tts),
# LEXCUT_PORT (launcher port, default 8765).
param([switch]$NoVoice, [switch]$NoLauncher, [switch]$DownloadModels, [switch]$Mcp)
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'

$Root = $PSScriptRoot
$TtsVenv = if ($env:LEXCUT_TTS_VENV) { $env:LEXCUT_TTS_VENV } else { Join-Path $HOME '.opencut\venv-tts' }
$Port = if ($env:LEXCUT_PORT) { $env:LEXCUT_PORT } else { '8765' }
function Say($m) { Write-Host "`n==> $m" -ForegroundColor Cyan }
function Have($c) { [bool](Get-Command $c -ErrorAction SilentlyContinue) }
function Refresh-Path { $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' + [Environment]::GetEnvironmentVariable('Path', 'User') }
function Run($exe) {   # run a program with the remaining arguments; stop if it fails
  & $exe @args
  if ($LASTEXITCODE -ne 0) { throw "Command failed ($LASTEXITCODE): $exe $args" }
}

# 1. System tools
Say 'System tools (Python 3.11, ffmpeg)'
$Py = $null
if (Have 'py') { try { $Py = (& py -3.11 -c 'import sys; print(sys.executable)' 2>$null) } catch {} }
if (-not $Py) {
  if (-not (Have 'winget')) { throw 'Install Python 3.11 from https://www.python.org/downloads/windows/ (and ffmpeg), then run this again.' }
  winget install -e --id Python.Python.3.11 --scope user --accept-package-agreements --accept-source-agreements
  Refresh-Path
  if (Have 'py') { try { $Py = (& py -3.11 -c 'import sys; print(sys.executable)' 2>$null) } catch {} }
  if (-not $Py) {
    $guess = Join-Path $env:LOCALAPPDATA 'Programs\Python\Python311\python.exe'
    if (Test-Path $guess) { $Py = $guess }
  }
}
if (-not $Py) { throw 'Python 3.11 was not found after installing it. Open a new window and run this again.' }
Run $Py --version
if (-not (Have 'ffmpeg')) {
  if (Have 'winget') {
    winget install -e --id Gyan.FFmpeg --accept-package-agreements --accept-source-agreements
    Refresh-Path
  }
  if (-not (Have 'ffmpeg')) { Write-Warning 'ffmpeg is missing. Install it (winget install Gyan.FFmpeg) and open a new window.' }
}

# 2. Transcription (.venv next to server.py)
Say 'Transcription environment (.venv, faster-whisper)'
$VenvPy = Join-Path $Root '.venv\Scripts\python.exe'
if (-not (Test-Path $VenvPy)) { Run $Py -m venv (Join-Path $Root '.venv') }
Run $VenvPy -m pip install -q --upgrade pip
Run $VenvPy -m pip install -q -r (Join-Path $Root 'requirements\whisper-faster.txt')

# 3. Voice Studio, speaker labels, voice tools
$TtsPy = Join-Path $TtsVenv 'Scripts\python.exe'
if (-not $NoVoice) {
  Say "Voice environment (${TtsVenv}: Coqui XTTS, Resemblyzer), about 2 GB"
  New-Item -ItemType Directory -Force (Split-Path $TtsVenv) | Out-Null
  if (-not (Test-Path $TtsPy)) { Run $Py -m venv $TtsVenv }
  Run $TtsPy -m pip install -q --upgrade pip
  Run $TtsPy -m pip install -q -r (Join-Path $Root 'requirements\voice.txt')
  Run $TtsPy -m pip install -q --no-deps Resemblyzer==0.1.4
  # Sinhala voice: Piper model trained on OpenSLR 30 (MIT), https://huggingface.co/chan4lk/piper-tts-sinhala
  $Piper = Join-Path $Root 'models\piper'
  New-Item -ItemType Directory -Force $Piper | Out-Null
  foreach ($f in 'si_LK-sinhala-medium.onnx', 'si_LK-sinhala-medium.onnx.json') {
    $dst = Join-Path $Piper $f
    if (-not ((Test-Path $dst) -and (Get-Item $dst).Length -gt 0)) {
      Invoke-WebRequest -UseBasicParsing -Uri "https://huggingface.co/chan4lk/piper-tts-sinhala/resolve/main/$f" -OutFile $dst
    }
  }
  Write-Host 'The XTTS voice model (~2 GB) downloads the first time you create a voice, after you accept its licence in the app.'
}

# 4. Optional: models now
if ($DownloadModels) {
  Say 'Downloading models into models\'
  $env:HF_HOME = Join-Path $Root 'models'
  Run $VenvPy -c "from faster_whisper.utils import download_model; download_model('large-v3')"
  Remove-Item Env:HF_HOME
  if (-not $NoVoice) {
    $env:HF_HUB_CACHE = Join-Path $Root 'models\hub'
    Run $TtsPy -c "from huggingface_hub import snapshot_download; snapshot_download('SinhaSpeech/whisper-small-sinhala-run12-best')"
    Remove-Item Env:HF_HUB_CACHE
    $env:TTS_HOME = Join-Path $Root 'models\tts'; $env:COQUI_TOS_AGREED = '1'
    Run $TtsPy -c "from TTS.api import TTS; TTS('voice_conversion_models/multilingual/multi-dataset/openvoice_v2')"
    Remove-Item Env:TTS_HOME; Remove-Item Env:COQUI_TOS_AGREED
  }
}

# 5. Claude features (chat assistant, grammar fix, highlights, MCP connector)
Say 'Claude Code CLI'
$Claude = (Get-Command claude -ErrorAction SilentlyContinue).Source
if (-not $Claude -and (Test-Path "$HOME\.local\bin\claude.exe")) { $Claude = "$HOME\.local\bin\claude.exe" }
$McpScript = Join-Path $Root 'opencut_mcp.py'
if ($Claude) {
  Write-Host 'Found claude. The Claude features use your Claude login (no API key).'
  if ($Mcp) {
    & $Claude mcp get opencut *> $null
    if ($LASTEXITCODE -eq 0) { Write-Host "Connector 'opencut' already registered." } else { Run $Claude mcp add opencut -- $Py $McpScript }
  } else {
    Write-Host "To let Claude edit your project: claude mcp add opencut -- `"$Py`" `"$McpScript`"  (or run install.ps1 -Mcp)"
  }
} else {
  Write-Host 'Not found. Claude features stay off until you install it: https://claude.com/claude-code'
}

# 6. Launchers: shortcuts on the desktop and in the Start menu
if (-not $NoLauncher) {
  Say 'Shortcuts (desktop and Start menu)'
  $shell = New-Object -ComObject WScript.Shell
  $places = @([Environment]::GetFolderPath('Desktop'), (Join-Path ([Environment]::GetFolderPath('Programs')) 'LexCut'))
  foreach ($dir in $places) {
    New-Item -ItemType Directory -Force $dir | Out-Null
    foreach ($pair in @(@('LexCut', 'start'), @('Stop LexCut', 'stop'))) {
      $lnk = Join-Path $dir "$($pair[0]).lnk"
      $s = $shell.CreateShortcut($lnk)
      $s.TargetPath = (Get-Command powershell).Source
      $s.Arguments = "-NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File `"$(Join-Path $Root 'lexcut.ps1')`" $($pair[1]) $Port"
      $s.WorkingDirectory = $Root
      $s.IconLocation = if ($pair[1] -eq 'start') { "$env:SystemRoot\System32\imageres.dll,18" } else { "$env:SystemRoot\System32\imageres.dll,100" }
      $s.Save()
    }
    Write-Host "Created shortcuts in $dir"
  }
}

# 7. Summary
Say 'Summary'
function Ok($label, [scriptblock]$test) {
  $r = $false; try { $r = [bool](& $test) } catch {}
  Write-Host ("  [{0}] {1}" -f $(if ($r) { 'x' } else { ' ' }), $label)
}
Ok 'ffmpeg (export, noise removal, scene and silence detection)' { Have 'ffmpeg' }
Ok 'Transcription (faster-whisper)' { & $VenvPy -c 'import faster_whisper' 2>$null; $LASTEXITCODE -eq 0 }
Ok 'Voice Studio and speaker labels' { (Test-Path $TtsPy) -and $(& $TtsPy -c "import sys, types; sys.modules['webrtcvad'] = types.ModuleType('webrtcvad'); import TTS, resemblyzer" 2>$null; $LASTEXITCODE -eq 0) }
Ok 'Sinhala voice (Piper + OpenVoice) and Sinhala transcription' { (Test-Path (Join-Path $Root 'models\piper\si_LK-sinhala-medium.onnx')) -and $(& $TtsPy -c 'import piper, transformers' 2>$null; $LASTEXITCODE -eq 0) }
Ok 'Ready-made voices (Windows speech voices)' { $true }
Ok 'Claude features (claude CLI)' { [bool]$Claude }
Write-Host '  Paid cloud tools (Replicate) need no install: paste your key in AI > AI Cloud tools > Settings.'
Write-Host ''
Write-Host "Start LexCut: double-click the LexCut shortcut on your desktop (or: .venv\Scripts\python.exe server.py $Port)"
Write-Host "Then open http://localhost:$Port/ in Chrome or Edge."
