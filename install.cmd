@echo off
rem LexCut installer for Windows. Double-click this file, or run it from a Command Prompt with the same options as install.ps1.
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0install.ps1" %*
if errorlevel 1 pause
