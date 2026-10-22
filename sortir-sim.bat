@echo off
setlocal
cd /d "%~dp0"
python -c "import serial" >nul 2>&1
if errorlevel 1 (
    echo Python avec pyserial est requis. Installez-le avec : python -m pip install pyserial
    pause
    exit /b 1
)
python "pilote_SK-AD3_NmaSIM\sortir_sim.py" %*
set "sim_exit_code=%errorlevel%"
pause
exit /b %sim_exit_code%
