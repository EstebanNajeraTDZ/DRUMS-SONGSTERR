@echo off
title Donner DED-300X Drum Practice Studio
cd /d "%~dp0"

echo ========================================================
echo   Donner DED-300X Drum Practice Studio
echo ========================================================
echo.

:: 1. Comprobar si Python esta instalado
where python >nul 2>&1
if %errorlevel% neq 0 goto :no_python

:: 2. Comprobar librerias de Python
python -c "import flask, guitarpro, mido" >nul 2>&1
if %errorlevel% neq 0 goto :install_deps

:ready
echo 1. Abriendo navegador en http://localhost:5000...
echo 2. Servidor activo. Para apagarlo presiona Ctrl+C o ejecuta detener.bat
echo.

:: Abre el navegador sin errores de redireccion
start "" /b cmd /c "ping 127.0.0.1 -n 3 >nul & start http://localhost:5000"
python server.py
goto :end

:install_deps
echo [CONFIGURACION] Detectadas librerias faltantes de Python.
echo Instalando dependencias desde requirements.txt...
python -m pip install -r requirements.txt
if %errorlevel% neq 0 goto :pip_error
echo Dependencias instaladas correctamente!
echo.
goto :ready

:no_python
echo [ERROR] Python no esta instalado o no se encuentra en el PATH.
echo Por favor instala Python 3.10 o superior desde https://www.python.org/
echo IMPORTANTE: Marca la casilla Add Python to PATH durante la instalacion.
echo.
pause
exit /b 1

:pip_error
echo [ERROR] No se pudieron instalar las dependencias con pip.
echo Por favor revisa tu conexion a internet e intenta de nuevo.
echo.
pause
exit /b 1

:end
pause
