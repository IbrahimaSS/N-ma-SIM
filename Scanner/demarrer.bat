@echo off
setlocal
echo ==============================================
echo  Demarrage de l'API Scanner de documents...
echo ==============================================
cd /d "%~dp0"
if not exist ".venv\Scripts\python.exe" (
    echo Creation de l'environnement Python...
    python -m venv .venv
    if errorlevel 1 goto setup_error
    echo Installation des dependances...
    ".venv\Scripts\python.exe" -m pip install -r requirements.txt
    if errorlevel 1 goto setup_error
)
".venv\Scripts\python.exe" -X utf8 lancer_api.py
if errorlevel 1 echo L'API Scanner s'est arretee avec une erreur.
pause
exit /b

:setup_error
echo Echec de la preparation de l'environnement Python.
pause
exit /b 1
