@echo off
rem Borne N'ma SIM : Edge en plein ecran, impression directe du recu (sans fenetre d'impression).
rem Le recu part sur l'imprimante PAR DEFAUT de Windows.
rem Profil Edge dedie : les options sont appliquees meme si Edge est deja ouvert ailleurs.

set "URL_BORNE=http://localhost:3000/borne/accueil"
set "PROFIL=%LOCALAPPDATA%\NmaSIM\edge-borne"

set "EDGE=%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" set "EDGE=%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"
if not exist "%EDGE%" (
  echo Edge est introuvable sur ce PC.
  pause
  exit /b 1
)

start "" "%EDGE%" --kiosk "%URL_BORNE%" --edge-kiosk-type=fullscreen --kiosk-printing --user-data-dir="%PROFIL%" --no-first-run
