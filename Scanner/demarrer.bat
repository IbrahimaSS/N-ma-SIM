@echo off
echo ==============================================
echo  Demarrage de l'API Scanner de documents...
echo ==============================================
cd /d "%~dp0"
pip install -r requirements.txt --quiet
python api_scanner.py
pause
