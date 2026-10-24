@echo off
title Detener Donner Drum Studio
cd /d "%~dp0"

echo Deteniendo servidor de Donner Drum Studio...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000" ^| findstr "LISTENING"') do (
    taskkill /F /PID %%a >nul 2>&1
)
echo Listo. Servidor apagado correctamente.
ping 127.0.0.1 -n 2 >nul
