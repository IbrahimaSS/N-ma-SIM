@echo off
echo ==============================================
echo  Demarrage de l'API Scanner de documents...
echo ==============================================
cd /d "%~dp0"
:: Fermer toute ancienne instance du scanner sur le port 8010
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8010 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>&1
python api_scanner.py
pause
