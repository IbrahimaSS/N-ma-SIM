@echo off
rem Borne N'ma SIM : Firefox en plein ecran, impression directe du recu (sans fenetre d'impression).
rem Le recu part sur l'imprimante PAR DEFAUT de Windows.
rem Profil Firefox dedie, avec l'impression silencieuse activee dans son user.js.

set "URL_BORNE=http://localhost:3000/borne/accueil"
set "PROFIL=%LOCALAPPDATA%\NmaSIM\firefox-borne"

set "FIREFOX=%ProgramFiles%\Mozilla Firefox\firefox.exe"
if not exist "%FIREFOX%" set "FIREFOX=%ProgramFiles(x86)%\Mozilla Firefox\firefox.exe"
if not exist "%FIREFOX%" (
  echo Firefox est introuvable sur ce PC.
  pause
  exit /b 1
)

if not exist "%PROFIL%" mkdir "%PROFIL%"
(
  echo user_pref^("print.always_print_silent", true^);
  echo user_pref^("print.show_print_progress", false^);
  echo user_pref^("browser.shell.checkDefaultBrowser", false^);
  echo user_pref^("browser.sessionstore.resume_from_crash", false^);
) > "%PROFIL%\user.js"

start "" "%FIREFOX%" -no-remote -profile "%PROFIL%" -kiosk "%URL_BORNE%"
