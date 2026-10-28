@echo off
rem Vide la file d'impression bloquee (document coince en "Suppression en cours").
rem A lancer en ADMINISTRATEUR : clic droit > Executer en tant qu'administrateur.

net session >nul 2>&1
if errorlevel 1 (
  echo Ce script doit etre lance en administrateur :
  echo clic droit sur vider-file-impression.bat ^> Executer en tant qu'administrateur.
  pause
  exit /b 1
)

echo Arret du service d'impression...
net stop spooler /y
del /q /f "%SystemRoot%\System32\spool\PRINTERS\*.*"
echo Redemarrage du service d'impression...
net start spooler
echo.
echo File d'impression videe.
pause
