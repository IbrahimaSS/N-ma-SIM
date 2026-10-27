@echo off
rem Borne N'ma SIM : Chrome en plein ecran, impression directe du recu (sans fenetre d'impression).
rem Le recu part sur l'imprimante PAR DEFAUT de Windows.
rem Profil Chrome dedie : les options sont appliquees meme si Chrome est deja ouvert ailleurs.

set "URL_BORNE=http://localhost:3000/borne/accueil"
set "PROFIL=%LOCALAPPDATA%\NmaSIM\chrome-borne"

set "CHROME=%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" (
  echo Chrome est introuvable sur ce PC.
  pause
  exit /b 1
)

start "" "%CHROME%" --kiosk --kiosk-printing --user-data-dir="%PROFIL%" --no-first-run --disable-session-crashed-bubble "%URL_BORNE%"
